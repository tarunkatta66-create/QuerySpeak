from typing import Dict, Any, List
import os
from sqlalchemy import create_engine, inspect


DEMO_DB_URL = os.getenv(
    "DEMO_DATABASE_URL",
    "mysql+pymysql://root:rootpassword@localhost:3306/queryspeak_demo_shop"
)

# Mock schema fallback if MySQL database connection is offline during development/testing
FALLBACK_SCHEMA = {
    "categories": ["id INT PRIMARY KEY", "name VARCHAR(255)"],
    "products": ["id INT PRIMARY KEY", "name VARCHAR(255)", "category_id INT (FK -> categories.id)", "price DECIMAL(10,2)", "stock_quantity INT"],
    "customers": ["id INT PRIMARY KEY", "full_name VARCHAR(255)", "email VARCHAR(255)", "city VARCHAR(255)", "signup_date DATE"],
    "orders": ["id INT PRIMARY KEY", "customer_id INT (FK -> customers.id)", "order_date DATETIME", "status VARCHAR(50)"],
    "order_items": ["id INT PRIMARY KEY", "order_id INT (FK -> orders.id)", "product_id INT (FK -> products.id)", "quantity INT", "unit_price DECIMAL(10,2)"]
}


def introspect_schema() -> Dict[str, List[str]]:
    try:
        engine = create_engine(DEMO_DB_URL, connect_args={"connect_timeout": 3})
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        if not table_names:
            return FALLBACK_SCHEMA

        schema_info = {}
        for table in table_names:
            columns = inspector.get_columns(table)
            fks = inspector.get_foreign_keys(table)

            fk_map = {}
            for fk in fks:
                constrained_cols = fk.get("constrained_columns", [])
                referred_table = fk.get("referred_table", "")
                referred_cols = fk.get("referred_columns", [])
                for col in constrained_cols:
                    fk_map[col] = f"(FK -> {referred_table}.{','.join(referred_cols)})"

            col_defs = []
            for col in columns:
                c_name = col["name"]
                c_type = str(col["type"])
                fk_info = fk_map.get(c_name, "")
                col_defs.append(f"{c_name} {c_type} {fk_info}".strip())

            schema_info[table] = col_defs

        return schema_info
    except Exception:
        return FALLBACK_SCHEMA


def get_formatted_schema_context() -> str:
    schema = introspect_schema()
    lines = ["Target Database Schema (queryspeak_demo_shop):"]
    for table, cols in schema.items():
        lines.append(f"Table '{table}':")
        for col in cols:
            lines.append(f"  - {col}")
    return "\n".join(lines)
