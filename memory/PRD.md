# Aura Proptech — PRD

## Vision
A builder-to-buyer AI real estate platform that lets buyers customize rooms or flats, see AI previews + live pricing, and complete token bookings, while giving builders project/lead management and admins full marketplace governance.

## MVP scope (this build)
**3 dashboards, single Expo app, role-based routing.**

### Buyer (role: user)
- Browse approved projects (city + BHK filters).
- Project detail: overview, units, construction progress, trust/documents.
- AI Studio: room type chips (living/bedroom/kitchen), design option chips (wall / flooring / kitchen / lighting / furniture / finish), AI image render via **Gemini Nano Banana**, live price recompute as options change.
- Booking: creates booking → Stripe test-mode PaymentIntent → mock-confirm marks unit booked.
- Bookings list + Profile.

### Builder (role: builder)
- My projects (with status badges).
- Create project (name, city, locality, prices, hero image, units auto-generated).
- Leads (all bookings against builder's projects, conversion stats).
- Progress (per-project timeline; modal to post new milestone with %).
- Profile.

### Admin (role: admin)
- Verify builders (toggle verified, propagates to projects + bumps trust score).
- Approve project listings (Pending vs All tabs).
- Analytics (token revenue, user/builder/project counts, verification & conversion rates).
- Profile.

## Tech stack
- **Frontend**: Expo SDK 54, expo-router (file-based), expo-image, expo-blur, expo-linear-gradient, axios, AsyncStorage.
- **Backend**: FastAPI + Motor (MongoDB), JWT auth (HS256, bcrypt), Stripe SDK, emergentintegrations (Gemini Nano Banana via Emergent LLM key).
- **DB**: MongoDB — collections: `users`, `projects`, `bookings`, `renders`.

## Key endpoints
- `POST /api/auth/signup` `/api/auth/login` `GET /api/auth/me`
- `GET /api/projects?city&bhk&min_price&max_price`
- `GET /api/projects/{id}` · `POST /api/projects` (builder) · `POST /api/projects/{id}/progress`
- `GET /api/builder/my-projects` · `GET /api/builder/leads`
- `POST /api/pricing/estimate`
- `POST /api/ai/customize-room` (Nano Banana)
- `POST /api/bookings` · `POST /api/payments/create-intent` · `POST /api/payments/mock-confirm`
- `GET /api/admin/builders` `POST /api/admin/builders/{id}/verify`
- `GET /api/admin/projects` `POST /api/admin/projects/{id}/approve`
- `GET /api/admin/stats`

## Design language
Editorial / luxe — deep Midnight Teal (`#0A2528`) on white, Playfair Display headers, full-bleed hero images with bottom gradient scrim, frosted glass over images, premium real-estate aesthetic.

## Integrations
- **Gemini Nano Banana** (`gemini-3.1-flash-image-preview`) via Emergent LLM key — image generation for AI Studio.
- **Stripe** (test mode) — PaymentIntent. MVP confirms via server-side `mock-confirm` (real Stripe PaymentSheet needs a dev build, not Expo Go).

## Demo accounts
See `/app/memory/test_credentials.md`.

## Future (not in MVP)
- Real Stripe PaymentSheet (dev build).
- Phone OTP + Google OAuth.
- Document upload + RERA scraping.
- Multi-tower / multi-tenant project modeling.
- Builder chat / lead inbox.
- Push notifications (only on user request).
