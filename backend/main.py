import logging
import os
from typing import Any, List

import ccxt
import gspread
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google.oauth2.service_account import Credentials
from pydantic import BaseModel

from backend.routers.crypto import router as crypto_router
from backend.routers.mail import router as mail_router
from backend.routers.retirement import router as retirement_router
from backend.routers.security import router as security_router

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("dashboard_backend")

# Load environment variables
load_dotenv(override=True)

app = FastAPI(title="Dashboard Backend API", version="1.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static frontend files
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Routers
app.include_router(retirement_router)
app.include_router(mail_router)
app.include_router(crypto_router)
app.include_router(security_router)


# Helper function to check if Kraken is configured
def get_kraken_client():
    api_key = os.getenv("KRAKEN_API_KEY")
    secret = os.getenv("KRAKEN_SECRET")

    if not api_key or not secret or "your_kraken_api_key" in api_key:
        return None

    try:
        exchange = ccxt.kraken(
            {
                "apiKey": api_key,
                "secret": secret,
                "enableRateLimit": True,
            }
        )
        return exchange
    except Exception as e:
        logger.error(f"Error initializing Kraken client: {e}")
        return None


# Helper function to check if Google Sheets is configured
def get_sheets_client():
    service_account_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "backend/credentials.json")
    spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID")

    if (
        not os.path.exists(service_account_file)
        or not spreadsheet_id
        or "your_spreadsheet_id" in spreadsheet_id
    ):
        return None, None

    try:
        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]
        credentials = Credentials.from_service_account_file(service_account_file, scopes=scopes)
        gc = gspread.authorize(credentials)
        sh = gc.open_by_key(spreadsheet_id)
        return gc, sh
    except Exception as e:
        logger.error(f"Error initializing Google Sheets client: {e}")
        return None, None


# --- Models ---
class SheetDataPayload(BaseModel):
    sheet_name: str
    values: List[List[Any]]


class SheetAppendPayload(BaseModel):
    sheet_name: str
    row_values: List[Any]


# --- Routes ---


@app.get("/")
async def root():
    return {"message": "Welcome to the Dashboard API. Go to /docs for API documentation."}


@app.get("/api/status")
async def status():
    """Returns the integration configuration status."""
    kraken_configured = get_kraken_client() is not None
    sheets_gc, sheets_sh = get_sheets_client()
    sheets_configured = sheets_sh is not None

    return {
        "status": "healthy",
        "integrations": {
            "kraken": {
                "configured": kraken_configured,
                "mode": "live" if kraken_configured else "mock",
            },
            "google_sheets": {
                "configured": sheets_configured,
                "mode": "live" if sheets_configured else "mock",
            },
        },
    }


# --- Kraken Crypto Endpoints ---


@app.get("/api/kraken/ticker/{pair:path}")
async def get_ticker(pair: str):
    """
    Fetches the ticker info for a crypto pair.
    Uses ccxt live API if credentials are set, otherwise returns mock data.
    """
    exchange = get_kraken_client()

    # Live mode
    if exchange:
        try:
            # ccxt normalises Kraken pairs (e.g. XXBTZUSD → BTC/USD)
            ticker = exchange.fetch_ticker(pair)
            return {
                "mode": "live",
                "pair": pair,
                "symbol": ticker.get("symbol", pair),
                "last": ticker.get("last"),
                "high": ticker.get("high"),
                "low": ticker.get("low"),
                "bid": ticker.get("bid"),
                "ask": ticker.get("ask"),
                "change_24h": ticker.get("percentage"),
                "volume": ticker.get("baseVolume"),
                "timestamp": ticker.get("timestamp"),
            }
        except Exception as e:
            logger.error(f"Kraken API error fetching ticker {pair}: {e}")
            # Fall through to mock on exception for seamless developer experience

    # Mock fallback
    logger.info(f"Using mock ticker data for {pair}")
    mock_tickers = {
        "BTC/USD": {
            "last": 67500.0,
            "high": 68200.0,
            "low": 66100.0,
            "change_24h": 1.85,
            "volume": 12500,
        },
        "ETH/USD": {
            "last": 3450.0,
            "high": 3520.0,
            "low": 3390.0,
            "change_24h": -0.45,
            "volume": 85000,
        },
        "SOL/USD": {
            "last": 165.5,
            "high": 172.0,
            "low": 161.2,
            "change_24h": 4.12,
            "volume": 450000,
        },
        "ADA/USD": {"last": 0.48, "high": 0.50, "low": 0.47, "change_24h": 0.5, "volume": 12000000},
    }

    clean_pair = pair.upper()
    if clean_pair not in mock_tickers:
        clean_pair = "BTC/USD"

    data = mock_tickers[clean_pair]
    return {
        "mode": "mock",
        "pair": pair,
        "symbol": clean_pair,
        "last": data["last"],
        "high": data["high"],
        "low": data["low"],
        "bid": data["last"] * 0.999,
        "ask": data["last"] * 1.001,
        "change_24h": data["change_24h"],
        "volume": data["volume"],
        "timestamp": 1716942000000,
    }


