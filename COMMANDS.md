# 🚀 Homeviz App - Command Reference (Copy & Paste)

## Quick Start - 2 Terminal Tabs

### Terminal 1: Backend (Port 8000)
```bash
cd /Users/apple/Desktop/Builder_app/Homeviz_app/backend
/Users/apple/Desktop/Builder_app/Homeviz_app/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend (Port 8081)
```bash
cd /Users/apple/Desktop/Builder_app/Homeviz_app/frontend
yarn start
```

Then press `w` in Terminal 2 for web browser, or scan QR for mobile.

---

## Shorter Paths (if in project root)

### Terminal 1: Backend
```bash
cd backend && ../.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend
```bash
cd frontend && yarn start
```

---

## Test URLs

| Service | URL |
|---------|-----|
| **Frontend Web** | http://localhost:8081 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |

---

## Demo Credentials (All use: demo123)
- Buyer: `demo@user.com`
- Builder: `demo@builder.com`
- Admin: `demo@admin.com`

---

## Fix Common Issues

### Port already in use?
```bash
# Kill port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill port 8081
lsof -i :8081 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Frontend dependencies broken?
```bash
cd frontend && rm -rf node_modules yarn.lock && yarn install
```

### Backend dependencies broken?
```bash
cd backend
source ../.venv/bin/activate
pip install -r requirements.txt
```

### Metro bundler won't start?
```bash
cd frontend && yarn start --clear
```

---

## View App on Different Devices

**In Terminal 2 (Frontend), press:**
- `w` = Web browser (http://localhost:8081)
- `i` = iOS simulator
- `a` = Android emulator
- `q` = Quit

**Or scan QR code** with Expo Go app on your phone (must be on same WiFi)

---

## Full Setup from Scratch (One Time)

```bash
# 1. Backend setup
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Frontend setup  
cd ../frontend
yarn install

# Done! Now use the Quick Start commands above
```

---

## Verify Everything Works

```bash
# Test backend is running
curl http://localhost:8000/api/

# Expected response:
# {"message":"Welcome to Homeviz API"}
```

---

## More Help
See `QUICKSTART.md` for complete troubleshooting guide.
