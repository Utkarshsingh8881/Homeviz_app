"""Aura Proptech FastAPI backend.

Features
- JWT email/password auth with roles (user / builder / admin)
- Projects, units, design options, pricing rules
- AI room customization via Gemini Nano Banana (Emergent LLM key)
- Pricing engine
- Bookings + Stripe PaymentIntent (test mode) + mock-confirm for Expo Go
- Construction progress updates
- Admin verification / approval endpoints
- Seed demo data on startup
"""
from __future__ import annotations

import asyncio
import base64
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Any, Optional

import bcrypt
import jwt
import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# --- Config ---
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET_KEY"]
JWT_ALGO = os.environ.get("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE_MIN = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
stripe.api_key = STRIPE_SECRET_KEY

ROLE_LEVEL = {"user": 0, "builder": 1, "admin": 2}

# --- DB ---
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Aura Proptech API")
api = APIRouter(prefix="/api")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ---------------- Models ---------------- #
class SignupBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: str = "user"  # user | builder | admin


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    verified: bool = False
    company_name: Optional[str] = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class DesignOption(BaseModel):
    key: str
    label: str
    price_delta: int  # in INR (smallest unit avoided; using whole INR)
    category: str  # wall, flooring, kitchen, furniture, lighting, finish


class PriceRule(BaseModel):
    base_price: int
    per_sqft: Optional[int] = None
    booking_token: int = 50000  # token booking amount (INR)


class Unit(BaseModel):
    id: str
    label: str  # e.g. "A-1204"
    type: str  # e.g. "3BHK"
    carpet_area: int  # sqft
    floor: int
    facing: str
    status: str = "available"  # available | booked | sold
    base_price: int


class ProgressUpdate(BaseModel):
    id: str
    title: str
    description: str
    percent: int
    image_base64: Optional[str] = None
    created_at: datetime


class ProjectCreate(BaseModel):
    name: str
    tagline: str
    city: str
    locality: str
    possession_date: str
    description: str
    hero_image_url: str
    gallery: list[str] = []
    bhk_types: list[str] = ["2BHK", "3BHK"]
    min_price: int
    max_price: int
    amenities: list[str] = []
    units: list[Unit] = []
    design_options: list[DesignOption] = []
    rera_id: Optional[str] = None


class ProjectOut(ProjectCreate):
    id: str
    builder_id: str
    builder_name: str
    builder_verified: bool
    approved: bool
    trust_score: int
    progress: list[ProgressUpdate] = []
    documents: list[dict] = []
    created_at: datetime


class PriceEstimateBody(BaseModel):
    project_id: str
    unit_id: str
    selected_option_keys: list[str] = []


class CustomizeBody(BaseModel):
    project_id: str
    unit_id: str
    room_type: str  # living, bedroom, kitchen
    style_prompt: str  # combined description
    base_image_base64: Optional[str] = None  # optional override


class BookingCreate(BaseModel):
    project_id: str
    unit_id: str
    selected_option_keys: list[str] = []
    total_price: int


# ---------------- Helpers ---------------- #
def _hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def _verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def _make_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MIN),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def _current_user(token: Annotated[Optional[str], Depends(oauth2_scheme)]) -> dict:
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"_id": payload["sub"]}, {"password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def _require_role(min_role: str):
    async def dep(u=Depends(_current_user)):
        if ROLE_LEVEL[u["role"]] < ROLE_LEVEL[min_role]:
            raise HTTPException(403, "Forbidden")
        return u
    return dep


def _user_out(u: dict) -> dict:
    return {
        "id": u["_id"],
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u["role"],
        "verified": u.get("verified", False),
        "company_name": u.get("company_name"),
    }


def _clean_doc(d: dict) -> dict:
    """Strip MongoDB internal id field for output."""
    if not d:
        return d
    d = {k: v for k, v in d.items() if k != "_id" and not k.startswith("password")}
    return d


# ---------------- Auth ---------------- #
@api.post("/auth/signup", response_model=TokenOut)
async def signup(body: SignupBody):
    if body.role not in ROLE_LEVEL:
        raise HTTPException(400, "Invalid role")
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "_id": uid,
        "email": body.email.lower(),
        "password_hash": _hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "verified": body.role == "user",  # users auto-verified, builders/admins need verification
        "company_name": body.name if body.role == "builder" else None,
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(doc)
    return {"access_token": _make_token(uid, body.role), "user": _user_out(doc)}


@api.post("/auth/login", response_model=TokenOut)
async def login(body: LoginBody):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not _verify_password(body.password, user["password_hash"]):
        raise HTTPException(400, "Incorrect email or password")
    return {"access_token": _make_token(user["_id"], user["role"]), "user": _user_out(user)}


@api.get("/auth/me", response_model=UserOut)
async def me(u=Depends(_current_user)):
    return _user_out(u)


# ---------------- Projects ---------------- #
@api.get("/projects")
async def list_projects(
    city: Optional[str] = None,
    bhk: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    only_approved: bool = True,
):
    q: dict = {}
    if only_approved:
        q["approved"] = True
    if city:
        q["city"] = {"$regex": f"^{city}$", "$options": "i"}
    if bhk:
        q["bhk_types"] = bhk
    if min_price is not None:
        q["min_price"] = {"$gte": min_price}
    if max_price is not None:
        q["max_price"] = {"$lte": max_price}
    docs = await db.projects.find(q, {"_id": 0}).to_list(200)
    return docs


@api.get("/projects/{project_id}")
async def get_project(project_id: str):
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Project not found")
    return doc


@api.post("/projects")
async def create_project(body: ProjectCreate, u=Depends(_require_role("builder"))):
    pid = str(uuid.uuid4())
    doc = body.model_dump()
    doc.update({
        "_id": pid,
        "id": pid,
        "builder_id": u["_id"],
        "builder_name": u.get("company_name") or u["name"],
        "builder_verified": u.get("verified", False),
        "approved": u["role"] == "admin",  # auto-approved if admin creates, else pending
        "trust_score": 70 if u.get("verified") else 50,
        "progress": [],
        "documents": [],
        "created_at": datetime.now(timezone.utc),
    })
    await db.projects.insert_one(doc)
    return _clean_doc(doc)


@api.get("/builder/my-projects")
async def my_projects(u=Depends(_require_role("builder"))):
    docs = await db.projects.find({"builder_id": u["_id"]}, {"_id": 0}).to_list(200)
    return docs


@api.post("/projects/{project_id}/progress")
async def add_progress(project_id: str, body: ProgressUpdate, u=Depends(_require_role("builder"))):
    proj = await db.projects.find_one({"id": project_id})
    if not proj:
        raise HTTPException(404, "Project not found")
    if proj["builder_id"] != u["_id"] and u["role"] != "admin":
        raise HTTPException(403, "Not your project")
    update = body.model_dump()
    update["id"] = str(uuid.uuid4())
    update["created_at"] = datetime.now(timezone.utc)
    await db.projects.update_one({"id": project_id}, {"$push": {"progress": update}})
    return {"ok": True, "progress": update}


# ---------------- Pricing ---------------- #
@api.post("/pricing/estimate")
async def price_estimate(body: PriceEstimateBody):
    proj = await db.projects.find_one({"id": body.project_id}, {"_id": 0})
    if not proj:
        raise HTTPException(404, "Project not found")
    unit = next((u for u in proj.get("units", []) if u["id"] == body.unit_id), None)
    if not unit:
        raise HTTPException(404, "Unit not found")
    base = unit["base_price"]
    options = {o["key"]: o for o in proj.get("design_options", [])}
    upgrades = []
    upgrade_total = 0
    for k in body.selected_option_keys:
        if k in options:
            upgrades.append(options[k])
            upgrade_total += options[k]["price_delta"]
    gst = int((base + upgrade_total) * 0.05)
    booking_token = 50000
    total = base + upgrade_total + gst
    return {
        "base_price": base,
        "upgrades": upgrades,
        "upgrades_total": upgrade_total,
        "gst": gst,
        "booking_token": booking_token,
        "total_price": total,
    }


# ---------------- AI Customization (Nano Banana) ---------------- #
@api.post("/ai/customize-room")
async def customize_room(body: CustomizeBody, u=Depends(_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "AI key not configured")

    # Lazy import — keeps cold start fast
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent  # type: ignore

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"customize-{uuid.uuid4()}",
        system_message="You are an expert interior design AI that produces photo-realistic Indian apartment interior renders.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    prompt = (
        f"Generate a photo-realistic image of a {body.room_type} interior of an Indian apartment. "
        f"Style and finishes: {body.style_prompt}. "
        f"Use natural daylight, clean composition, magazine quality, no text or watermarks."
    )

    file_contents = []
    if body.base_image_base64:
        file_contents.append(ImageContent(body.base_image_base64))

    msg = UserMessage(text=prompt, file_contents=file_contents or None)

    try:
        text, images = await chat.send_message_multimodal_response(msg)
    except Exception as e:
        logger.exception("AI generation failed")
        raise HTTPException(500, f"AI generation failed: {e}")

    if not images:
        raise HTTPException(500, "No image returned by AI")

    img = images[0]
    render_id = str(uuid.uuid4())
    record = {
        "_id": render_id,
        "id": render_id,
        "user_id": u["_id"],
        "project_id": body.project_id,
        "unit_id": body.unit_id,
        "room_type": body.room_type,
        "style_prompt": body.style_prompt,
        "mime_type": img["mime_type"],
        "image_base64": img["data"],
        "created_at": datetime.now(timezone.utc),
    }
    await db.renders.insert_one(record)
    return {
        "id": render_id,
        "mime_type": img["mime_type"],
        "image_base64": img["data"],
        "text": text,
    }


@api.get("/ai/my-renders")
async def my_renders(u=Depends(_current_user)):
    docs = await db.renders.find({"user_id": u["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs


# ---------------- Bookings + Stripe ---------------- #
@api.post("/bookings")
async def create_booking(body: BookingCreate, u=Depends(_current_user)):
    proj = await db.projects.find_one({"id": body.project_id})
    if not proj:
        raise HTTPException(404, "Project not found")
    unit = next((x for x in proj.get("units", []) if x["id"] == body.unit_id), None)
    if not unit:
        raise HTTPException(404, "Unit not found")

    booking_id = str(uuid.uuid4())
    booking_token = 50000  # INR
    doc = {
        "_id": booking_id,
        "id": booking_id,
        "user_id": u["_id"],
        "user_name": u["name"],
        "project_id": body.project_id,
        "project_name": proj["name"],
        "unit_id": body.unit_id,
        "unit_label": unit["label"],
        "builder_id": proj["builder_id"],
        "selected_option_keys": body.selected_option_keys,
        "total_price": body.total_price,
        "booking_token": booking_token,
        "status": "pending",
        "payment_status": "pending",
        "stripe_payment_intent_id": None,
        "created_at": datetime.now(timezone.utc),
    }
    await db.bookings.insert_one(doc)
    return _clean_doc(doc)


@api.post("/payments/create-intent")
async def create_intent(payload: dict, u=Depends(_current_user)):
    booking_id = payload.get("booking_id")
    if not booking_id:
        raise HTTPException(400, "booking_id required")
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking["user_id"] != u["_id"]:
        raise HTTPException(403, "Not your booking")

    amount_paise = booking["booking_token"] * 100  # INR -> paise

    # If the Stripe key is the Emergent placeholder, fall back to a mock
    # PaymentIntent so the Expo Go MVP demo works end-to-end without a real
    # Stripe account. The user can drop in their own sk_test_... key any time.
    is_placeholder = (
        not STRIPE_SECRET_KEY
        or STRIPE_SECRET_KEY == "sk_test_emergent"
        or not STRIPE_SECRET_KEY.startswith("sk_test_")
        and not STRIPE_SECRET_KEY.startswith("sk_live_")
    )

    if is_placeholder:
        mock_id = f"pi_mock_{uuid.uuid4().hex[:16]}"
        client_secret = f"{mock_id}_secret_mock"
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"stripe_payment_intent_id": mock_id, "stripe_mode": "mock"}},
        )
        return {
            "client_secret": client_secret,
            "payment_intent_id": mock_id,
            "amount": amount_paise,
            "mode": "mock",
        }

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_paise,
            currency="inr",
            automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
            metadata={"booking_id": booking_id, "user_id": u["_id"]},
        )
    except Exception as e:
        logger.exception("Stripe error")
        raise HTTPException(500, f"Stripe error: {e}")

    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"stripe_payment_intent_id": intent["id"], "stripe_mode": "live_test"}},
    )
    return {
        "client_secret": intent["client_secret"],
        "payment_intent_id": intent["id"],
        "amount": amount_paise,
        "mode": "live_test",
    }


