from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import secrets
import bcrypt
import jwt
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# -------- LLM (Emergent) ----------
from emergentintegrations.llm.chat import LlmChat, UserMessage

# -------- Setup ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("mixpost")

app = FastAPI(title="Mixpost Clone API")
api = APIRouter(prefix="/api")

# -------- Helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": now_utc() + timedelta(hours=8)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh", "exp": now_utc() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def set_jwt_cookies(resp: Response, access: str, refresh: str):
    resp.set_cookie("access_token", access, httponly=True, secure=True,
                    samesite="none", max_age=8*3600, path="/")
    resp.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                    samesite="none", max_age=7*24*3600, path="/")

def set_session_cookie(resp: Response, session_token: str):
    resp.set_cookie("session_token", session_token, httponly=True, secure=True,
                    samesite="none", max_age=7*24*3600, path="/")

def clear_auth_cookies(resp: Response):
    for name in ("access_token", "refresh_token", "session_token"):
        resp.delete_cookie(name, path="/")

# -------- Models ----------
class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str = "user"
    picture: Optional[str] = None
    auth_provider: str = "local"
    active_workspace_id: Optional[str] = None
    created_at: datetime

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class SessionIn(BaseModel):
    session_id: str

class ForgotIn(BaseModel):
    email: EmailStr

class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=6)

class WorkspaceIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: Optional[str] = "#002FA7"

class Workspace(BaseModel):
    workspace_id: str
    name: str
    color: str
    owner_id: str
    created_at: datetime

class SocialAccountIn(BaseModel):
    workspace_id: str
    provider: Literal["twitter", "facebook", "instagram", "linkedin"]
    handle: str = Field(min_length=1, max_length=80)
    display_name: Optional[str] = None

class SocialAccount(BaseModel):
    account_id: str
    workspace_id: str
    provider: str
    handle: str
    display_name: Optional[str] = None
    avatar: Optional[str] = None
    connected_at: datetime
    status: str = "connected"

class PostIn(BaseModel):
    workspace_id: str
    content: str
    account_ids: List[str] = []
    media_urls: List[str] = []
    scheduled_at: Optional[datetime] = None
    status: Literal["draft", "scheduled", "published", "failed"] = "draft"

class Post(BaseModel):
    post_id: str
    workspace_id: str
    user_id: str
    content: str
    account_ids: List[str]
    media_urls: List[str]
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    status: str
    metrics: dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

class AISuggestIn(BaseModel):
    topic: str
    tone: Optional[str] = "engajado"
    networks: List[str] = []
    model: Optional[str] = "gpt-4o-mini"

# -------- Auth dependency ----------
async def _user_from_jwt(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get("type") != "access":
            return None
        return await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
    except jwt.PyJWTError:
        return None

async def _user_from_session_token(token: str) -> Optional[dict]:
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    exp = sess.get("expires_at")
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp and exp < now_utc():
        return None
    return await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})

async def get_current_user(request: Request) -> dict:
    # Try JWT cookie first
    jwt_cookie = request.cookies.get("access_token")
    if jwt_cookie:
        u = await _user_from_jwt(jwt_cookie)
        if u:
            return u
    # Try session token cookie
    sess_cookie = request.cookies.get("session_token")
    if sess_cookie:
        u = await _user_from_session_token(sess_cookie)
        if u:
            return u
    # Try Authorization header (try JWT first, then session)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        u = await _user_from_jwt(token)
        if u:
            return u
        u = await _user_from_session_token(token)
        if u:
            return u
    raise HTTPException(status_code=401, detail="Não autenticado")

# -------- Sanitize Mongo docs ----------
def to_user_public(u: dict) -> dict:
    keep = {"user_id", "email", "name", "role", "picture", "auth_provider",
            "active_workspace_id", "created_at"}
    return {k: u[k] for k in keep if k in u}

# -------- Auth Endpoints ----------
@api.post("/auth/register", response_model=UserPublic)
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": body.name,
        "password_hash": hash_password(body.password),
        "role": "user",
        "auth_provider": "local",
        "active_workspace_id": None,
        "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(doc)
    # Auto-create default workspace
    ws_id = f"ws_{uuid.uuid4().hex[:12]}"
    await db.workspaces.insert_one({
        "workspace_id": ws_id, "name": f"Workspace de {body.name}",
        "color": "#002FA7", "owner_id": user_id,
        "created_at": now_utc().isoformat(),
    })
    await db.users.update_one({"user_id": user_id}, {"$set": {"active_workspace_id": ws_id}})
    doc["active_workspace_id"] = ws_id

    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_jwt_cookies(response, access, refresh)
    return to_user_public(doc)

