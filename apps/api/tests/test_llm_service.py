import pytest
from app.services.llm_service import generate_sql_query


def test_llm_service_valid_query(monkeypatch):
    class MockResponse:
        text = "SELECT COUNT(*) AS out_of_stock_count FROM products WHERE stock_quantity = 0;"

    monkeypatch.setattr("google.generativeai.GenerativeModel.generate_content", lambda self, *args, **kwargs: MockResponse())

    prompt, sql = generate_sql_query("how many products are out of stock")
    assert prompt == "how many products are out of stock"
    assert "SELECT" in sql.upper()
    assert "products" in sql.lower()


def test_llm_service_unanswerable_query(monkeypatch):
    class MockResponse:
        text = "NO_VALID_QUERY"

    monkeypatch.setattr("google.generativeai.GenerativeModel.generate_content", lambda self, *args, **kwargs: MockResponse())

    with pytest.raises(ValueError) as exc_info:
        generate_sql_query("show me the weather forecast")

    assert "I couldn't map that request to the available data" in str(exc_info.value)


def test_llm_service_data_manipulation_rejected(monkeypatch):
    class MockResponse:
        text = "DELETE FROM customers;"

    monkeypatch.setattr("google.generativeai.GenerativeModel.generate_content", lambda self, *args, **kwargs: MockResponse())

    with pytest.raises(ValueError) as exc_info:
        generate_sql_query("delete all customers")

    assert "safety validation" in str(exc_info.value).lower() or "forbidden" in str(exc_info.value).lower()


def test_llm_service_api_failure_handling(monkeypatch):
    def mock_fail(*args, **kwargs):
        raise RuntimeError("API Connection Error")

    monkeypatch.setattr("google.generativeai.GenerativeModel.generate_content", mock_fail)

    with pytest.raises(ValueError) as exc_info:
        generate_sql_query("show me all products")

    assert "SQL generation service is temporarily unavailable. Please try again." in str(exc_info.value)
