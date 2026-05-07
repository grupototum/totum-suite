"""
Mixpost Clone — Backend API regression tests.
Covers: health, auth (JWT + Emergent Google + password reset + brute force),
workspaces, social accounts, posts, calendar, analytics, AI suggest.
"""
import os
import time
import uuid
from datetime import datetime, timezone, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://content-mix-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mixpost.app"
ADMIN_PASS = "admin123"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies, "access_token cookie not set"
    assert "refresh_token" in s.cookies, "refresh_token cookie not set"
    return s


@pytest.fixture(scope="module")
def admin_workspace(admin_session):
    r = admin_session.get(f"{API}/workspaces", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1
    me = admin_session.get(f"{API}/auth/me", timeout=15).json()
    return me.get("active_workspace_id") or items[0]["workspace_id"]


# ---------- Health ----------
def test_health_root():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_login_admin(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert data["active_workspace_id"]

    def test_me_without_cookie(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_login_wrong_password(self):
        r = requests.post(
            f"{API}/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrong-pass-xx"},
            timeout=15,
        )
        assert r.status_code in (401, 429)

    def test_register_new_user_creates_workspace(self):
        s = requests.Session()
        email = f"test_reg_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(
            f"{API}/auth/register",
            json={"email": email, "password": "password123", "name": "Reg User"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == email
        assert data["active_workspace_id"]
        assert "access_token" in s.cookies
        # workspace listing should contain the auto-created ws
        ws = s.get(f"{API}/workspaces", timeout=15).json()
        assert any(w["workspace_id"] == data["active_workspace_id"] for w in ws)

    def test_refresh_rotates_access(self, admin_session):
        old_access = admin_session.cookies.get("access_token")
        time.sleep(1)
        r = admin_session.post(f"{API}/auth/refresh", timeout=15)
        assert r.status_code == 200
        new_access = admin_session.cookies.get("access_token")
        assert new_access and new_access != old_access

    def test_logout_clears_cookies(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
        assert r.status_code == 200
        r2 = s.post(f"{API}/auth/logout", timeout=15)
        assert r2.status_code == 200
        # cookies cleared (or at least /auth/me fails)
        r3 = requests.get(f"{API}/auth/me", cookies={}, timeout=15)
        assert r3.status_code == 401

    def test_emergent_session_bogus(self):
        r = requests.post(f"{API}/auth/session", json={"session_id": "bogus_session_xyz"}, timeout=20)
        assert r.status_code in (401, 502)

    def test_forgot_password_ok(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_reset_password_invalid_token(self):
        r = requests.post(
            f"{API}/auth/reset-password",
            json={"token": "invalid_token", "password": "newpass123"},
            timeout=15,
        )
        assert r.status_code == 400


# ---------- Brute force lockout ----------
def test_brute_force_lockout():
    bf_email = f"bf_{uuid.uuid4().hex[:6]}@example.com"
    # Create a user
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"email": bf_email, "password": "rightpass1", "name": "BF"}, timeout=15)
    assert r.status_code == 200
    s.post(f"{API}/auth/logout", timeout=15)
    got_429 = False
    last_status = None
    for _ in range(12):
        r = requests.post(f"{API}/auth/login", json={"email": bf_email, "password": "wrongpass"}, timeout=15)
        last_status = r.status_code
        if r.status_code == 429:
            got_429 = True
            break
    assert got_429, f"expected 429 lockout within 12 attempts, last={last_status}"


# ---------- Workspaces ----------
class TestWorkspaces:
    def test_list_create_activate_delete(self, admin_session):
        # create
        r = admin_session.post(f"{API}/workspaces", json={"name": "TEST_WS_X", "color": "#FFCC00"}, timeout=15)
        assert r.status_code == 200
        wsid = r.json()["workspace_id"]
        # list contains it
        items = admin_session.get(f"{API}/workspaces", timeout=15).json()
        assert any(w["workspace_id"] == wsid for w in items)
        # activate
        r2 = admin_session.post(f"{API}/workspaces/{wsid}/activate", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["active_workspace_id"] == wsid
        # delete
        r3 = admin_session.delete(f"{API}/workspaces/{wsid}", timeout=15)
        assert r3.status_code == 200


# ---------- Social Accounts ----------
class TestSocialAccounts:
    def test_connect_list_disconnect(self, admin_session, admin_workspace):
        created_ids = []
        for prov in ["twitter", "facebook", "instagram", "linkedin"]:
            r = admin_session.post(
                f"{API}/social-accounts",
                json={"workspace_id": admin_workspace, "provider": prov, "handle": f"TEST_{prov}_acc"},
                timeout=15,
            )
            assert r.status_code == 200, r.text
            d = r.json()
            assert d["provider"] == prov
            created_ids.append(d["account_id"])
        items = admin_session.get(
            f"{API}/social-accounts", params={"workspace_id": admin_workspace}, timeout=15
        ).json()
        ids = {i["account_id"] for i in items}
        for aid in created_ids:
            assert aid in ids
        for aid in created_ids:
            r = admin_session.delete(f"{API}/social-accounts/{aid}", timeout=15)
            assert r.status_code == 200


# ---------- Posts ----------
class TestPosts:
    def test_full_post_lifecycle(self, admin_session, admin_workspace):
        # connect one account so we can attach
        acc = admin_session.post(
            f"{API}/social-accounts",
            json={"workspace_id": admin_workspace, "provider": "twitter", "handle": "TEST_post_acc"},
            timeout=15,
        ).json()
        aid = acc["account_id"]

        # 1. create draft
        r = admin_session.post(
            f"{API}/posts",
            json={
                "workspace_id": admin_workspace,
                "content": "TEST draft post",
                "account_ids": [aid],
                "status": "draft",
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        draft = r.json()
        assert draft["status"] == "draft"
        draft_id = draft["post_id"]

        # 2. create scheduled
        future = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        r2 = admin_session.post(
            f"{API}/posts",
            json={
                "workspace_id": admin_workspace,
                "content": "TEST scheduled post",
                "account_ids": [aid],
                "status": "scheduled",
                "scheduled_at": future,
            },
            timeout=15,
        )
        assert r2.status_code == 200
        sched = r2.json()
        assert sched["status"] == "scheduled"
        assert sched["scheduled_at"] is not None
        sched_id = sched["post_id"]

        # 3. publish draft
        r3 = admin_session.post(f"{API}/posts/{draft_id}/publish", timeout=15)
        assert r3.status_code == 200
        pub = r3.json()
        assert pub["status"] == "published"
        assert pub["metrics"]["impressions"] > 0
        assert pub["published_at"] is not None

        # 4. update scheduled -> change content
        r4 = admin_session.patch(
            f"{API}/posts/{sched_id}",
            json={
                "workspace_id": admin_workspace,
                "content": "TEST scheduled post UPDATED",
                "account_ids": [aid],
                "status": "scheduled",
                "scheduled_at": future,
            },
            timeout=15,
        )
        assert r4.status_code == 200
        assert r4.json()["content"].endswith("UPDATED")

        # 5. list filtered
        rl = admin_session.get(
            f"{API}/posts", params={"workspace_id": admin_workspace, "status": "scheduled"}, timeout=15
        )
        assert rl.status_code == 200
        assert all(p["status"] == "scheduled" for p in rl.json())

        rp = admin_session.get(
            f"{API}/posts", params={"workspace_id": admin_workspace, "status": "published"}, timeout=15
        )
        assert any(p["post_id"] == draft_id for p in rp.json())

        # 6. delete scheduled
        rd = admin_session.delete(f"{API}/posts/{sched_id}", timeout=15)
        assert rd.status_code == 200

        # cleanup connected account
        admin_session.delete(f"{API}/social-accounts/{aid}", timeout=15)


# ---------- Calendar ----------
class TestCalendar:
    def test_calendar_window(self, admin_session, admin_workspace):
        start = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        r = admin_session.get(
            f"{API}/calendar",
            params={"workspace_id": admin_workspace, "start": start, "end": end},
            timeout=15,
        )
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Analytics ----------
class TestAnalytics:
    def test_analytics_summary(self, admin_session, admin_workspace):
        r = admin_session.get(
            f"{API}/analytics/summary", params={"workspace_id": admin_workspace}, timeout=15
        )
        assert r.status_code == 200
        d = r.json()
        for key in ("totals", "by_provider", "daily", "top_posts", "post_count"):
            assert key in d
        for k in ("impressions", "engagements", "clicks", "likes", "shares", "comments"):
            assert k in d["totals"]


# ---------- AI Suggest ----------
class TestAI:
    def test_ai_suggest(self, admin_session):
        r = admin_session.post(
            f"{API}/ai/suggest",
            json={"topic": "lançamento de café especial", "tone": "engajado", "networks": ["twitter"]},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "variations" in d and isinstance(d["variations"], list)
        assert len(d["variations"]) >= 1
        v0 = d["variations"][0]
        assert "caption" in v0
