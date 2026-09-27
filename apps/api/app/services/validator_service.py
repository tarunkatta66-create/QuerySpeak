from typing import Tuple, Optional
import sqlglot
from sqlglot import exp


def validate_sql(sql_str: str) -> Tuple[bool, Optional[str], Optional[str]]:
    if not sql_str or not sql_str.strip():
        return False, "Query string is empty.", None

    clean_sql = sql_str.strip().rstrip(";")

    try:
        parsed_statements = sqlglot.parse(clean_sql, read="mysql")
    except Exception as err:
        return False, f"SQL Syntax Error: {str(err)}", None

    if len(parsed_statements) == 0:
        return False, "No valid SQL statement found.", None

    if len(parsed_statements) > 1:
        return False, "Multiple SQL statements are strictly forbidden.", None

    ast = parsed_statements[0]
    if ast is None:
        return False, "Failed to parse SQL AST.", None

    # Strictly allow ONLY Select statements at root
    if not isinstance(ast, exp.Select):
        return False, f"Forbidden statement type: '{ast.key.upper()}'. Only SELECT queries are allowed.", None

    # Check AST recursively for forbidden mutation nodes
    forbidden_nodes = (
        exp.Drop,
        exp.Delete,
        exp.Update,
        exp.Insert,
        exp.Alter,
        exp.Create,
        exp.Command,
    )

    for node in ast.walk():
        if isinstance(node, forbidden_nodes):
            return False, f"Forbidden AST node '{node.key.upper()}' detected.", None

    # Transpile/sanitise to standardized MySQL dialect SQL
    sanitized_sql = ast.sql(dialect="mysql")
    return True, None, sanitized_sql