@api.post("/auth/login", response_model=UserPublic)
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    ident = f"{ip}:{email}"
    # Brute force protection
    attempt = await db.login_attempts.find_one({"identifier": ident})
    if attempt and attempt.get("count", 0) >= 5:
        last = attempt.get("last_attempt")
        if isinstance(last, str):
            last = datetime.fromisoformat(last)
        if last and last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        if last and last + timedelta(minutes=15) > now_utc():
            raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em 15 minutos.")
        await db.login_attempts.delete_one({"identifier": ident})

    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": ident},
            {"$inc": {"count": 1}, "$set": {"last_attempt": now_utc().isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    await db.login_attempts.delete_one({"identifier": ident})
    access = create_access_token(user["user_id"], email)
    refresh = create_refresh_token(user["user_id"])
    set_jwt_cookies(response, access, refresh)
    return to_user_public(user)

@api.post("/auth/logout")
async def logout(response: Response, request: Request):
    # If session_token cookie exists, delete server side too
    stoken = request.cookies.get("session_token")
    if stoken:
        await db.user_sessions.delete_one({"session_token": stoken})
    clear_auth_cookies(response)
    return {"ok": True}

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    rtoken = request.cookies.get("refresh_token")
    if not rtoken:
        raise HTTPException(status_code=401, detail="Refresh ausente")
    try:
        payload = jwt.decode(rtoken, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    access = create_access_token(user["user_id"], user["email"])
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=8*3600, path="/")
    return {"ok": True}

@api.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return to_user_public(user)

@api.post("/auth/session", response_model=UserPublic)
async def emergent_session_exchange(body: SessionIn, response: Response):
    """Exchange Emergent Auth session_id for a session_token (Google login)."""
    if not body.session_id:
        raise HTTPException(status_code=400, detail="session_id ausente")
    try:
        async with httpx.AsyncClient(timeout=15) as cx:
            r = await cx.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": body.session_id},
            )
            if r.status_code != 200:
                raise HTTPException(status_code=401, detail="Sessão Google inválida")
            data = r.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Falha ao validar com o provedor")

    email = data["email"].lower()
    name = data.get("name", email.split("@")[0])
    picture = data.get("picture")
    session_token = data["session_token"]

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        ws_id = f"ws_{uuid.uuid4().hex[:12]}"
        await db.workspaces.insert_one({
            "workspace_id": ws_id, "name": f"Workspace de {name}",
            "color": "#002FA7", "owner_id": user_id,
            "created_at": now_utc().isoformat(),
        })
        user = {
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "role": "user", "auth_provider": "google",
            "active_workspace_id": ws_id, "created_at": now_utc().isoformat(),
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"name": name, "picture": picture}},
        )
        user["name"] = name
        user["picture"] = picture

    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (now_utc() + timedelta(days=7)).isoformat(),
        "created_at": now_utc().isoformat(),
    })
    set_session_cookie(response, session_token)
    return to_user_public(user)

@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token, "user_id": user["user_id"],
            "expires_at": now_utc() + timedelta(hours=1),
            "used": False, "created_at": now_utc().isoformat(),
        })
        logger.info(f"[reset link] /reset-password?token={token}")
    return {"ok": True}

@api.post("/auth/reset-password")
async def reset_password(body: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": body.token})
    if not rec or rec.get("used"):
        raise HTTPException(status_code=400, detail="Token inválido ou já utilizado")
    exp = rec["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now_utc():
        raise HTTPException(status_code=400, detail="Token expirado")
    await db.users.update_one(
        {"user_id": rec["user_id"]},
        {"$set": {"password_hash": hash_password(body.password)}},
    )
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    return {"ok": True}

# -------- Workspaces ----------
async def _ensure_workspace(user_id: str, workspace_id: str) -> dict:
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "owner_id": user_id}, {"_id": 0})
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace não encontrado")
    return ws

@api.get("/workspaces", response_model=List[Workspace])
async def list_workspaces(user: dict = Depends(get_current_user)):
    items = await db.workspaces.find({"owner_id": user["user_id"]}, {"_id": 0}).to_list(200)
    return [Workspace(**i) for i in items]

@api.post("/workspaces", response_model=Workspace)
async def create_workspace(body: WorkspaceIn, user: dict = Depends(get_current_user)):
    ws_id = f"ws_{uuid.uuid4().hex[:12]}"
    doc = {
        "workspace_id": ws_id, "name": body.name,
        "color": body.color or "#002FA7",
        "owner_id": user["user_id"],
        "created_at": now_utc().isoformat(),
    }
    await db.workspaces.insert_one(doc)
    return Workspace(**doc)

