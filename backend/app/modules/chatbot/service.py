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
            if settings.GROQ_API_KEY:
                reply = _handle_general_query(message)
            else:
                reply = (
                    "Hello! 👋 I'm your Dinesh Exports ERP assistant. I can help you with:\n\n"
                    "• **Generate reports** — \"Download buyer order report for this month as PDF\"\n"
                    "• **Query data** — \"How many invoices are pending?\"\n"
                    "• **Browse reports** — \"List available reports\"\n\n"
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
                suggestions = [
                    f"Generate {defn['title']} as {'Excel' if fmt == 'pdf' else 'PDF'}",
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
            reply = _handle_general_query(message)
            suggestions = [
                "List available reports",
                "Download buyer order report",
                "Show invoice summary",
            ]

    except Exception as e:
        logger.error(f"Chatbot error: {e}", exc_info=True)
        reply = f"Sorry, I encountered an error while processing your request: {str(e)}\n\nPlease try again or rephrase your query."
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


async def get_chat_history(db: AsyncSession, thread_id: str, limit: int = 50) -> list[dict]:
    """Retrieve chat history for a thread."""
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.thread_id == thread_id)
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


def _handle_general_query(message: str) -> str:
    """Handle general/unclassified questions with helpful guidance, using Groq if available."""
    from app.core.config import settings
    if settings.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            system_prompt = (
                "You are an assistant for Dinesh Exports, a leading textile manufacturer. "
                "Help the user with ERP-related questions, explain options, and converse professionally. "
                "Keep responses concise and well-formatted using markdown. "
                "If they ask to generate or download a report, guide them on what they can ask (e.g. 'Generate a Buyer Order report as PDF')."
            )
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                model=settings.GROQ_MODEL,
                temperature=0.7,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Failed to generate LLM response: {e}")

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

