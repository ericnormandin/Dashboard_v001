import json
import logging
import shutil
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

router = APIRouter(prefix="/api/stella", tags=["stella"])
logger = logging.getLogger("dashboard_backend")

_DATA_DIR = Path(__file__).parent.parent.parent / "Stella_data"
_TIMELINE_FILE = _DATA_DIR / "timeline.json"
_PROFILE_FILE = _DATA_DIR / "profile.json"
_HEALTH_FILE = _DATA_DIR / "health.json"
_MEDIA_DIR = _DATA_DIR / "media"

_DEFAULT_PROFILE: dict[str, Any] = {
    "name": "Stella Normandin",
    "birthday": "2023-02-14",
    "height": "98 cm",
    "weight": "14.2 kg",
    "eye_color": "Brown",
    "hair_color": "Brown",
    "photo": None,
}

_ALLOWED_SUFFIXES = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".mp4",  # H.264 — Chrome/Firefox/Safari compatible
    ".webm",  # VP8/VP9 — Chrome/Firefox compatible
}


def _read_timeline() -> list[dict[str, Any]]:
    try:
        return json.loads(_TIMELINE_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []
    except Exception as exc:
        logger.error("Failed to read timeline.json: %s", exc)
        raise HTTPException(status_code=500, detail="Could not read timeline data")


def _write_timeline(milestones: list[dict[str, Any]]) -> None:
    try:
        _DATA_DIR.mkdir(parents=True, exist_ok=True)
        _TIMELINE_FILE.write_text(
            json.dumps(milestones, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception as exc:
        logger.error("Failed to write timeline.json: %s", exc)
        raise HTTPException(status_code=500, detail="Could not save timeline data")


class TimelinePayload(BaseModel):
    milestones: list[dict[str, Any]]


_DEFAULT_HEALTH: list[dict[str, Any]] = [
    {
        "date": "2026-05-02",
        "height_cm": 98.0,
        "weight_kg": 14.2,
        "head_circ_cm": 50.5,
        "sleep_hrs": 10.5,
        "height_pct": 65,
        "weight_pct": 58,
        "head_circ_pct": 72,
        "vaccines_done": 8,
        "vaccines_total": 9,
        "notes": "All clear · next in 6 months — Dr. Lafleur",
    }
]


class HealthEntry(BaseModel):
    date: str
    height_cm: float | None = None
    weight_kg: float | None = None
    head_circ_cm: float | None = None
    sleep_hrs: float | None = None
    height_pct: int | None = None
    weight_pct: int | None = None
    head_circ_pct: int | None = None
    vaccines_done: int | None = None
    vaccines_total: int | None = None
    notes: str = ""


class ProfilePayload(BaseModel):
    name: str
    birthday: str
    height: str
    weight: str
    eye_color: str = ""
    hair_color: str = ""
    photo: str | None = None


def _read_profile() -> dict[str, Any]:
    try:
        return json.loads(_PROFILE_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return dict(_DEFAULT_PROFILE)
    except Exception as exc:
        logger.error("Failed to read profile.json: %s", exc)
        raise HTTPException(status_code=500, detail="Could not read profile data")


def _write_profile(profile: dict[str, Any]) -> None:
    try:
        _DATA_DIR.mkdir(parents=True, exist_ok=True)
        _PROFILE_FILE.write_text(
            json.dumps(profile, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception as exc:
        logger.error("Failed to write profile.json: %s", exc)
        raise HTTPException(status_code=500, detail="Could not save profile data")


@router.get("/timeline")
def get_timeline() -> list[dict[str, Any]]:
    return _read_timeline()


@router.post("/timeline")
def save_timeline(payload: TimelinePayload) -> dict[str, str]:
    _write_timeline(payload.milestones)
    return {"status": "ok"}


@router.get("/profile")
def get_profile() -> dict[str, Any]:
    return _read_profile()


@router.post("/profile")
def save_profile(payload: ProfilePayload) -> dict[str, str]:
    _write_profile(payload.model_dump())
    return {"status": "ok"}


def _read_health() -> list[dict[str, Any]]:
    try:
        return json.loads(_HEALTH_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return list(_DEFAULT_HEALTH)
    except Exception as exc:
        logger.error("Failed to read health.json: %s", exc)
        raise HTTPException(status_code=500, detail="Could not read health data")


def _write_health(entries: list[dict[str, Any]]) -> None:
    try:
        _DATA_DIR.mkdir(parents=True, exist_ok=True)
        _HEALTH_FILE.write_text(
            json.dumps(entries, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception as exc:
        logger.error("Failed to write health.json: %s", exc)
        raise HTTPException(status_code=500, detail="Could not save health data")


@router.get("/health")
def get_health() -> list[dict[str, Any]]:
    entries = _read_health()
    entries.sort(key=lambda e: e.get("date", ""), reverse=True)
    return entries


@router.post("/health")
def add_health_entry(entry: HealthEntry) -> dict[str, str]:
    entries = _read_health()
    entries.append(entry.model_dump())
    entries.sort(key=lambda e: e.get("date", ""), reverse=True)
    _write_health(entries)
    return {"status": "ok"}


@router.delete("/health/{date}")
def delete_health_entry(date: str) -> dict[str, str]:
    entries = _read_health()
    entries = [e for e in entries if e.get("date") != date]
    _write_health(entries)
    return {"status": "ok"}


@router.post("/upload")
async def upload_media(file: UploadFile = File(...)) -> dict[str, str]:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in _ALLOWED_SUFFIXES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")
    _MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{suffix}"
    dest = _MEDIA_DIR / name
    with dest.open("wb") as buf:
        shutil.copyfileobj(file.file, buf)
    logger.info("Saved media: %s", dest)
    return {"url": f"http://127.0.0.1:8000/stella-media/{name}"}
