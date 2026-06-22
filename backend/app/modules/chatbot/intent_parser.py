import re
import json
import logging
from datetime import datetime, timedelta
from app.core.config import settings
from app.modules.reports.registry import REPORT_REGISTRY

try:
    from groq import Groq
except ImportError:
    Groq = None

logger = logging.getLogger(__name__)


def parse_intent(message: str, context: dict = None) -> dict:
    """Parse user message into a structured intent, using Groq LLM if configured."""
    msg = message.lower().strip()
    context = context or {}

    # Check if Groq API key is configured
    if settings.GROQ_API_KEY and Groq is not None:
        try:
            intent = parse_intent_with_groq(message, context)
            if intent:
                return intent
        except Exception as e:
            logger.error(f"Failed parsing intent with Groq: {e}. Falling back to deterministic parser.")

    # Fallback / Default deterministic parser
    return parse_intent_deterministic(message, context)


def parse_intent_with_groq(message: str, context: dict = None) -> dict:
    """Use Groq LLM to parse natural language ERP requests into a structured schema."""
    context = context or {}
    client = Groq(api_key=settings.GROQ_API_KEY)

    today_str = datetime.now().strftime("%Y-%m-%d")
    weekday_str = datetime.now().strftime("%A")

    # Serialize registry metadata for the prompt
    registry_summary = []
    for rid, d in REPORT_REGISTRY.items():
        registry_summary.append({
            "report_id": rid,
            "title": d["title"],
            "formats": d["formats"],
            "filters": d["filters"],
            "synonyms": d["synonyms"]
        })

    system_prompt = f"""You are a helper parsing natural language user commands into structured commands for a Textile ERP Reporting system.
Today's date is: {today_str} ({weekday_str}).

Available reports in the system:
{json.dumps(registry_summary, indent=2)}

You MUST output a valid JSON object matching this schema:
{{
  "action": "generate_report" | "list_reports" | "general_query" | "greeting",
  "report_id": "matching report_id from the list above or null",
  "format": "pdf" | "excel" | "csv" (default to pdf if not specified, only choose from allowed formats for that report),
  "filters": {{
     "from_date": "YYYY-MM-DD format (resolve relative dates relative to today: {today_str})",
     "to_date": "YYYY-MM-DD format (resolve relative dates)",
     "party": "extracted customer/supplier/party name if mentioned",
     "status": "extracted status value if mentioned"
  }}
}}

Rules:
1. If user says greeting (hi, hello, etc), set action to "greeting".
2. If user wants list of reports or catalog, set action to "list_reports".
3. If user wants to query/download/generate/export a specific report:
   - Match the report_id by synonyms, title, or keywords.
   - Set action to "generate_report".
   - Extract filters (dates must be YYYY-MM-DD format, resolve relative dates like "last month", "this week", "today", "yesterday", "this year").
4. If no report is requested, or it's a general question not relating to generating reports, set action to "general_query".
5. DO NOT add any extra conversational text or markdown. Return ONLY the JSON object.
"""

    user_content = f"Message: \"{message}\"\nContext: {json.dumps(context)}"

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        model=settings.GROQ_MODEL,
        response_format={"type": "json_object"},
        temperature=0.0,
    )

    response_text = chat_completion.choices[0].message.content
    intent = json.loads(response_text)
    
    # Validation / sanitization of parsed intent
    if "action" not in intent:
        intent["action"] = "general_query"
    if intent.get("action") == "generate_report" and not intent.get("report_id"):
        intent["action"] = "general_query"

    return intent


def parse_intent_deterministic(message: str, context: dict = None) -> dict:
    """Original pattern matching/regex parser."""
    msg = message.lower().strip()
    context = context or {}

    # 1. Check for greetings
    greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "namaste"]
    if any(msg.startswith(g) or msg == g for g in greetings):
        return {"action": "greeting"}

    # 2. Check for "list reports" / "what reports" / "show available"
    list_patterns = [
        r"(list|show|what).*(report|available)",
        r"which reports",
        r"report catalog",
        r"available reports",
        r"help.*report",
    ]
    for pat in list_patterns:
        if re.search(pat, msg):
            return {"action": "list_reports"}

    # 3. Check for report generation intent
    #    Look for: "download", "generate", "export", "create", "get me", "prepare"
    gen_keywords = ["download", "generate", "export", "create report", "get me", "prepare",
                    "make a report", "give me", "send me", "build report", "print"]
    is_generation = any(kw in msg for kw in gen_keywords)

    # Also check if the message mentions a specific report by synonym
    matched_report_id = None
    best_match_len = 0

    for rid, defn in REPORT_REGISTRY.items():
        for synonym in defn.get("synonyms", []):
            if synonym in msg and len(synonym) > best_match_len:
                matched_report_id = rid
                best_match_len = len(synonym)

    # If they asked about a report without explicit generation keyword,
    # treat it as a question about that report
    if matched_report_id and not is_generation:
        # Check if they're asking a question about the report
        question_words = ["how many", "total", "count", "pending", "status", "summary",
                         "show", "tell me", "what is", "analyze"]
        if any(qw in msg for qw in question_words):
            return {
                "action": "data_query",
                "report_id": matched_report_id,
                "filters": _extract_filters(msg, context),
            }
        # Default to generating a report if they mentioned one
        is_generation = True

    if is_generation and matched_report_id:
        fmt = _extract_format(msg)
        filters = _extract_filters(msg, context)
        return {
            "action": "generate_report",
            "report_id": matched_report_id,
            "format": fmt,
            "filters": filters,
        }

    # 4. If they mention a report from context (e.g., current active report)
    if is_generation and context.get("activeReportId"):
        fmt = _extract_format(msg)
        filters = _extract_filters(msg, context)
        return {
            "action": "generate_report",
            "report_id": context["activeReportId"],
            "format": fmt,
            "filters": filters,
        }

    # 5. Fallback: general query
    return {"action": "general_query"}


