import logging
from datetime import datetime, timezone
from typing import Any

import psutil
from fastapi import APIRouter

router = APIRouter(prefix="/api/security", tags=["security"])
logger = logging.getLogger("dashboard_backend")

_SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}

_SUSPICIOUS_NAMES = {
    "mimikatz",
    "psexec",
    "psexesvc",
    "netcat",
    "ncat",
    "nc",
    "cobaltstrike",
    "beacon",
    "meterpreter",
    "rubeus",
    "bloodhound",
    "procdump",
}

_SUSPICIOUS_PATH_FRAGMENTS = [
    "\\appdata\\local\\temp\\",
    "\\windows\\temp\\",
    "\\downloads\\",
    "\\public\\",
]

_COMMON_LISTEN_PORTS = {
    80,
    443,
    445,
    135,
    139,
    3000,
    3306,
    5000,
    5432,
    5353,
    7680,
    8000,
    8080,
    27017,
}

_MOCK_SCAN: dict[str, Any] = {
    "mode": "mock",
    "scanned_at": "2026-06-06T12:00:00+00:00",
    "process_count": 142,
    "findings": [
        {
            "pid": 9148,
            "name": "update_helper.exe",
            "path": "C:\\Users\\demo\\AppData\\Local\\Temp\\update_helper.exe",
            "severity": "medium",
            "reason": "Executable launched from an unusual location (appdata\\local\\temp).",
            "started": "2026-06-06T07:42:11+00:00",
        },
        {
            "pid": 5521,
            "name": "svchost.exe",
            "path": None,
            "severity": "low",
            "reason": "Executable path could not be resolved (possibly protected or unsigned).",
            "started": "2026-06-06T06:10:03+00:00",
        },
        {
            "pid": 7734,
            "name": "node.exe",
            "path": "C:\\Program Files\\nodejs\\node.exe",
            "severity": "low",
            "reason": "Listening on uncommon port 41223 — verify this is an expected dev service.",
            "started": "2026-06-06T08:01:55+00:00",
        },
    ],
}


def _classify_process(info: dict[str, Any]) -> list[dict[str, str]]:
    """Return a list of {severity, reason} issues for a single process."""
    issues: list[dict[str, str]] = []
    name = (info.get("name") or "").lower()
    stem = name[:-4] if name.endswith(".exe") else name
    path = (info.get("exe") or "") or ""
    path_lower = path.lower()

    if name in _SUSPICIOUS_NAMES or stem in _SUSPICIOUS_NAMES:
        issues.append(
            {
                "severity": "high",
                "reason": f"Process name '{info.get('name')}' matches a known-malicious indicator.",
            }
        )

    if path_lower:
        for fragment in _SUSPICIOUS_PATH_FRAGMENTS:
            if fragment in path_lower:
                location = fragment.strip(chr(92))
                reason = f"Executable launched from an unusual location ({location})."
                issues.append({"severity": "medium", "reason": reason})
                break
    elif info.get("pid", 0) > 8:
        issues.append(
            {
                "severity": "low",
                "reason": "Executable path could not be resolved (possibly protected or unsigned).",
            }
        )

    return issues


def _scan_listening_ports(by_pid: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    """Flag processes listening on uncommon TCP/UDP ports."""
    findings: list[dict[str, Any]] = []
    try:
        connections = psutil.net_connections(kind="inet")
    except (psutil.AccessDenied, PermissionError):
        return findings

    seen_pids: set[int] = set()
    for conn in connections:
        if conn.status != psutil.CONN_LISTEN or not conn.laddr:
            continue
        port = conn.laddr.port
        if port in _COMMON_LISTEN_PORTS or conn.pid is None:
            continue
        if conn.pid in seen_pids:
            continue
        seen_pids.add(conn.pid)
        info = by_pid.get(conn.pid, {})
        reason = f"Listening on uncommon port {port} — verify this is an expected dev service."
        findings.append(
            {
                "pid": conn.pid,
                "name": info.get("name") or "unknown",
                "path": info.get("exe"),
                "severity": "low",
                "reason": reason,
                "started": _isoformat(info.get("create_time")),
            }
        )
    return findings


def _isoformat(epoch: float | None) -> str | None:
    if not epoch:
        return None
    return datetime.fromtimestamp(epoch, tz=timezone.utc).isoformat()


@router.get("/scan")
async def scan_processes() -> dict[str, Any]:
    """
    Scans running Windows processes for suspicious indicators (unusual launch
    paths, known-malware name patterns, unresolved executables, uncommon
    listening ports). Falls back to mock data if psutil is unavailable or the
    scan fails outright.
    """
    try:
        findings: list[dict[str, Any]] = []
        by_pid: dict[int, dict[str, Any]] = {}
        process_count = 0

        for proc in psutil.process_iter(["pid", "name", "exe", "create_time"]):
            process_count += 1
            try:
                info = proc.info
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
            by_pid[info["pid"]] = info
            for issue in _classify_process(info):
                findings.append(
                    {
                        "pid": info.get("pid"),
                        "name": info.get("name") or "unknown",
                        "path": info.get("exe"),
                        "severity": issue["severity"],
                        "reason": issue["reason"],
                        "started": _isoformat(info.get("create_time")),
                    }
                )

        findings.extend(_scan_listening_ports(by_pid))
        findings.sort(key=lambda f: _SEVERITY_ORDER.get(f["severity"], 99))

        return {
            "mode": "live",
            "scanned_at": datetime.now(tz=timezone.utc).isoformat(),
            "process_count": process_count,
            "findings": findings,
        }
    except Exception as e:
        logger.error(f"Security scan error: {e}")

    return _MOCK_SCAN