@api.post("/workspaces/{workspace_id}/activate", response_model=UserPublic)
async def activate_workspace(workspace_id: str, user: dict = Depends(get_current_user)):
    await _ensure_workspace(user["user_id"], workspace_id)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"active_workspace_id": workspace_id}},
    )
    user["active_workspace_id"] = workspace_id
    return to_user_public(user)

@api.delete("/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: str, user: dict = Depends(get_current_user)):
    ws = await _ensure_workspace(user["user_id"], workspace_id)
    await db.workspaces.delete_one({"workspace_id": workspace_id})
    await db.social_accounts.delete_many({"workspace_id": workspace_id})
    await db.posts.delete_many({"workspace_id": workspace_id})
    if user.get("active_workspace_id") == workspace_id:
        another = await db.workspaces.find_one({"owner_id": user["user_id"]}, {"_id": 0})
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"active_workspace_id": another["workspace_id"] if another else None}},
        )
    return {"ok": True, "workspace": ws["name"]}

# -------- Social Accounts (mock) ----------
PROVIDER_AVATARS = {
    "twitter": "https://abs.twimg.com/favicons/twitter.3.ico",
    "facebook": "https://www.facebook.com/favicon.ico",
    "instagram": "https://www.instagram.com/favicon.ico",
    "linkedin": "https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca",
}

@api.get("/social-accounts", response_model=List[SocialAccount])
async def list_social_accounts(workspace_id: str, user: dict = Depends(get_current_user)):
    await _ensure_workspace(user["user_id"], workspace_id)
    items = await db.social_accounts.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(200)
    return [SocialAccount(**i) for i in items]

@api.post("/social-accounts", response_model=SocialAccount)
async def connect_social_account(body: SocialAccountIn, user: dict = Depends(get_current_user)):
    await _ensure_workspace(user["user_id"], body.workspace_id)
    acc_id = f"acc_{uuid.uuid4().hex[:12]}"
    doc = {
        "account_id": acc_id,
        "workspace_id": body.workspace_id,
        "provider": body.provider,
        "handle": body.handle,
        "display_name": body.display_name or body.handle,
        "avatar": PROVIDER_AVATARS.get(body.provider),
        "connected_at": now_utc().isoformat(),
        "status": "connected",
    }
    await db.social_accounts.insert_one(doc)
    return SocialAccount(**doc)

@api.delete("/social-accounts/{account_id}")
async def disconnect_social_account(account_id: str, user: dict = Depends(get_current_user)):
    acc = await db.social_accounts.find_one({"account_id": account_id}, {"_id": 0})
    if not acc:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    await _ensure_workspace(user["user_id"], acc["workspace_id"])
    await db.social_accounts.delete_one({"account_id": account_id})
    return {"ok": True}

