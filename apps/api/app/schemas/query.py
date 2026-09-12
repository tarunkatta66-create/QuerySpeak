from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class QueryGenerateRequest(BaseModel):
    prompt: str = Field(..., json_schema_extra={"example": "Show me the top 5 customers by revenue"})


class QueryGenerateResponse(BaseModel):
    natural_language_query: str
    generated_sql: str
    columns: List[str]
    rows: List[Dict[str, Any]]
    execution_time_ms: int
    was_successful: bool = True
    error: Optional[str] = None
