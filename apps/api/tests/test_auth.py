import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_successful_registration():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "user@example.com",
                "password": "securepassword123",
                "full_name": "Test User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "user@example.com"
        assert data["full_name"] == "Test User"
        assert "id" in data
        assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_duplicate_email_registration_fails():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First registration
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "password123",
                "full_name": "User One",
            },
        )
        # Duplicate registration
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "password456",
                "full_name": "User Two",
            },
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "User with this email already exists"


@pytest.mark.asyncio
async def test_successful_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "login@example.com",
                "password": "correctpassword",
                "full_name": "Login User",
            },
        )
        # Login
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "login@example.com", "password": "correctpassword"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_wrong_password_fails():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "wrongpw@example.com",
                "password": "correctpassword",
                "full_name": "Wrong Password User",
            },
        )
        # Login with wrong password
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "wrongpw@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_me_returns_401_without_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_me_returns_200_with_valid_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register & Login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "me@example.com",
                "password": "mysecretpassword",
                "full_name": "Me User",
            },
        )
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "me@example.com", "password": "mysecretpassword"},
        )
        token = login_res.json()["access_token"]

        # Call /me with Bearer token
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "me@example.com"
        assert data["full_name"] == "Me User"
