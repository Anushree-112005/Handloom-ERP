"""
Chatbot Service — orchestrates intent parsing, report generation, data queries,
and conversation management.
"""
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.modules.chatbot.intent_parser import parse_intent
from app.modules.reports.registry import REPORT_REGISTRY, get_report_templates, get_report_definition
from app.modules.reports.service import generate_report, query_report_data
from app.models.chat_message import ChatMessage

logger = logging.getLogger(__name__)


async def handle_chat_message(
    db: AsyncSession,
    thread_id: str,
    user_id: str,
    message: str,
    context: dict = None,
) -> dict:
    """
    Process a user chat message and return a response.

    Returns:
    {
      "reply": str,
      "attachments": [{ "type": "report", "label": str, "format": str, "download_url": str }],
      "suggestions": [str]
    }
    """
    context = context or {}

    # Save user message
    user_msg = ChatMessage(
        thread_id=thread_id,
        user_id=user_id,
        sender="user",
        message=message,
        context=context,
    )
    db.add(user_msg)

    # Parse intent
    intent = parse_intent(message, context)
    action = intent.get("action", "general_query")

    reply = ""
    attachments = []
    suggestions = []

    try:
        if action == "greeting":
            from app.core.config import settings
            capabilities = (
                "\n\nHere is what I can help you with:\n"
                "• **Generate reports** — \"Download buyer order report for this month as PDF\"\n"
                "• **Query data** — \"How many invoices are pending?\"\n"
                "• **Browse reports** — \"List available reports\""
            )
            if settings.GROQ_API_KEY:
                llm_reply = await _handle_general_query(db, message)
                reply = f"{llm_reply}{capabilities}"
            else:
                reply = (
                    f"Hello! 👋 I'm your Dinesh Exports ERP assistant.{capabilities}\n\n"
                    "What would you like to do?"
                )
            suggestions = [
                "List available reports",
                "Download buyer order report as PDF",
                "Show invoice summary for this month",
            ]

        elif action == "list_reports":
            templates = get_report_templates()
            lines = ["📋 **Available Reports:**\n"]
            for t in templates:
                fmts = ", ".join(t["formats"]).upper()
                lines.append(f"• **{t['title']}** — Formats: {fmts}")
            lines.append("\nJust tell me which report you need and in what format!")
            reply = "\n".join(lines)
            suggestions = [
                "Download buyer order report as PDF",
                "Generate invoice report for this month",
                "Export employee list as Excel",
            ]

        elif action == "generate_report":
            report_id = intent["report_id"]
            fmt = intent.get("format", "pdf")
            filters = intent.get("filters", {})
            defn = get_report_definition(report_id)

            if not defn:
                reply = f"Sorry, I couldn't find a report matching your request. Try 'list available reports' to see options."
            else:
                # Generate the report
                job = await generate_report(db, report_id, fmt, filters, user_id)

                filter_desc = _describe_filters(filters)
                reply = (
                    f"✅ **{defn['title']}** generated successfully!\n\n"
                    f"• Format: **{fmt.upper()}**\n"
                    f"• Filters: {filter_desc}\n"
                    f"• File: {job.filename}\n\n"
                    f"Click the download button below to save the file."
                )
                attachments = [{
                    "type": "report",
                    "label": job.filename,
                    "format": fmt,
                    "download_url": f"/api/v1/reports/jobs/{job.id}/download",
                    "job_id": job.id,
                }]
                alt_fmt = "Excel" if fmt == "pdf" else "PDF"
                supported_formats = defn.get("formats", [])
                if alt_fmt.lower() not in supported_formats and len(supported_formats) > 1:
                    for f in supported_formats:
                        if f != fmt:
                            alt_fmt = f.upper() if f != "excel" else "Excel"
                            break
                suggestions = [
                    f"Generate {defn['title']} as {alt_fmt}",
                    "Download another report",
                ]

        elif action == "data_query":
            report_id = intent.get("report_id")
            filters = intent.get("filters", {})
            defn = get_report_definition(report_id)

            if defn:
                data = await query_report_data(db, report_id, filters)
                count = len(data)
                filter_desc = _describe_filters(filters)

                reply = (
                    f"📊 **{defn['title']}** Summary:\n\n"
                    f"• Total records found: **{count}**\n"
                    f"• Filters applied: {filter_desc}\n"
                )
                if count > 0:
                    reply += f"\nWould you like me to generate a downloadable report?"
                    suggestions = [
                        f"Download {defn['title']} as PDF",
                        f"Export {defn['title']} as Excel",
                    ]
                else:
                    reply += "\nNo records found for these filters. Try adjusting the date range."
                    suggestions = [
                        f"Show {defn['title']} for this month",
                        "List available reports",
                    ]
            else:
                reply = "I couldn't find data for that query. Could you be more specific?"
                suggestions = ["List available reports"]

        else:  # general_query
            reply = await _handle_general_query(db, message)
            suggestions = [
                "List available reports",
                "Download buyer order report",
                "Show invoice summary",
            ]

    except Exception as e:
        logger.error(f"Chatbot error: {e}", exc_info=True)
        await db.rollback()
        reply = "Sorry, I encountered an error while processing your request. Please try again or rephrase your query."
        suggestions = ["List available reports"]

    # Save AI response
    ai_msg = ChatMessage(
        thread_id=thread_id,
        user_id=user_id,
        sender="ai",
        message=reply,
        attachments=attachments if attachments else [],
    )
    db.add(ai_msg)
    await db.commit()

    return {
        "reply": reply,
        "attachments": attachments,
        "suggestions": suggestions,
    }


