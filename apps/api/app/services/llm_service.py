from typing import Tuple
import google.generativeai as genai

from app.core.config import settings
from app.services.schema_service import get_formatted_schema_context
from app.services.validator_service import validate_sql


FEW_SHOT_EXAMPLES = """
Few-Shot Prompt Translation Examples:
-------------------------------------
User Prompt: "Top 5 customers by revenue"
Generated SQL: SELECT c.full_name, COUNT(o.id) AS total_orders, SUM(oi.quantity * oi.unit_price) AS total_revenue FROM customers c JOIN orders o ON c.id = o.customer_id JOIN order_items oi ON o.id = oi.order_id GROUP BY c.id, c.full_name ORDER BY total_revenue DESC LIMIT 5;

User Prompt: "Products out of stock"
Generated SQL: SELECT name, price, stock_quantity FROM products WHERE stock_quantity = 0;

User Prompt: "Monthly active customer orders in 2026"
Generated SQL: SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, COUNT(DISTINCT customer_id) AS total_customers FROM orders WHERE YEAR(order_date) = 2026 GROUP BY month ORDER BY month ASC;
"""


def generate_sql_query(prompt: str) -> Tuple[str, str]:
    schema_context = get_formatted_schema_context()

    full_prompt = (
        "SQL Dialect: MySQL\n\n"
        f"{schema_context}\n\n"
        f"{FEW_SHOT_EXAMPLES}\n\n"
        "Output ONLY the SQL query. No explanation, no markdown code fences, no comments. "
        "If the user's request cannot be answered with the given schema, output exactly: NO_VALID_QUERY\n\n"
        f"User Request: {prompt}"
    )

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            full_prompt,
            generation_config=genai.GenerationConfig(temperature=0),
        )
        raw_output = response.text
    except Exception as exc:
        raise ValueError("SQL generation service is temporarily unavailable. Please try again.") from exc

    sql_text = raw_output.strip()
    if sql_text.startswith("```"):
        lines = sql_text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        sql_text = "\n".join(lines).strip()

    if sql_text.upper() == "NO_VALID_QUERY":
        raise ValueError(
            "I couldn't map that request to the available data "
            "(tables: categories, products, customers, orders, order_items). Try rephrasing."
        )

    is_valid, error_msg, sanitized_sql = validate_sql(sql_text)
    if not is_valid or not sanitized_sql:
        raise ValueError(f"Generated SQL failed safety validation: {error_msg}")

    return prompt, sanitized_sql
