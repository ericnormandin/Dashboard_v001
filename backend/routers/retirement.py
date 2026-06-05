import logging
import os

from fastapi import APIRouter

router = APIRouter(prefix="/api/retirement", tags=["retirement"])
logger = logging.getLogger("dashboard_backend")

# Portfolio snapshot — mirrors the static data shown in retirement_goal.sys
_PORTFOLIO = {
    "current_total": 344000,
    "goal": 1_500_000,
    "progress_pct": 23.0,
    "yearly_growth_estimate": 78400,
    "years_to_goal": 14.7,
    "breakdown": {
        "crypto": 30900,
        "account": 45800,
        "stocks": 127500,
        "total_rrsp": 145000,
    },
    "credit_card_balance": -4800,
}

_MOCK_PLAN = (
    "RETIREMENT_PLAN // MOCK_MODE\n\n"
    "CURRENT_STATUS: 23.0% of $1.5M goal reached. On track.\n\n"
    "ACTION_ITEMS:\n"
    "1. Max RRSP contributions — estimated $29,210 room available\n"
    "2. Clear $4,800 credit card balance — guaranteed ~20% ROI\n"
    "3. Reduce crypto exposure (9%) and redirect to index funds\n"
    "4. Increase yearly contributions by $10K to compress timeline\n"
    "5. Review TFSA room for additional tax-sheltered growth\n\n"
    "PROJECTED_RETIREMENT: 2040-2041 at current trajectory\n"
    "RISK_LEVEL: Moderate — diversification adequate but improvable"
)

_MOCK_INSIGHTS = (
    "FEASIBILITY_ANALYSIS // MOCK_MODE\n\n"
    "VERDICT: ACHIEVABLE with moderate adjustments\n\n"
    "RISKS:\n"
    "• 14.7yr timeline assumes consistent 22.7% annual growth — aggressive\n"
    "• Crypto volatility (9% of portfolio) adds ±$3K swing risk quarterly\n"
    "• $4,800 CC debt erodes compounding at ~20% APR\n\n"
    "SUGGESTED_MODIFICATIONS:\n"
    "1. Pay off $4,800 CC debt immediately — guaranteed 20% return\n"
    "2. Rebalance crypto from 9% to 5%, redirect delta to RRSP index\n"
    "3. Add $500/mo contribution to compress timeline by ~2.6 years\n\n"
    "CONFIDENCE_SCORE: 72% — Plan is solid with debt elimination"
)


def _get_anthropic_client():
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key or "your_" in api_key:
        return None
    try:
        import anthropic

        return anthropic.Anthropic(api_key=api_key)
    except Exception as e:
        logger.error(f"Anthropic client init error: {e}")
        return None


def _portfolio_context() -> str:
    p = _PORTFOLIO
    b = p["breakdown"]
    return (
        f"Current total: ${p['current_total']:,}\n"
        f"Retirement goal: ${p['goal']:,}\n"
        f"Progress: {p['progress_pct']}%\n"
        f"Yearly growth estimate: ${p['yearly_growth_estimate']:,}\n"
        f"Est. years to goal: {p['years_to_goal']}\n"
        f"Crypto: ${b['crypto']:,}\n"
        f"Account: ${b['account']:,}\n"
        f"Stocks: ${b['stocks']:,}\n"
        f"Total RRSP: ${b['total_rrsp']:,}\n"
        f"Credit card balance: ${p['credit_card_balance']:,}"
    )


@router.post("/ai-plan")
async def generate_retirement_plan() -> dict:
    """Generate a structured retirement plan from current portfolio data."""
    client = _get_anthropic_client()

    if client:
        try:
            prompt = (
                "You are a financial advisor. Based on this retirement portfolio snapshot, "
                "generate a structured plan with 4-5 concrete action items and a timeline.\n\n"
                f"Portfolio:\n{_portfolio_context()}\n\n"
                "Respond in a concise terminal-style format. No markdown. "
                "Use ALL_CAPS for section headers. Under 220 words."
            )
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=450,
                messages=[{"role": "user", "content": prompt}],
            )
            return {"mode": "live", "plan": message.content[0].text}
        except Exception as e:
            logger.error(f"Anthropic API error (ai-plan): {e}")

    return {"mode": "mock", "plan": _MOCK_PLAN}


@router.post("/ai-insights")
async def analyze_retirement_feasibility() -> dict:
    """Analyze plan feasibility and return actionable modifications."""
    client = _get_anthropic_client()

    if client:
        try:
            p = _PORTFOLIO
            prompt = (
                "You are a financial advisor. Critically assess whether this retirement goal "
                "is achievable and provide 3 specific modifications or risk warnings.\n\n"
                f"Portfolio:\n{_portfolio_context()}\n"
                f"Remaining to goal: ${p['goal'] - p['current_total']:,}\n\n"
                "Respond in terminal-style format. ALL_CAPS headers. No markdown. Under 220 words."
            )
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=450,
                messages=[{"role": "user", "content": prompt}],
            )
            return {"mode": "live", "insights": message.content[0].text}
        except Exception as e:
            logger.error(f"Anthropic API error (ai-insights): {e}")

    return {"mode": "mock", "insights": _MOCK_INSIGHTS}
