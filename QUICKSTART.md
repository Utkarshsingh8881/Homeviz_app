# 🚀 Homeviz App - Quick Start Guide

## Prerequisites
- **Node.js** v16+ (check with `node --version`)
- **Yarn** (check with `yarn --version`)
- **Python** 3.9+ (check with `python3 --version`)
- **Git** (for version control)

---

## ⚡ Quick Start (2 Terminals)

### Terminal 1: Run Backend API
```bash
cd backend
/Users/apple/Desktop/Builder_app/Homeviz_app/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Started server process [PID]
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ Backend is ready when you see: `Uvicorn running on http://0.0.0.0:8000`

---

### Terminal 2: Run Frontend App
```bash
cd frontend
yarn start
```

**Expected Output:**
```
Metro Bundler started on the following addresses:
exp://YOUR_IP:8081
http://localhost:8081
```

✅ Frontend is ready when you see the QR code and web address

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Buyer/User** | `demo@user.com` | `demo123` |
| **Builder** | `demo@builder.com` | `demo123` |
| **Admin** | `demo@admin.com` | `demo123` |

---

## 📱 How to View the App

After running both terminals, choose ONE option:

### Option 1: Web Browser (Easiest)
```bash
# In Terminal 2 frontend, press 'w'
w
```
Then open: `http://localhost:8081`

### Option 2: iOS Simulator
```bash
# In Terminal 2 frontend, press 'i'
i
```

### Option 3: Android Emulator
```bash
# In Terminal 2 frontend, press 'a'
a
```

### Option 4: Physical Phone with Expo Go
1. Download **Expo Go** app on your phone
2. In Terminal 2 frontend, press 'w' to get the QR code
3. Scan QR code with your phone camera
4. Opens in Expo Go app

---

## 🛠️ Setup from Scratch

### 1️⃣ Install Backend Dependencies
```bash
cd backend
python3 -m venv .venv                    # Create virtual environment (one time only)
source .venv/bin/activate               # Activate virtual environment
pip install -r requirements.txt          # Install Python packages
```

### 2️⃣ Setup Backend Environment
```bash
cd backend
# Create .env file with this content:
cat > .env << 'EOF'
MONGO_URL=mongodb+srv://aura_user:9839Utkarsh@cluster0.o4aw8x6.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority
DB_NAME=aura_proptech
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
EMERGENT_LLM_KEY=your-emergent-lllm-key-here
STRIPE_SECRET_KEY=sk_test_51...
EOF
```

### 3️⃣ Install Frontend Dependencies
```bash
cd frontend
yarn install                             # Install all Node packages
```

### 4️⃣ Setup Frontend Environment
```bash
cd frontend
# Create .env file with this content:
cat > .env << 'EOF'
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
EOF
```

---

## 🐛 Troubleshooting

### Backend Issues

#### ❌ Error: "ModuleNotFoundError: No module named 'fastapi'"
**Solution:**
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

#### ❌ Error: "Connection refused" to MongoDB
**Solution:**
1. Check `.env` file has correct MongoDB connection string
2. Verify MongoDB Atlas cluster is active
3. Check network access allows your IP

#### ❌ Error: "Port 8000 already in use"
**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process (replace PID with actual number)
kill -9 <PID>

# Or use a different port:
uvicorn server:app --host 0.0.0.0 --port 8001
```

#### ❌ Backend starts but exits silently
**Solution:**
```bash
# Run with explicit output
python -u server.py 2>&1
```

#### ❌ "emergentintegrations" import error
**This is expected** - package is commented out in requirements.txt
- App will work fine without it
- If you need AI features, contact support for the package

---

### Frontend Issues

#### ❌ Error: "Cannot find module 'react-native'"
**Solution:**
```bash
cd frontend
rm -rf node_modules
rm yarn.lock
yarn install
```

#### ❌ Error: "Metro Bundler won't start"
**Solution:**
```bash
# Clear cache and restart
cd frontend
yarn start --clear
```

#### ❌ Error: "Port 8081 already in use"
**Solution:**
```bash
# Find and kill process
lsof -i :8081
kill -9 <PID>

# Or use different port
yarn start --port 8082
```

#### ❌ QR Code not scanning
**Solution:**
1. Make sure phone and computer are on **same WiFi network**
2. Use web option instead: press `w` in Metro terminal
3. Or scan with Expo Go app by tapping "Scan QR code"

---

## ✅ Verify Everything is Working

### Test Backend API
```bash
# In a new terminal, run:
curl http://localhost:8000/api/

# Should return: {"message":"Welcome to Homeviz API"}
```

### Test Frontend Loads
Open browser: `http://localhost:8081`
- Should see login screen
- Try logging in with demo credentials above

### Test Login Flow
1. Enter: `demo@user.com`
2. Enter: `demo123`
3. Should redirect to **Discover** page (user dashboard)

---

## 📊 App Architecture

### Backend (Port 8000)
- **Framework:** FastAPI
- **Database:** MongoDB Atlas
- **Authentication:** JWT
- **API Docs:** http://localhost:8000/docs

### Frontend (Port 8081)
- **Framework:** Expo / React Native
- **Language:** TypeScript
- **Routing:** Expo Router (file-based)
- **State:** React Hooks

---

## 🔍 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/builder/my-projects` | Builder's projects |
| GET | `/api/admin/stats` | Admin analytics |

**Full API docs:** http://localhost:8000/docs (when backend is running)

---

## 💾 Database Info

**MongoDB Atlas Connection:**
```
Cluster: cluster0
Database: aura_proptech
Connection: mongodb+srv://aura_user:***@cluster0.o4aw8x6.mongodb.net/
```

Collections:
- `users` - All user accounts
- `projects` - Building projects
- `bookings` - User bookings
- `payments` - Payment records

---

## 🚦 Common Workflows

### I want to start development
```bash
# Terminal 1: Backend
cd backend && /Users/apple/Desktop/Builder_app/Homeviz_app/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend && yarn start

# Terminal 2 in Metro: Press 'w' for web browser
```

### I want to test on my phone
```bash
# Terminal 1: Backend
cd backend && /Users/apple/Desktop/Builder_app/Homeviz_app/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend && yarn start

# Terminal 2 in Metro: Scan QR code with Expo Go app
```

### I want to modify backend code
```bash
# Edit files in backend/
# Backend auto-reloads (--reload flag)
# Check http://localhost:8000/docs for API changes
```

### I want to modify frontend code
```bash
# Edit files in frontend/
# Frontend auto-reloads
# Refresh browser or app to see changes
```

---

## 🔐 Environment Variables

### Backend (.env)
| Variable | Purpose | Default |
|----------|---------|---------|
| `MONGO_URL` | MongoDB connection string | Required |
| `DB_NAME` | Database name | `aura_proptech` |
| `JWT_SECRET_KEY` | Secret for JWT tokens | Change in production |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry time | `10080` (7 days) |

### Frontend (.env)
| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_BACKEND_URL` | Backend API URL |

---

## 📞 Need Help?

Check logs in these files:
- **Backend logs:** Terminal output (stdout/stderr)
- **Frontend logs:** Terminal output or press 'j' in Metro for device logs
- **MongoDB logs:** MongoDB Atlas dashboard

---

## 🎯 Next Steps

1. ✅ Run backend and frontend using commands above
2. ✅ Open http://localhost:8081 in browser
3. ✅ Login with demo@user.com / demo123
4. ✅ Explore the app!
5. 📝 Read code in `backend/server.py` and `frontend/app/`
6. 🔧 Make your first code change and watch it reload

---

**Happy coding! 🚀**
