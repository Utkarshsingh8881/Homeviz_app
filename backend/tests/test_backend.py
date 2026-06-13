"""Aura Proptech backend regression tests covering auth, projects, pricing, AI,
bookings, builder-only, admin-only, and role-permission checks."""
import os
import time
import pytest
import requests

from conftest import BASE_URL, auth_headers


# ---------- Health ----------
def test_root(api):
    r = api.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok"


# ---------- Auth ----------
def test_login_user(api, user_token):
    assert user_token

    r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers(user_token), timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j["role"] == "user"
    assert j["email"] == "demo@user.com"


def test_login_wrong_password(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": "demo@user.com", "password": "wrong"}, timeout=15)
    assert r.status_code == 400


def test_signup_and_me(api):
    email = f"TEST_signup_{int(time.time())}@example.com"
    r = api.post(f"{BASE_URL}/api/auth/signup",
                 json={"email": email, "password": "abc123", "name": "TEST User", "role": "user"}, timeout=15)
    assert r.status_code == 200, r.text
    tok = r.json()["access_token"]
    me = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers(tok), timeout=15)
    assert me.status_code == 200
    assert me.json()["email"] == email.lower()


# ---------- Projects ----------
def test_list_projects(api):
    r = api.get(f"{BASE_URL}/api/projects", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    for p in data:
        assert "_id" not in p
        assert "id" in p and "name" in p and "units" in p


def test_filter_projects_city_bhk(api):
    r = api.get(f"{BASE_URL}/api/projects", params={"city": "Mumbai", "bhk": "3BHK"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert all(p["city"].lower() == "mumbai" for p in data)
    assert all("3BHK" in p["bhk_types"] for p in data)


def test_get_project_by_id(api):
    r = api.get(f"{BASE_URL}/api/projects/proj-1", timeout=15)
    assert r.status_code == 200
    p = r.json()
    assert p["id"] == "proj-1"
    assert "_id" not in p
    assert len(p["units"]) > 0


def test_get_project_not_found(api):
    r = api.get(f"{BASE_URL}/api/projects/does-not-exist", timeout=15)
    assert r.status_code == 404


# ---------- Pricing ----------
def test_price_estimate(api):
    proj = api.get(f"{BASE_URL}/api/projects/proj-1", timeout=15).json()
    unit = proj["units"][0]
    opts = ["wall_warm_white", "floor_oak"]
    r = api.post(f"{BASE_URL}/api/pricing/estimate",
                 json={"project_id": "proj-1", "unit_id": unit["id"], "selected_option_keys": opts}, timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    expected_upgrades = 25000 + 180000
    expected_gst = int((unit["base_price"] + expected_upgrades) * 0.05)
    assert j["base_price"] == unit["base_price"]
    assert j["upgrades_total"] == expected_upgrades
    assert j["gst"] == expected_gst
    assert j["booking_token"] == 50000
    assert j["total_price"] == unit["base_price"] + expected_upgrades + expected_gst


# ---------- AI Customization (Nano Banana) ----------
def test_ai_customize_room(api, user_token):
    proj = api.get(f"{BASE_URL}/api/projects/proj-1", timeout=15).json()
    unit = proj["units"][0]
    payload = {
        "project_id": "proj-1",
        "unit_id": unit["id"],
        "room_type": "living",
        "style_prompt": "warm white walls, oak flooring",
    }
    r = api.post(f"{BASE_URL}/api/ai/customize-room", json=payload,
                 headers=auth_headers(user_token), timeout=180)
    assert r.status_code == 200, f"AI call failed: {r.status_code} {r.text[:500]}"
    j = r.json()
    assert "image_base64" in j and j["image_base64"]
    assert "mime_type" in j


# ---------- Bookings & Stripe ----------
@pytest.fixture(scope="module")
def booking_ctx(api, user_token):
    proj = api.get(f"{BASE_URL}/api/projects/proj-1", timeout=15).json()
    unit = next(u for u in proj["units"] if u["status"] == "available")
    est = api.post(f"{BASE_URL}/api/pricing/estimate",
                   json={"project_id": "proj-1", "unit_id": unit["id"], "selected_option_keys": []}, timeout=15).json()
    r = api.post(f"{BASE_URL}/api/bookings",
                 json={"project_id": "proj-1", "unit_id": unit["id"],
                       "selected_option_keys": [], "total_price": est["total_price"]},
                 headers=auth_headers(user_token), timeout=15)
    assert r.status_code == 200, r.text
    b = r.json()
    assert "_id" not in b
    return {"booking": b, "unit_id": unit["id"]}


def test_create_intent_and_mock_confirm(api, user_token, booking_ctx):
    bid = booking_ctx["booking"]["id"]
    r = api.post(f"{BASE_URL}/api/payments/create-intent", json={"booking_id": bid},
                 headers=auth_headers(user_token), timeout=30)
    assert r.status_code == 200, f"create-intent failed: {r.status_code} {r.text}"
    j = r.json()
    assert j.get("client_secret")
    assert j.get("payment_intent_id")
    assert j["amount"] == 50000 * 100
    # With the placeholder STRIPE_SECRET_KEY, server must return mock mode
    assert j.get("mode") in ("mock", "live_test")
    if j.get("mode") == "mock":
        assert j["payment_intent_id"].startswith("pi_mock_")
        assert j["client_secret"].endswith("_secret_mock")

    r2 = api.post(f"{BASE_URL}/api/payments/mock-confirm", json={"booking_id": bid},
                  headers=auth_headers(user_token), timeout=15)
    assert r2.status_code == 200, r2.text
    confirmed = r2.json()
    assert confirmed["status"] == "confirmed"
    assert confirmed["payment_status"] == "succeeded"

    # Verify unit flipped to booked
    proj = api.get(f"{BASE_URL}/api/projects/proj-1", timeout=15).json()
    target = next(u for u in proj["units"] if u["id"] == booking_ctx["unit_id"])
    assert target["status"] == "booked"


def test_my_bookings(api, user_token):
    r = api.get(f"{BASE_URL}/api/bookings/my", headers=auth_headers(user_token), timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------- Builder-only endpoints ----------
def test_builder_my_projects(api, builder_token):
    r = api.get(f"{BASE_URL}/api/builder/my-projects", headers=auth_headers(builder_token), timeout=15)
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list)
    assert any(p["id"] == "proj-1" for p in arr)


def test_builder_leads(api, builder_token):
    r = api.get(f"{BASE_URL}/api/builder/leads", headers=auth_headers(builder_token), timeout=15)
    assert r.status_code == 200


def test_user_blocked_from_builder_endpoints(api, user_token):
    r1 = api.get(f"{BASE_URL}/api/builder/my-projects", headers=auth_headers(user_token), timeout=15)
    r2 = api.get(f"{BASE_URL}/api/builder/leads", headers=auth_headers(user_token), timeout=15)
    assert r1.status_code == 403
    assert r2.status_code == 403


def test_create_project_as_builder_and_progress(api, builder_token):
    payload = {
        "name": f"TEST Project {int(time.time())}",
        "tagline": "test",
        "city": "Mumbai",
        "locality": "Test Locality",
        "possession_date": "Dec 2027",
        "description": "test",
        "hero_image_url": "https://example.com/x.jpg",
        "gallery": [],
        "bhk_types": ["2BHK"],
        "min_price": 10000000,
        "max_price": 20000000,
        "amenities": [],
        "units": [{"id": "u-1", "label": "T-1", "type": "2BHK", "carpet_area": 800,
                   "floor": 1, "facing": "East", "status": "available", "base_price": 10000000}],
        "design_options": [],
        "rera_id": "TEST-RERA",
    }
    r = api.post(f"{BASE_URL}/api/projects", json=payload, headers=auth_headers(builder_token), timeout=15)
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["approved"] is False
    pid = p["id"]

    # Add progress
    from datetime import datetime, timezone
    prog = {"id": "tmp", "title": "TEST milestone", "description": "x",
            "percent": 25, "image_base64": None, "created_at": datetime.now(timezone.utc).isoformat()}
    r2 = api.post(f"{BASE_URL}/api/projects/{pid}/progress", json=prog,
                  headers=auth_headers(builder_token), timeout=15)
    assert r2.status_code == 200, r2.text
    assert r2.json()["ok"] is True


def test_user_cannot_create_project(api, user_token):
    payload = {"name": "x", "tagline": "x", "city": "x", "locality": "x",
               "possession_date": "x", "description": "x", "hero_image_url": "x",
               "min_price": 1, "max_price": 2}
    r = api.post(f"{BASE_URL}/api/projects", json=payload, headers=auth_headers(user_token), timeout=15)
    assert r.status_code == 403


# ---------- Admin-only endpoints ----------
def test_admin_builders(api, admin_token):
    r = api.get(f"{BASE_URL}/api/admin/builders", headers=auth_headers(admin_token), timeout=15)
    assert r.status_code == 200
    arr = r.json()
    assert any(b["id"] == "demo-builder-3" for b in arr)


def test_admin_projects(api, admin_token):
    r = api.get(f"{BASE_URL}/api/admin/projects", headers=auth_headers(admin_token), timeout=15)
    assert r.status_code == 200
    arr = r.json()
    assert any(p["id"] == "proj-3" for p in arr)


def test_admin_verify_builder(api, admin_token):
    r = api.post(f"{BASE_URL}/api/admin/builders/demo-builder-3/verify",
                 headers=auth_headers(admin_token), timeout=15)
    assert r.status_code == 200


def test_admin_approve_project(api, admin_token):
    r = api.post(f"{BASE_URL}/api/admin/projects/proj-3/approve",
                 headers=auth_headers(admin_token), timeout=15)
    assert r.status_code == 200
    r2 = api.get(f"{BASE_URL}/api/projects/proj-3", timeout=15)
    assert r2.status_code == 200
    assert r2.json()["approved"] is True


def test_admin_stats(api, admin_token):
    r = api.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers(admin_token), timeout=15)
    assert r.status_code == 200
    j = r.json()
    for k in ["projects", "approved_projects", "bookings", "paid_bookings",
              "builders", "verified_builders", "users", "revenue"]:
        assert k in j


def test_builder_blocked_from_admin(api, builder_token):
    r = api.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers(builder_token), timeout=15)
    assert r.status_code == 403


def test_user_blocked_from_admin(api, user_token):
    r = api.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers(user_token), timeout=15)
    assert r.status_code == 403
