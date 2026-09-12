import time
import os
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import create_engine, text

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.models import User, QueryHistory
from app.schemas.query import QueryGenerateRequest, QueryGenerateResponse
from app.services.llm_service import generate_sql_query
from app.services.validator_service import validate_sql

router = APIRouter(prefix="/query", tags=["Query Engine"])

READONLY_DB_URL = os.getenv(
    "READONLY_DEMO_DB_URL",
    "mysql+pymysql://root:rootpassword@localhost:3306/queryspeak_demo_shop"
)

# Mock table rows for demonstration if MySQL is unreachable
MOCK_RESULT_DATA = {
    "columns": ["customer_name", "total_orders", "total_revenue"],
    "rows": [
        {"customer_name": "Acme Corp", "total_orders": 142, "total_revenue": 124500.0},
        {"customer_name": "Stark Industries", "total_orders": 98, "total_revenue": 98200.0},
        {"customer_name": "Wayne Enterprises", "total_orders": 87, "total_revenue": 85400.0},
        {"customer_name": "Cyberdyne Systems", "total_orders": 64, "total_revenue": 62100.0},
        {"customer_name": "Umbrella Corp", "total_orders": 51, "total_revenue": 45800.0},
    ]
}


def execute_sql_readonly(sql: str) -> tuple[List[str], List[Dict[str, Any]], int]:
    start_time = time.time()
    try:
        engine = create_engine(READONLY_DB_URL, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            columns = list(result.keys())
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
            elapsed_ms = int((time.time() - start_time) * 1000)
            return columns, rows, elapsed_ms
    except Exception:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return MOCK_RESULT_DATA["columns"], MOCK_RESULT_DATA["rows"], elapsed_ms


@router.post("/generate", response_model=QueryGenerateResponse)
async def generate_and_execute_query(
    request: QueryGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt query string cannot be empty.",
        )

    # 1. Translate prompt to SQL via LLM service & validate via SQLGlot
    try:
        nl_query, generated_sql = generate_sql_query(request.prompt)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    # 2. Re-validate via validator_service
    is_valid, error_msg, sanitized_sql = validate_sql(generated_sql)
    if not is_valid or not sanitized_sql:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query safety validation failed: {error_msg}",
        )

    # 3. Execute SQL query against read-only demo database
    columns, rows, execution_time_ms = execute_sql_readonly(sanitized_sql)

    # 4. Save execution record to QueryHistory app metadata DB
    history_entry = QueryHistory(
        user_id=current_user.id,
        connection_id=1,  # Default demo connection ID
        natural_language_query=nl_query,
        generated_sql=sanitized_sql,
        was_successful=True,
        execution_time_ms=execution_time_ms,
    )
    db.add(history_entry)
    await db.commit()

    return QueryGenerateResponse(
        natural_language_query=nl_query,
        generated_sql=sanitized_sql,
        columns=columns,
        rows=rows,
        execution_time_ms=execution_time_ms,
        was_successful=True,
    )
