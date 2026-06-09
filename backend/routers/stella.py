import json
import logging
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/stella", tags=["stella"])
logger = logging.getLogger("dashboard_backend")

_DATA_DIR = Path(__file__).parent.parent.parent / "Stella_data"
_TIMELINE_FILE = _DATA_DIR / "timeline.json"


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


@router.get("/timeline")
def get_timeline() -> list[dict[str, Any]]:
    return _read_timeline()


@router.post("/timeline")
def save_timeline(payload: TimelinePayload) -> dict[str, str]:
    _write_timeline(payload.milestones)
    return {"status": "ok"}
