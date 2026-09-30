import pytest
import os
import app.api.v1.routers.query as query_router
import app.services.schema_service as schema_service


def test_execute_sql_readonly_local_fallback(monkeypatch):
    monkeypatch.setattr(query_router, "READONLY_DB_ENV", None)
    monkeypatch.setattr(query_router, "READONLY_DB_URL", "mysql+pymysql://invalid_user:invalid_pass@127.0.0.1:9999/nonexistent")

    cols, rows, elapsed = query_router.execute_sql_readonly("SELECT 1")
    assert cols == query_router.MOCK_RESULT_DATA["columns"]
    assert rows == query_router.MOCK_RESULT_DATA["rows"]


def test_execute_sql_readonly_configured_db_error_propagation(monkeypatch, capsys):
    monkeypatch.setattr(query_router, "READONLY_DB_ENV", "mysql+pymysql://invalid_user:invalid_pass@127.0.0.1:9999/nonexistent")
    monkeypatch.setattr(query_router, "READONLY_DB_URL", "mysql+pymysql://invalid_user:invalid_pass@127.0.0.1:9999/nonexistent")

    with pytest.raises(Exception):
        query_router.execute_sql_readonly("SELECT 1")

    captured = capsys.readouterr()
    assert "DEMO DB EXECUTION ERROR:" in captured.out


def test_introspect_schema_local_fallback(monkeypatch):
    monkeypatch.setattr(schema_service, "DEMO_DB_ENV", None)
    monkeypatch.setattr(schema_service, "DEMO_DB_URL", "mysql+pymysql://invalid_user:invalid_pass@127.0.0.1:9999/nonexistent")

    schema = schema_service.introspect_schema()
    assert schema == schema_service.FALLBACK_SCHEMA


def test_introspect_schema_configured_db_error_propagation(monkeypatch, capsys):
    monkeypatch.setattr(schema_service, "DEMO_DB_ENV", "mysql+pymysql://invalid_user:invalid_pass@127.0.0.1:9999/nonexistent")
    monkeypatch.setattr(schema_service, "DEMO_DB_URL", "mysql+pymysql://invalid_user:invalid_pass@127.0.0.1:9999/nonexistent")

    with pytest.raises(Exception):
        schema_service.introspect_schema()

    captured = capsys.readouterr()
    assert "SCHEMA INTROSPECTION ERROR:" in captured.out