async def get_chat_history(db: AsyncSession, thread_id: str, user_id: str, limit: int = 50) -> list[dict]:
    """Retrieve chat history for a thread, scoped by user_id for security."""
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.thread_id == thread_id, ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    return [
        {
            "id": msg.id,
            "sender": msg.sender,
            "message": msg.message,
            "context": msg.context or {},
            "attachments": msg.attachments or [],
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        for msg in messages
    ]



def _describe_filters(filters: dict) -> str:
    """Create human-readable filter description."""
    parts = []
    if filters.get("from_date") and filters.get("to_date"):
        parts.append(f"{filters['from_date']} to {filters['to_date']}")
    elif filters.get("from_date"):
        parts.append(f"from {filters['from_date']}")
    elif filters.get("to_date"):
        parts.append(f"until {filters['to_date']}")

    if filters.get("party"):
        parts.append(f"Party: {filters['party']}")
    if filters.get("status"):
        parts.append(f"Status: {filters['status']}")
    if filters.get("department"):
        parts.append(f"Dept: {filters['department']}")

    return " | ".join(parts) if parts else "All records (no filters)"


async def _handle_general_query(db: AsyncSession, message: str) -> str:
    """Handle general/unclassified questions with helpful guidance, using Groq if available.
    Supports natural language database queries (Text-to-SQL) for accurate business metrics.
    Uses multi-API-key rotation: tries each key in sequence, skips exhausted keys instantly."""
    from app.core.config import settings
    from groq import Groq
    import json
    import re as _re
    from sqlalchemy import text

    all_api_keys = settings.get_groq_api_keys()
    if not all_api_keys:
        return _chatbot_fallback_reply(message)

    # ── Key rotation helper ────────────────────────────────────────────────
    exhausted_keys: set = set()

    def _is_rate_limit(err_str: str) -> bool:
        s = err_str.lower()
        return "rate_limit" in s or "429" in s or "tokens per day" in s or "tpd" in s or "rate limit" in s

    def _call_llm(messages_list: list, response_format=None, temperature: float = 0.0, max_tokens: int = 2048) -> str | None:
        """Try each API key; skip rate-limited ones. Returns content string or None if all fail."""
        for api_key in all_api_keys:
            if api_key in exhausted_keys:
                continue
            try:
                c = Groq(api_key=api_key)
                kwargs = dict(messages=messages_list, model=settings.GROQ_MODEL, temperature=temperature)
                if response_format:
                    kwargs["response_format"] = response_format
                else:
                    kwargs["max_tokens"] = max_tokens
                result = c.chat.completions.create(**kwargs)
                logger.info(f"[GROQ Chatbot] Success with key ...{api_key[-6:]}")
                return result.choices[0].message.content
            except Exception as e:
                err_str = str(e)
                if _is_rate_limit(err_str):
                    logger.warning(f"[GROQ Chatbot] Key ...{api_key[-6:]} rate-limited. Trying next.")
                    exhausted_keys.add(api_key)
                    continue
                logger.error(f"[GROQ Chatbot] Key ...{api_key[-6:]} error: {err_str[:100]}")
                return None  # non-rate-limit error, stop trying
        logger.warning("[GROQ Chatbot] All API keys exhausted — falling back to rule-based reply.")
        return None
    # ── End rotation helper ────────────────────────────────────────────────

    try:
        # Formulate the system prompt describing the schema
        today_str = datetime.now().strftime("%Y-%m-%d")

        schema_prompt = f"""You are a database expert for Dinesh Exports Textile ERP.
Your task is to convert the user's natural language question into a valid, single, read-only PostgreSQL SELECT query.
Do NOT modify database state. Only generate SELECT queries.

Database Schema:
1. sales_invoices (Holds invoicing and sales revenue/income details):
   - id: integer
   - invoice_no: character varying (e.g., 'TEST-123')
   - invoice_date: date (invoice date)
   - party_name: character varying (customer name)
   - net_amount: numeric (final invoice value, sum this for monthly income/revenue)
   - total_qty: numeric (quantity of fabric sold)
   - status: character varying ('Draft', 'Dispatched', 'Cancelled' - 'Dispatched' represents completed/delivered sales)

2. cloth_deliveries (Holds fabric delivery details, including Customer/Sales Delivery and process issues):
   - id: integer
   - dc_no: character varying (Delivery Challan No)
   - dc_date: date (delivery date)
   - party_name: character varying (buyer/process house name)
   - total_meters: numeric (meters delivered, sum this for total delivery meters)
   - total_pieces: integer (pieces delivered)
   - net_amount: numeric (delivery value in INR)
   - status: character varying ('Delivered', etc.)
   - delivery_type: character varying ('Customer Delivery', 'Weaver Issue', 'Sizing Issue', etc. Filter by 'Customer Delivery' for sales/customer deliveries)

3. cloth_inwards (Grey Fabric Inward, holds fabric receipts):
   - id: integer
   - ref_no: character varying
   - inw_date: date (receipt date)
   - party_name: character varying (supplier name)
   - total_meters: numeric
   - total_pieces: integer
   - status: character varying

4. production_logs (Daily production / weaving process records):
   - id: integer
   - meters_produced: double precision (meters woven/produced, sum this for total process/production)
   - timestamp: timestamp without time zone
   - downtime_minutes: integer

5. loom_allocations (Loom scheduling and assignments):
   - id: integer
   - loom_id: integer
   - fabric_type: character varying
   - assigned_meters: double precision
   - completed_meters: double precision
   - allocation_status: character varying ('Running', 'Completed', etc.)

6. employees (Employee details / master):
   - id: integer
   - employee_code: character varying
   - name: character varying
   - department: character varying (e.g., 'Production', 'Weaving', 'Merchandising', 'Design', 'Quality', 'Accounts', 'IT', 'Logistics', 'Management')
   - designation: character varying
   - status: character varying ('Active', etc.)

7. buyer_orders (Customer sales orders / purchase orders received):
   - id: integer
   - ibpo_number: character varying
   - order_date: date
   - party_name: character varying (customer name)
   - status: character varying ('Active', 'Completed', etc.)

8. yarn_purchase_orders (Orders to buy yarn from suppliers):
   - id: integer
   - po_number: character varying
   - po_date: date
   - supplier_name: character varying
   - total_order_kgs: numeric
   - status: character varying

9. stationary_items (Holds all stationery & consumables management data like items, ledger, requests, etc.):
   - id: integer
   - category: character varying (e.g. 'consumables_items', 'consumables_ledger', 'consumables_requests', 'consumables_vendors', 'consumables_departments', 'consumables_requisitions', 'consumables_pos', 'consumables_grns', 'consumables_issues', 'consumables_returns', 'consumables_transfers', 'consumables_adjustments', 'consumables_verifications', 'consumables_quotations')
   - data: json (contains properties of the record as JSON. NOTE: This is type json, not jsonb. DO NOT use the containment operator @>. Always use the ->> operator.)
   * To query fields inside the 'data' JSON column, use PostgreSQL JSON operators like `data->>'field'`.
   * For items (category = 'consumables_items'):
     - `data->>'id'` (item ID, e.g. 'ITM001')
     - `data->>'name'` (item name, e.g. 'A4 Paper')
     - `data->>'code'` (item code, e.g. 'A4P')
     - `data->>'category'` (item category, e.g. 'Office Stationery')
     - `data->>'currentStock'` (numeric stock level)
     - `data->>'rate'` (numeric price per unit)
     - `data->>'vendor'` (vendor name)
   * To query ledger for a specific item name (like 'A4 Paper'), resolve the name by subquerying category = 'consumables_items':
     `SELECT * FROM stationary_items WHERE category = 'consumables_ledger' AND data->>'itemId' = (SELECT data->>'id' FROM stationary_items WHERE category = 'consumables_items' AND data->>'name' ILIKE '%A4 Paper%' LIMIT 1)`

Today's date is: {today_str}

Return ONLY a JSON object with this format:
{{
  "is_db_query": true/false,
  "sql": "the SQL query to execute" (null if is_db_query is false),
  "explanation": "brief explanation of what you are querying"
}}

Rules:
1. Ensure the SQL uses correct PostgreSQL syntax.
2. Only write SELECT queries. Do not include semicolons at the end of the query.
3. Be careful with date operations. For relative dates (e.g., 'this month', 'last month'), resolve them relative to today: {today_str}.
4. For "monthly income", sum net_amount from sales_invoices where status != 'Cancelled' for the current month.
5. For "total delivery", sum total_meters from cloth_deliveries.
6. For "total process", sum meters_produced from production_logs or completed_meters from loom_allocations.
7. For "sales delivered" or "customer delivery", query the cloth_deliveries table filtering by delivery_type = 'Customer Delivery'.
8. Use only the actual status values present in the database: 'Dispatched' for sales invoices (NOT 'Paid' or 'Sent'), 'Delivered' for cloth deliveries, and 'Customer Delivery' for delivery_type.
9. For queries about stationery, consumables, items, stock level, rate, ledger, or departments/vendors in stores, query the stationary_items table using JSON operators and correct category.
10. Return ONLY the JSON object. No conversational text, no markdown block.
"""

        # Step 1: Text-to-SQL
        sql_content = _call_llm(
            [
                {"role": "system", "content": schema_prompt},
                {"role": "user", "content": message}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )

        if sql_content:
            try:
                res_json = json.loads(sql_content)
                if res_json.get("is_db_query") and res_json.get("sql"):
                    sql_query = res_json["sql"]

                    # Security sanity check
                    sql_lower = sql_query.lower().strip()
                    forbidden_keywords = ["insert", "update", "delete", "drop", "truncate", "alter", "create", "grant", "revoke", "replace"]
                    if not sql_lower.startswith("select") or any(kw in sql_lower for kw in forbidden_keywords):
                        logger.warning(f"Blocked unsafe SQL query: {sql_query}")
                        return "Sorry, for safety reasons I cannot execute write or schema operations on the database."

                    logger.info(f"Chatbot Text-to-SQL query: {sql_query}")
                    try:
                        from app.core.database import engine
                        async with engine.connect() as conn:
                            db_res = await conn.execute(text(sql_query))
                            columns = list(db_res.keys())
                            rows = [dict(zip(columns, row)) for row in db_res.fetchall()]

                        # Step 2: Format DB results into natural language
                        answer_prompt = f"""You are the Dinesh Exports ERP Assistant.
The user asked: "{message}"
We executed this SQL query: {sql_query}
And got these results from the database: {json.dumps(rows, default=str)}

Please write a clear, accurate, and concise natural language answer to the user's question based on the database results.
If the result is null or empty, explain that no matching records were found.
Format numbers nicely (e.g. currency as ₹XX,XXX, meters as XX,XXX mtrs). Use markdown for table or bullet points if needed.
"""
                        answer = _call_llm(
                            [{"role": "system", "content": answer_prompt}],
                            temperature=0.3
                        )
                        if answer:
                            return answer
                    except Exception as db_err:
                        logger.error(f"Failed executing Text-to-SQL query: {db_err}", exc_info=True)
                        # Fallthrough to general conversational reply
            except Exception as parse_err:
                logger.warning(f"Failed to parse SQL JSON response: {parse_err}")

        # Step 3: General conversational prompt (fallback if no DB query needed)
        system_prompt = (
            "You are an assistant for Dinesh Exports, a leading textile manufacturer. "
            "Help the user with ERP-related questions, explain options, and converse professionally. "
            "Keep responses concise and well-formatted using markdown. "
            "If they ask to generate or download a report, guide them on what they can ask (e.g. 'Generate a Buyer Order report as PDF')."
        )
        conv_answer = _call_llm(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7
        )
        if conv_answer:
            return conv_answer

    except Exception as e:
        logger.error(f"Failed to generate LLM response: {e}", exc_info=True)

    # All keys exhausted or error — rule-based fallback
    return _chatbot_fallback_reply(message)


def _chatbot_fallback_reply(message: str) -> str:
    """Rule-based fallback when all Groq keys are exhausted or unavailable."""
    msg = message.lower()
    if any(w in msg for w in ["help", "what can you do", "capabilities"]):
        return (
            "🤖 I'm your **Dinesh Exports ERP Intelligence Assistant**. Here's what I can do:\n\n"
            "📄 **Generate Reports** — Ask me to download any report in PDF, Excel, or CSV\n"
            "📊 **Query Data** — Ask about record counts, pending orders, summaries\n"
            "🔍 **Browse Reports** — See all available report types\n\n"
            "**Example queries:**\n"
            "• \"Download buyer order report for this month as PDF\"\n"
            "• \"How many invoices are pending?\"\n"
            "• \"Export employee list as Excel\"\n"
            "• \"Show yarn purchase orders for last week\""
        )
    if any(w in msg for w in ["thank", "thanks", "great", "awesome", "perfect"]):
        return "You're welcome! 😊 Let me know if you need anything else."
    return (
        "I'm not sure I understand that query. Here are some things I can help with:\n\n"
        "• **\"Download buyer order report as PDF\"** — Generate a report\n"
        "• **\"How many invoices this month?\"** — Query ERP data\n"
        "• **\"List available reports\"** — See all report options\n\n"
        "Try rephrasing your request or type **\"help\"** for full capabilities."
    )

