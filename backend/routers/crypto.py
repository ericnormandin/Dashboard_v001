import logging

import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/api/crypto", tags=["crypto"])
logger = logging.getLogger("dashboard_backend")

_FNG_URL = "https://api.alternative.me/fng/"
_MOCK_FNG = {"mode": "mock", "value": 55, "label": "Neutral"}


@router.get("/fear-greed")
async def get_fear_greed() -> dict:
    """Fetch the Crypto Fear & Greed Index from alternative.me."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(_FNG_URL)
            resp.raise_for_status()
            item = resp.json()["data"][0]
            return {
                "mode": "live",
                "value": int(item["value"]),
                "label": item["value_classification"],
            }
    except Exception as e:
        logger.error(f"Fear & Greed fetch error: {e}")
    return _MOCK_FNG
