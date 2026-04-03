# 🐄 Pashimitra — ಪಶುಮಿತ್ರ
### Karnataka Govt AI Decision Support for Doorstep Artificial Insemination

**Project Ref:** 49S_BE_4806 | AMC Engineering College, ISE Dept

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2 + Vite 8 |
| Backend | Node.js + Express 5.2 |
| Database | MongoDB + Mongoose 9.3 |
| Auth | JWT (jsonwebtoken) |
| AI Engine | Logistic Regression (pure JS) |

---

## Prerequisites
- Node.js v24+ LTS
- MongoDB running locally on port 27017

---

## Setup & Run

### 1. Start MongoDB
```bash
mongod
```

### 2. Backend
```bash
cd backend
npm install
npm run seed        # Creates demo accounts
npm run dev         # Starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev         # Starts on http://localhost:5173
```

---

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| 👨🌾 Farmer | farmer@test.com | test1234 |
| 🏥 AI Centre | centre@test.com | test1234 |

---

## Features

### Farmer Role
- Register & manage livestock (cow, buffalo, goat, sheep, pig)
- AI-powered **heat (estrus) detection** using behavioral inputs
- AI-powered **infection/disease screening** using symptom inputs
- Book AI insemination appointments
- View prediction history & alerts

### AI Centre Role
- Dashboard with heat alerts from all farmers
- Manage & update appointment status
- View farmer contact details & animal info
- Mark services as completed with outcome notes

### AI Engine
- **Heat Detection:** Uses activity spike, restlessness, mounting events, vision model score
- **Infection Detection:** Uses 7 clinical symptom indicators
- Species-specific logistic regression models (cow, buffalo, goat, sheep, pig)
- Trained on `multi_livestock_heat_data.csv` & `multi_livestock_infection_data.csv`

---

## API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/animals
POST   /api/animals
PUT    /api/animals/:id
DELETE /api/animals/:id

POST   /api/predictions/heat
POST   /api/predictions/infection
GET    /api/predictions
GET    /api/predictions/animal/:animalId

GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id/status
DELETE /api/appointments/:id

GET    /api/dashboard
```

---

*Developed by: Shakthishree T R, Venika, Sandhya U Solanki, Shashank P*
*Guide: Mr. Vishal K | AMC Engineering College*