def _extract_format(msg: str) -> str:
    """Extract requested output format from message text."""
    msg = msg.lower()
    if "excel" in msg or "xlsx" in msg or "spreadsheet" in msg:
        return "excel"
    if "csv" in msg:
        return "csv"
    if "pdf" in msg:
        return "pdf"
    # Default to PDF
    return "pdf"


def _extract_filters(msg: str, context: dict = None) -> dict:
    """Extract date range and other filters from message text and context."""
    filters = {}
    context = context or {}
    today = datetime.now()

    # Extract date ranges from natural language
    if "this month" in msg:
        filters["from_date"] = today.replace(day=1).strftime("%Y-%m-%d")
        filters["to_date"] = today.strftime("%Y-%m-%d")
    elif "last month" in msg:
        first_of_this = today.replace(day=1)
        last_of_prev = first_of_this - timedelta(days=1)
        first_of_prev = last_of_prev.replace(day=1)
        filters["from_date"] = first_of_prev.strftime("%Y-%m-%d")
        filters["to_date"] = last_of_prev.strftime("%Y-%m-%d")
    elif "this week" in msg:
        start_of_week = today - timedelta(days=today.weekday())
        filters["from_date"] = start_of_week.strftime("%Y-%m-%d")
        filters["to_date"] = today.strftime("%Y-%m-%d")
    elif "last week" in msg:
        start_of_this_week = today - timedelta(days=today.weekday())
        end_of_last_week = start_of_this_week - timedelta(days=1)
        start_of_last_week = end_of_last_week - timedelta(days=6)
        filters["from_date"] = start_of_last_week.strftime("%Y-%m-%d")
        filters["to_date"] = end_of_last_week.strftime("%Y-%m-%d")
    elif "today" in msg:
        filters["from_date"] = today.strftime("%Y-%m-%d")
        filters["to_date"] = today.strftime("%Y-%m-%d")
    elif "yesterday" in msg:
        yesterday = today - timedelta(days=1)
        filters["from_date"] = yesterday.strftime("%Y-%m-%d")
        filters["to_date"] = yesterday.strftime("%Y-%m-%d")
    elif "this year" in msg or "this financial year" in msg:
        # Indian financial year April-March
        if today.month >= 4:
            fy_start = today.replace(month=4, day=1)
        else:
            fy_start = today.replace(year=today.year - 1, month=4, day=1)
        filters["from_date"] = fy_start.strftime("%Y-%m-%d")
        filters["to_date"] = today.strftime("%Y-%m-%d")

    # Try to extract explicit date patterns (YYYY-MM-DD)
    date_pattern = r"\d{4}-\d{2}-\d{2}"
    dates = re.findall(date_pattern, msg)
    if len(dates) >= 2:
        d1, d2 = dates[0], dates[1]
        if d1 <= d2:
            filters["from_date"] = d1
            filters["to_date"] = d2
        else:
            filters["from_date"] = d2
            filters["to_date"] = d1
    elif len(dates) == 1:
        filters["from_date"] = dates[0]
        filters["to_date"] = dates[0]

    # Merge context filters (from the active report dashboard)
    ctx_filters = context.get("filters", {})
    if ctx_filters.get("fromDate") and "from_date" not in filters:
        filters["from_date"] = ctx_filters["fromDate"]
    if ctx_filters.get("toDate") and "to_date" not in filters:
        filters["to_date"] = ctx_filters["toDate"]
    if ctx_filters.get("party") and "party" not in filters:
        filters["party"] = ctx_filters["party"]
    if ctx_filters.get("status") and "status" not in filters:
        filters["status"] = ctx_filters["status"]

    # Extract status filter (only if not already set)
    if "status" not in filters:
        status_terms = {
            "active": "Active", "pending": "Pending", "draft": "Draft",
            "completed": "Completed", "closed": "Closed", "cancelled": "Cancelled",
        }
        for term, val in status_terms.items():
            if term in msg:
                filters["status"] = val
                break

    return filters
