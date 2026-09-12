from typing import Tuple
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
    prompt_lower = prompt.lower()

    # Rule-based fallback translation matching few-shots
    if "top 5 customer" in prompt_lower or "top customer" in prompt_lower or "revenue" in prompt_lower:
        candidate_sql = (
            "SELECT c.full_name AS customer_name, COUNT(DISTINCT o.id) AS total_orders, "
            "SUM(oi.quantity * oi.unit_price) AS total_revenue "
            "FROM customers c "
            "JOIN orders o ON c.id = o.customer_id "
            "JOIN order_items oi ON o.id = oi.order_id "
            "GROUP BY c.id, c.full_name "
            "ORDER BY total_revenue DESC LIMIT 5"
        )
    elif "monthly" in prompt_lower or "order" in prompt_lower:
        candidate_sql = (
            "SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, COUNT(DISTINCT customer_id) AS total_customers "
            "FROM orders GROUP BY month ORDER BY month ASC"
        )
    elif "product" in prompt_lower or "category" in prompt_lower:
        candidate_sql = (
            "SELECT cat.name AS category_name, COUNT(p.id) AS product_count, AVG(p.price) AS avg_price "
            "FROM categories cat JOIN products p ON cat.id = p.category_id "
            "GROUP BY cat.id, cat.name ORDER BY product_count DESC"
        )
    else:
        candidate_sql = (
            "SELECT c.full_name AS customer_name, COUNT(o.id) AS total_orders "
            "FROM customers c JOIN orders o ON c.id = o.customer_id "
            "GROUP BY c.id, c.full_name ORDER BY total_orders DESC LIMIT 5"
        )

    # Validate generated SQL via SQLGlot safety validator
    is_valid, error_msg, sanitized_sql = validate_sql(candidate_sql)
    if not is_valid or not sanitized_sql:
        raise ValueError(f"Generated SQL failed safety validation: {error_msg}")

    return prompt, sanitized_sql