@app.get("/api/kraken/balance")
async def get_balance():
    """
    Fetches kraken account balance.
    Uses ccxt live API if credentials are set, otherwise returns mock data.
    """
    exchange = get_kraken_client()

    if exchange:
        try:
            balance = exchange.fetch_balance()
            # Extract non-zero balances
            free_balances = {k: v for k, v in balance.get("free", {}).items() if v > 0}
            total_balances = {k: v for k, v in balance.get("total", {}).items() if v > 0}
            return {"mode": "live", "free": free_balances, "total": total_balances, "raw": balance}
        except Exception as e:
            logger.error(f"Kraken API error fetching balance: {e}")
            # Fall through to mock on exception

    logger.info("Using mock balance data")
    return {
        "mode": "mock",
        "free": {"USD": 12450.75, "BTC": 0.4258, "ETH": 2.15, "SOL": 12.5},
        "total": {"USD": 12450.75, "BTC": 0.4258, "ETH": 2.15, "SOL": 12.5},
    }


# --- Google Sheets Endpoints ---


@app.get("/api/sheets/data/{sheet_name}")
async def get_sheet_data(sheet_name: str):
    """
    Fetches all records from a specific sheet tab.
    Uses gspread live API if credentials are set, otherwise returns mock data.
    """
    gc, sh = get_sheets_client()

    if sh:
        try:
            worksheet = sh.worksheet(sheet_name)
            records = worksheet.get_all_records()
            return {"mode": "live", "sheet_name": sheet_name, "records": records}
        except Exception as e:
            logger.error(f"Google Sheets API error fetching {sheet_name}: {e}")
            # Fall through to mock on exception

    logger.info(f"Using mock sheet data for {sheet_name}")

    # Mock data depending on the sheet name
    if "transactions" in sheet_name.lower():
        mock_records = [
            {
                "date": "2026-05-25",
                "type": "Buy",
                "asset": "BTC",
                "amount": 0.05,
                "price": 68000,
                "total": 3400.0,
                "notes": "Weekly DCA",
            },
            {
                "date": "2026-05-26",
                "type": "Buy",
                "asset": "SOL",
                "amount": 5.0,
                "price": 160.0,
                "total": 800.0,
                "notes": "Dip buying",
            },
            {
                "date": "2026-05-27",
                "type": "Deposit",
                "asset": "USD",
                "amount": 1000.0,
                "price": 1.0,
                "total": 1000.0,
                "notes": "Bank transfer",
            },
            {
                "date": "2026-05-28",
                "type": "Sell",
                "asset": "ETH",
                "amount": 0.5,
                "price": 3500.0,
                "total": 1750.0,
                "notes": "Profit taking",
            },
        ]
    elif "portfolio" in sheet_name.lower():
        mock_records = [
            {"asset": "BTC", "holdings": 0.4258, "avg_buy_price": 58500.0},
            {"asset": "ETH", "holdings": 2.15, "avg_buy_price": 2890.0},
            {"asset": "SOL", "holdings": 12.5, "avg_buy_price": 142.5},
            {"asset": "USD", "holdings": 12450.75, "avg_buy_price": 1.0},
        ]
    else:
        mock_records = [
            {"col1": "Row 1 Val 1", "col2": "Row 1 Val 2"},
            {"col1": "Row 2 Val 1", "col2": "Row 2 Val 2"},
        ]

    return {"mode": "mock", "sheet_name": sheet_name, "records": mock_records}


@app.post("/api/sheets/update")
async def update_sheet_data(payload: SheetDataPayload):
    """
    Overwrites the worksheet values.
    """
    gc, sh = get_sheets_client()

    if sh:
        try:
            worksheet = sh.worksheet(payload.sheet_name)
            # Clear and update worksheet
            worksheet.clear()
            worksheet.update("A1", payload.values)
            return {
                "mode": "live",
                "status": "success",
                "message": f"Successfully updated sheet {payload.sheet_name}",
            }
        except Exception as e:
            logger.error(f"Google Sheets API error updating {payload.sheet_name}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    logger.info(f"Simulating sheet update for {payload.sheet_name}")
    return {
        "mode": "mock",
        "status": "success",
        "message": f"[Mock] Successfully simulated updating sheet {payload.sheet_name}",
    }


@app.post("/api/sheets/append")
async def append_sheet_row(payload: SheetAppendPayload):
    """
    Appends a row to the worksheet.
    """
    gc, sh = get_sheets_client()

    if sh:
        try:
            worksheet = sh.worksheet(payload.sheet_name)
            worksheet.append_row(payload.row_values)
            return {
                "mode": "live",
                "status": "success",
                "message": f"Successfully appended row to sheet {payload.sheet_name}",
            }
        except Exception as e:
            logger.error(f"Google Sheets API error appending to {payload.sheet_name}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    logger.info(f"Simulating appending row to {payload.sheet_name}: {payload.row_values}")
    return {
        "mode": "mock",
        "status": "success",
        "message": f"[Mock] Successfully simulated appending row to sheet {payload.sheet_name}",
    }
