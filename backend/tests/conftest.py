import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://homeviz-ai-1.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(api, email, password):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"Login failed for {email}: {r.status_code} {r.text}"
    return r.json()["access_token"], r.json()["user"]


@pytest.fixture(scope="session")
def user_token(api):
    tok, _ = _login(api, "demo@user.com", "demo123")
    return tok


@pytest.fixture(scope="session")
def builder_token(api):
    tok, _ = _login(api, "builder@aurelia.com", "builder123")
    return tok


@pytest.fixture(scope="session")
def unverified_builder_token(api):
    tok, _ = _login(api, "builder@marina.com", "builder123")
    return tok


@pytest.fixture(scope="session")
def admin_token(api):
    tok, _ = _login(api, "admin@aura.com", "admin123")
    return tok


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
