# 🐄 Jeeva — ಜೀವ
### Karnataka Govt AI Decision Support for Doorstep Artificial Insemination
> **Jeeva** means *Life* in Kannada — empowering livestock farmers with AI

**Project Ref:** 49S_BE_4806 | AMC Engineering College, ISE Dept

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2 + Vite 8 |
| Backend | Node.js + Express 5.2 |
| Database | MongoDB Atlas + Mongoose 9.3 |
| Auth | JWT (phone number or email login) |
| AI Engine | Python FastAPI + Scikit-learn + MobileNetV2 |
| Image Validation | OpenCV + ONNX Runtime |

---

## Project Structure
```
jeeva/
├── frontend/          # React + Vite (deploy to Netlify)
├── backend/           # Node.js + Express (deploy to Render)
│   ├── ai_service/    # Python FastAPI AI microservice (deploy to Render)
│   ├── models/        # Mongoose schemas
│   ├── routes/        # REST API routes
│   └── middleware/    # JWT auth
├── render.yaml        # Render deployment config
└── README.md
```

---

## Local Setup

### 1. Backend (Node.js)
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET
npm run dev            # http://localhost:5000
```

### 2. AI Service (Python)
```bash
cd backend/ai_service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 3. Frontend (React)
```bash
cd frontend
npm install
# create .env with: VITE_API_URL=http://localhost:5000/api
npm run dev            # http://localhost:5173
```

---

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/jeeva
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=30d
FRONTEND_URL=https://your-netlify-url.netlify.app
AI_SERVICE_URL=https://your-ai-service.onrender.com
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## Demo Accounts
| Role | Login | Password |
|------|-------|----------|
| 👨🌾 Farmer | farmer@test.com or 9876543210 | test1234 |
| 🏥 AI Centre | centre@test.com or 9876543211 | test1234 |

> Login supports both **phone number** and **email**

---

## Features

### 👨🌾 Farmer
- Register & manage livestock (cow, buffalo, goat, sheep, pig)
- **3-Stage Heat Detection** — CSV observations → Photo analysis → Combined
- **3-Stage Health Check** — CSV symptoms → Photo analysis → Combined
- Detailed factor report with numbered scores for each indicator
- Book AI insemination appointments
- Milk tracker, vaccination records, animal history

### 🏥 AI Centre
- Dashboard with heat & infection alerts (paginated, auto-refresh)
- Manage appointments, generate official govt reports
- PDF report download with prescription

### 🤖 AI Engine
- **Heat Detection:** 4 CSV factors + 4 photo factors = 8 numbered indicators
- **Infection Detection:** 7 symptom factors + 3 photo factors = 10 numbered indicators
- **Photo Validation (5 rules):**
  1. Species must match selected animal
  2. Reproductive area must be visible
  3. Blurry photos rejected — farmer asked to retake
  4. Non-animal photos rejected (humans, cartoons, objects)
  5. Full image preview shown in UI

---

## API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login          # phone number OR email
GET    /api/auth/me

GET    /api/animals
POST   /api/animals
PUT    /api/animals/:id
DELETE /api/animals/:id

POST   /api/predictions/heat    # stage: csv | photo | combined
POST   /api/predictions/infection
GET    /api/predictions
GET    /api/predictions/animal/:animalId

GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id/status

GET    /api/reports
POST   /api/reports
GET    /api/reports/:id

GET    /api/dashboard
```

---

## Deployment
- **Frontend** → [Netlify](https://netlify.com) — set `VITE_API_URL`
- **Backend** → [Render](https://render.com) — set all env vars
- **AI Service** → [Render](https://render.com) — Python runtime
- **Database** → [MongoDB Atlas](https://cloud.mongodb.com) — already configured

See `render.yaml` for Render deployment config.

---

*Developed by: Shakthishree T R, Venika, Sandhya U Solanki, Shashank P*
*Guide: Mr. Vishal K | AMC Engineering College, Bengaluru*
