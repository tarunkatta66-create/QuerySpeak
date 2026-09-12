import pytest
from httpx import AsyncClient, ASGITransport
from app.services.validator_service import validate_sql
from app.main import app


def test_validator_accepts_valid_select():
    sql = "SELECT id, name, price FROM products WHERE price > 100 ORDER BY price DESC LIMIT 10;"
    is_valid, error, sanitized = validate_sql(sql)
    assert is_valid is True
    assert error is None
    assert "SELECT" in sanitized


def test_validator_blocks_drop_table():
    sql = "DROP TABLE customers;"
    is_valid, error, sanitized = validate_sql(sql)
    assert is_valid is False
    assert "Forbidden statement type" in error or "Forbidden AST node" in error
    assert sanitized is None


def test_validator_blocks_delete_mutation():
    sql = "DELETE FROM orders WHERE status = 'CANCELLED';"
    is_valid, error, sanitized = validate_sql(sql)
    assert is_valid is False
    assert "Forbidden statement type" in error or "Forbidden AST node" in error
    assert sanitized is None


def test_validator_blocks_update_mutation():
    sql = "UPDATE products SET price = 0.00 WHERE id = 1;"
    is_valid, error, sanitized = validate_sql(sql)
    assert is_valid is False
    assert "Forbidden statement type" in error or "Forbidden AST node" in error
    assert sanitized is None


def test_validator_blocks_multi_statement():
    sql = "SELECT * FROM customers; DROP TABLE customers;"
    is_valid, error, sanitized = validate_sql(sql)
    assert is_valid is False
    assert "Multiple SQL statements are strictly forbidden" in error
    assert sanitized is None


@pytest.mark.asyncio
async def test_query_generate_endpoint_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/query/generate",
            json={"prompt": "Top 5 customers by revenue"},
        )
        assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_query_generate_endpoint_with_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register & Login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "queryuser@example.com",
                "password": "querypassword123",
                "full_name": "Query User",
            },
        )
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "queryuser@example.com", "password": "querypassword123"},
        )
        token = login_res.json()["access_token"]

        response = await client.post(
            "/api/v1/query/generate",
            json={"prompt": "Top 5 customers by revenue"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["natural_language_query"] == "Top 5 customers by revenue"
        assert "SELECT" in data["generated_sql"].upper()
        assert len(data["columns"]) > 0
        assert isinstance(data["rows"], list)