# -------- Posts ----------
def _parse_dt(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return None

def _post_doc_to_model(doc: dict) -> Post:
    out = dict(doc)
    out["scheduled_at"] = _parse_dt(out.get("scheduled_at"))
    out["published_at"] = _parse_dt(out.get("published_at"))
    out["created_at"] = _parse_dt(out.get("created_at"))
    out["updated_at"] = _parse_dt(out.get("updated_at"))
    return Post(**out)

@api.get("/posts", response_model=List[Post])
async def list_posts(
    workspace_id: str,
    status: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    await _ensure_workspace(user["user_id"], workspace_id)
    q = {"workspace_id": workspace_id, "user_id": user["user_id"]}
    if status:
        q["status"] = status
    items = await db.posts.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_post_doc_to_model(i) for i in items]

@api.post("/posts", response_model=Post)
async def create_post(body: PostIn, user: dict = Depends(get_current_user)):
    await _ensure_workspace(user["user_id"], body.workspace_id)
    pid = f"post_{uuid.uuid4().hex[:12]}"
    sched = _parse_dt(body.scheduled_at)
    s = body.status
    if s == "scheduled" and not sched:
        raise HTTPException(status_code=400, detail="scheduled_at é obrigatório para agendar")
    doc = {
        "post_id": pid,
        "workspace_id": body.workspace_id,
        "user_id": user["user_id"],
        "content": body.content,
        "account_ids": body.account_ids,
        "media_urls": body.media_urls,
        "scheduled_at": sched.isoformat() if sched else None,
        "published_at": None,
        "status": s,
        "metrics": {},
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    }
    await db.posts.insert_one(doc)
    return _post_doc_to_model(doc)

@api.patch("/posts/{post_id}", response_model=Post)
async def update_post(post_id: str, body: PostIn, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"post_id": post_id, "user_id": user["user_id"]}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    sched = _parse_dt(body.scheduled_at)
    update = {
        "content": body.content,
        "account_ids": body.account_ids,
        "media_urls": body.media_urls,
        "scheduled_at": sched.isoformat() if sched else None,
        "status": body.status,
        "updated_at": now_utc().isoformat(),
    }
    await db.posts.update_one({"post_id": post_id}, {"$set": update})
    post.update(update)
    return _post_doc_to_model(post)

@api.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    res = await db.posts.delete_one({"post_id": post_id, "user_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    return {"ok": True}

@api.post("/posts/{post_id}/publish", response_model=Post)
async def publish_now(post_id: str, user: dict = Depends(get_current_user)):
    """Mock-publish a post (mark as published with fake metrics)."""
    post = await db.posts.find_one({"post_id": post_id, "user_id": user["user_id"]}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    # secrets is used here (instead of random) for cryptographic-grade RNG
    # even though these are non-sensitive mock metrics — keeps the codebase clean.
    def rand_in(lo: int, hi: int) -> int:
        return secrets.randbelow(hi - lo + 1) + lo
    metrics = {
        "impressions": rand_in(120, 5000),
        "engagements": rand_in(10, 800),
        "clicks": rand_in(2, 250),
        "likes": rand_in(5, 450),
        "shares": rand_in(0, 80),
        "comments": rand_in(0, 60),
    }
    update = {
        "status": "published",
        "published_at": now_utc().isoformat(),
        "metrics": metrics,
        "updated_at": now_utc().isoformat(),
    }
    await db.posts.update_one({"post_id": post_id}, {"$set": update})
    post.update(update)
    return _post_doc_to_model(post)

# -------- Calendar ----------
@api.get("/calendar")
async def calendar_view(
    workspace_id: str,
    start: str,
    end: str,
    user: dict = Depends(get_current_user),
):
    await _ensure_workspace(user["user_id"], workspace_id)
    s = _parse_dt(start)
    e = _parse_dt(end)
    cursor = db.posts.find(
        {
            "workspace_id": workspace_id,
            "user_id": user["user_id"],
            "$or": [
                {"scheduled_at": {"$gte": s.isoformat(), "$lte": e.isoformat()}},
                {"published_at": {"$gte": s.isoformat(), "$lte": e.isoformat()}},
            ],
        },
        {"_id": 0},
    )
    items = await cursor.to_list(1000)
    return [_post_doc_to_model(i).model_dump(mode="json") for i in items]

# -------- Analytics ----------
@api.get("/analytics/summary")
async def analytics_summary(workspace_id: str, user: dict = Depends(get_current_user)):
    await _ensure_workspace(user["user_id"], workspace_id)
    posts = await db.posts.find({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0}).to_list(2000)
    totals = {"impressions": 0, "engagements": 0, "clicks": 0, "likes": 0, "shares": 0, "comments": 0}
    by_provider = {}
    accounts = await db.social_accounts.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(500)
    acc_by_id = {a["account_id"]: a for a in accounts}
    daily = {}  # date -> dict
    for p in posts:
        m = p.get("metrics") or {}
        for k in totals:
            totals[k] += int(m.get(k, 0))
        pub = _parse_dt(p.get("published_at"))
        if pub:
            d = pub.date().isoformat()
            daily.setdefault(d, {"date": d, "impressions": 0, "engagements": 0, "clicks": 0})
            daily[d]["impressions"] += int(m.get("impressions", 0))
            daily[d]["engagements"] += int(m.get("engagements", 0))
            daily[d]["clicks"] += int(m.get("clicks", 0))
        for aid in p.get("account_ids", []):
            acc = acc_by_id.get(aid)
            if not acc:
                continue
            prov = acc["provider"]
            by_provider.setdefault(prov, {"provider": prov, "posts": 0, "impressions": 0, "engagements": 0})
            by_provider[prov]["posts"] += 1
            by_provider[prov]["impressions"] += int(m.get("impressions", 0))
            by_provider[prov]["engagements"] += int(m.get("engagements", 0))

    # top posts
    top = sorted(
        [post for post in posts if post.get("status") == "published"],
        key=lambda x: (x.get("metrics") or {}).get("engagements", 0),
        reverse=True,
    )[:5]
    top_clean = []
    for post in top:
        top_clean.append({
            "post_id": post["post_id"],
            "content": post["content"][:140],
            "metrics": post.get("metrics", {}),
            "published_at": post.get("published_at"),
        })

    return {
        "totals": totals,
        "by_provider": list(by_provider.values()),
        "daily": sorted(daily.values(), key=lambda x: x["date"]),
        "top_posts": top_clean,
        "post_count": len(posts),
        "published_count": sum(1 for post in posts if post.get("status") == "published"),
        "scheduled_count": sum(1 for post in posts if post.get("status") == "scheduled"),
        "draft_count": sum(1 for post in posts if post.get("status") == "draft"),
    }

# -------- AI Suggest ----------
ALLOWED_MODELS = {
    "gpt-4o-mini": ("openai", "gpt-4o-mini"),
    "gpt-5.2": ("openai", "gpt-5.2"),
    "claude-haiku-4.5": ("anthropic", "claude-haiku-4-5-20251001"),
    "claude-sonnet-4.5": ("anthropic", "claude-sonnet-4-5-20250929"),
    "gemini-2.5-flash": ("gemini", "gemini-2.5-flash"),
}

@api.post("/ai/suggest")
async def ai_suggest(body: AISuggestIn, user: dict = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key não configurada")
    provider, model_id = ALLOWED_MODELS.get(body.model or "gpt-4o-mini", ALLOWED_MODELS["gpt-4o-mini"])
    networks = ", ".join(body.networks) if body.networks else "redes sociais"
    system = (
        "Você é um especialista brasileiro em copywriting de redes sociais. "
        "Crie legendas curtas, envolventes, em português brasileiro, com emojis quando fizer sentido, "
        "e sempre forneça hashtags relevantes ao final. Saída em JSON estrito."
    )
    prompt = (
        f"Tópico: {body.topic}\n"
        f"Tom desejado: {body.tone}\n"
        f"Redes-alvo: {networks}\n\n"
        "Gere 3 variações de legenda. Para cada uma, devolva: caption (string, ate 220 caracteres), "
        "hashtags (lista de 5 hashtags com #).\n\n"
        "Responda APENAS com JSON válido no formato:\n"
        '{"variations":[{"caption":"...","hashtags":["#a","#b"]}, ...]}'
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ai_suggest_{user['user_id']}_{uuid.uuid4().hex[:6]}",
            system_message=system,
        ).with_model(provider, model_id)
        response_text = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.exception("AI suggest error")
        raise HTTPException(status_code=502, detail=f"Falha na IA: {e}")

    import json
    import re
    raw = response_text.strip()
    # Try to extract JSON block
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    parsed = None
    if match:
        try:
            parsed = json.loads(match.group(0))
        except Exception:
            parsed = None
    if not parsed:
        parsed = {"variations": [{"caption": raw[:220], "hashtags": []}]}
    return parsed

# -------- Health ----------
@api.get("/")
async def root():
    return {"service": "mixpost-clone", "status": "ok"}

# -------- Startup ----------
async def seed_default_data():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.workspaces.create_index("workspace_id", unique=True)
    await db.workspaces.create_index("owner_id")
    await db.social_accounts.create_index("account_id", unique=True)
    await db.social_accounts.create_index("workspace_id")
    await db.posts.create_index("post_id", unique=True)
    await db.posts.create_index([("workspace_id", 1), ("user_id", 1)])
    await db.user_sessions.create_index("session_token", unique=True)
    await db.login_attempts.create_index("identifier")

    seeds = [
        (os.environ.get("ADMIN_EMAIL", "admin@mixpost.app"),
         os.environ.get("ADMIN_PASSWORD", "admin123"),
         "Administrador", "admin"),
        (os.environ.get("TEST_USER_EMAIL", "user@mixpost.app"),
         os.environ.get("TEST_USER_PASSWORD", "user123"),
         "Usuário Teste", "user"),
    ]
    for email, password, name, role in seeds:
        existing = await db.users.find_one({"email": email})
        if existing is None:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            ws_id = f"ws_{uuid.uuid4().hex[:12]}"
            await db.workspaces.insert_one({
                "workspace_id": ws_id, "name": f"Workspace de {name}",
                "color": "#002FA7", "owner_id": user_id,
                "created_at": now_utc().isoformat(),
            })
            await db.users.insert_one({
                "user_id": user_id, "email": email, "name": name, "role": role,
                "password_hash": hash_password(password),
                "auth_provider": "local",
                "active_workspace_id": ws_id,
                "created_at": now_utc().isoformat(),
            })
            logger.info(f"Seeded {role}: {email}")
        elif not verify_password(password, existing.get("password_hash", "")):
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": hash_password(password)}},
            )

@app.on_event("startup")
async def on_startup():
    try:
        await seed_default_data()
    except Exception:
        logger.exception("Seed error")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

# -------- Mount ----------
app.include_router(api)

origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