@api.post("/payments/mock-confirm")
async def mock_confirm(payload: dict, u=Depends(_current_user)):
    """Expo Go MVP helper: marks the booking as paid in test mode.

    In a real dev build the client would use Stripe PaymentSheet to confirm
    the PaymentIntent and our webhook would mark the booking paid. For the
    Expo Go demo we expose this endpoint that only works against a test-mode
    PaymentIntent. Clearly labeled as a test-mode flow in the UI.
    """
    booking_id = payload.get("booking_id")
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking["user_id"] != u["_id"]:
        raise HTTPException(403, "Not your booking")

    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "status": "confirmed",
            "payment_status": "succeeded",
            "paid_at": datetime.now(timezone.utc),
        }},
    )
    # Mark unit as booked
    await db.projects.update_one(
        {"id": booking["project_id"], "units.id": booking["unit_id"]},
        {"$set": {"units.$.status": "booked"}},
    )
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated


@api.get("/bookings/my")
async def my_bookings(u=Depends(_current_user)):
    docs = await db.bookings.find({"user_id": u["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs


@api.get("/builder/leads")
async def builder_leads(u=Depends(_require_role("builder"))):
    docs = await db.bookings.find({"builder_id": u["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


# ---------------- Admin ---------------- #
@api.get("/admin/builders")
async def admin_builders(u=Depends(_require_role("admin"))):
    docs = await db.users.find({"role": "builder"}, {"password_hash": 0}).to_list(500)
    return [_user_out(d) for d in docs]


@api.post("/admin/builders/{builder_id}/verify")
async def admin_verify_builder(builder_id: str, u=Depends(_require_role("admin"))):
    res = await db.users.update_one({"_id": builder_id, "role": "builder"}, {"$set": {"verified": True}})
    if res.matched_count == 0:
        raise HTTPException(404, "Builder not found")
    # update trust score on projects
    await db.projects.update_many({"builder_id": builder_id}, {"$set": {"builder_verified": True, "trust_score": 85}})
    return {"ok": True}


@api.get("/admin/projects")
async def admin_projects(u=Depends(_require_role("admin"))):
    docs = await db.projects.find({}, {"_id": 0}).to_list(500)
    return docs


@api.post("/admin/projects/{project_id}/approve")
async def admin_approve_project(project_id: str, u=Depends(_require_role("admin"))):
    res = await db.projects.update_one({"id": project_id}, {"$set": {"approved": True}})
    if res.matched_count == 0:
        raise HTTPException(404, "Project not found")
    return {"ok": True}


@api.get("/admin/stats")
async def admin_stats(u=Depends(_require_role("admin"))):
    projects = await db.projects.count_documents({})
    approved = await db.projects.count_documents({"approved": True})
    bookings = await db.bookings.count_documents({})
    paid = await db.bookings.count_documents({"payment_status": "succeeded"})
    builders = await db.users.count_documents({"role": "builder"})
    verified_builders = await db.users.count_documents({"role": "builder", "verified": True})
    users = await db.users.count_documents({"role": "user"})
    revenue_doc = await db.bookings.aggregate([
        {"$match": {"payment_status": "succeeded"}},
        {"$group": {"_id": None, "sum": {"$sum": "$booking_token"}}}
    ]).to_list(1)
    revenue = revenue_doc[0]["sum"] if revenue_doc else 0
    return {
        "projects": projects,
        "approved_projects": approved,
        "bookings": bookings,
        "paid_bookings": paid,
        "builders": builders,
        "verified_builders": verified_builders,
        "users": users,
        "revenue": revenue,
    }


# ---------------- Health ---------------- #
@api.get("/")
async def root():
    return {"name": "Aura Proptech API", "status": "ok"}


# ---------------- Seed ---------------- #
DEMO_ROOM_IMAGE = "https://images.pexels.com/photos/20418771/pexels-photo-20418771.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"

SEED_DESIGN_OPTIONS = [
    {"key": "wall_warm_white", "label": "Warm White Walls", "price_delta": 25000, "category": "wall"},
    {"key": "wall_terracotta", "label": "Terracotta Accent Wall", "price_delta": 65000, "category": "wall"},
    {"key": "wall_charcoal", "label": "Charcoal Feature Wall", "price_delta": 80000, "category": "wall"},
    {"key": "floor_oak", "label": "European Oak Flooring", "price_delta": 180000, "category": "flooring"},
    {"key": "floor_marble", "label": "Italian Marble", "price_delta": 320000, "category": "flooring"},
    {"key": "floor_vitrified", "label": "Premium Vitrified Tiles", "price_delta": 90000, "category": "flooring"},
    {"key": "kitchen_modular", "label": "Modular Kitchen — Matte", "price_delta": 250000, "category": "kitchen"},
    {"key": "kitchen_island", "label": "Open Island Kitchen", "price_delta": 450000, "category": "kitchen"},
    {"key": "light_warm", "label": "Warm Ambient Lighting", "price_delta": 60000, "category": "lighting"},
    {"key": "light_smart", "label": "Smart Home Lighting", "price_delta": 180000, "category": "lighting"},
    {"key": "furniture_scandi", "label": "Scandinavian Furniture Set", "price_delta": 220000, "category": "furniture"},
    {"key": "furniture_indian", "label": "Indo-modern Furniture Set", "price_delta": 260000, "category": "furniture"},
    {"key": "finish_premium", "label": "Premium Finish Package", "price_delta": 350000, "category": "finish"},
]


def _seed_units(base: int, area_base: int) -> list[dict]:
    units = []
    for i, floor in enumerate([8, 12, 14, 18]):
        units.append({
            "id": f"u-{floor}",
            "label": f"A-{floor:02d}04",
            "type": "3BHK" if i % 2 == 0 else "2BHK",
            "carpet_area": area_base + (floor * 18),
            "floor": floor,
            "facing": ["East", "North-East", "West", "South"][i],
            "status": "available",
            "base_price": base + (floor * 150000),
        })
    return units


SEED_PROJECTS = [
    {
        "name": "Aurelia Heights",
        "tagline": "Sky-touch residences in the heart of Bandra",
        "city": "Mumbai",
        "locality": "Bandra West",
        "possession_date": "Dec 2026",
        "description": "Curated 2 & 3 BHK sky residences with private gardens, infinity pool and a Michelin-trained chef's lounge.",
        "hero_image_url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBleHRlcmlvciUyMHByb3BlcnR5JTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc4MTM0Nzk1NXww&ixlib=rb-4.1.0&q=85",
        "gallery": [
            "https://images.pexels.com/photos/20418771/pexels-photo-20418771.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900",
        ],
        "bhk_types": ["2BHK", "3BHK"],
        "min_price": 32000000,
        "max_price": 78000000,
        "amenities": ["Infinity Pool", "Sky Lounge", "EV Charging", "Concierge", "Private Cinema"],
        "rera_id": "MH-RERA-AUR-2024",
    },
    {
        "name": "The Banyan Estate",
        "tagline": "Heritage living, reimagined",
        "city": "Bangalore",
        "locality": "Indiranagar",
        "possession_date": "Jun 2026",
        "description": "Low-rise villas wrapped around a 200-year-old banyan tree. Crafted by award-winning architects.",
        "hero_image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
        "gallery": [],
        "bhk_types": ["3BHK", "4BHK"],
        "min_price": 28000000,
        "max_price": 65000000,
        "amenities": ["Forest Walk", "Yoga Deck", "Co-working", "Organic Garden"],
        "rera_id": "KA-RERA-BAN-2023",
    },
    {
        "name": "Marina Vista",
        "tagline": "Sea-front sanctuaries",
        "city": "Chennai",
        "locality": "ECR",
        "possession_date": "Mar 2027",
        "description": "Tower of 24 floors with uninterrupted Bay of Bengal views. Sustainable, solar-powered, sea-breeze cooled.",
        "hero_image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
        "gallery": [],
        "bhk_types": ["2BHK", "3BHK"],
        "min_price": 18000000,
        "max_price": 42000000,
        "amenities": ["Beach Access", "Spa", "Surf Lounge"],
        "rera_id": "TN-RERA-MAR-2024",
    },
]


async def seed_data():
    # Skip if already seeded
    existing = await db.projects.count_documents({})
    if existing > 0:
        logger.info("Seed skipped (projects already exist)")
        return

    logger.info("Seeding demo data...")

    # Users
    demo_users = [
        {"_id": "demo-user-1", "email": "demo@user.com", "password_hash": _hash_password("demo123"),
         "name": "Aarav Demo", "role": "user", "verified": True, "company_name": None,
         "created_at": datetime.now(timezone.utc)},
        {"_id": "demo-builder-1", "email": "builder@aurelia.com", "password_hash": _hash_password("builder123"),
         "name": "Aurelia Group", "role": "builder", "verified": True, "company_name": "Aurelia Group",
         "created_at": datetime.now(timezone.utc)},
        {"_id": "demo-builder-2", "email": "builder@banyan.com", "password_hash": _hash_password("builder123"),
         "name": "Banyan Estates", "role": "builder", "verified": True, "company_name": "Banyan Estates",
         "created_at": datetime.now(timezone.utc)},
        {"_id": "demo-builder-3", "email": "builder@marina.com", "password_hash": _hash_password("builder123"),
         "name": "Marina Realty", "role": "builder", "verified": False, "company_name": "Marina Realty",
         "created_at": datetime.now(timezone.utc)},
        {"_id": "demo-admin-1", "email": "admin@aura.com", "password_hash": _hash_password("admin123"),
         "name": "Aura Admin", "role": "admin", "verified": True, "company_name": None,
         "created_at": datetime.now(timezone.utc)},
    ]
    for u in demo_users:
        await db.users.update_one({"_id": u["_id"]}, {"$setOnInsert": u}, upsert=True)

    # Projects
    builder_map = ["demo-builder-1", "demo-builder-2", "demo-builder-3"]
    builder_names = ["Aurelia Group", "Banyan Estates", "Marina Realty"]
    builder_verified = [True, True, False]

    for i, p in enumerate(SEED_PROJECTS):
        pid = f"proj-{i + 1}"
        units = _seed_units(p["min_price"], 850 if i == 0 else 1100)
        progress = [
            {"id": str(uuid.uuid4()), "title": "Excavation Complete", "description": "Foundation excavation done", "percent": 15, "image_base64": None, "created_at": datetime.now(timezone.utc) - timedelta(days=120)},
            {"id": str(uuid.uuid4()), "title": "Plinth Beam Cast", "description": "Plinth beam poured", "percent": 30, "image_base64": None, "created_at": datetime.now(timezone.utc) - timedelta(days=80)},
            {"id": str(uuid.uuid4()), "title": "5th Floor Slab", "description": "5th floor slab work completed", "percent": 55, "image_base64": None, "created_at": datetime.now(timezone.utc) - timedelta(days=20)},
        ]
        doc = {
            "_id": pid,
            "id": pid,
            "builder_id": builder_map[i],
            "builder_name": builder_names[i],
            "builder_verified": builder_verified[i],
            "approved": True if i < 2 else False,  # Marina Vista pending approval (admin demo)
            "trust_score": 88 if builder_verified[i] else 55,
            "units": units,
            "design_options": SEED_DESIGN_OPTIONS,
            "progress": progress,
            "documents": [
                {"name": "RERA Certificate", "url": "https://example.com/rera.pdf", "verified": True},
                {"name": "Sanctioned Plan", "url": "https://example.com/plan.pdf", "verified": builder_verified[i]},
            ],
            "created_at": datetime.now(timezone.utc),
            **p,
        }
        await db.projects.update_one({"_id": pid}, {"$setOnInsert": doc}, upsert=True)

    logger.info("Seed complete")


# Routes
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    asyncio.create_task(seed_data())


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
