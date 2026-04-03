# 🌱 Jeeva — Backend
### Node.js + Express | Karnataka Govt AI Livestock Portal

---

## Stack
- Node.js + Express 5.2
- MongoDB + Mongoose 9.3
- JWT Authentication (phone or email login)
- Multer (image upload, 15MB limit with client-side pre-compression)
- Compression (gzip)
- node-fetch + form-data (Python AI service proxy)

---

## Setup
```bash
npm install
```

Create `.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/jeeva
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=30d
FRONTEND_URL=https://your-netlify-url.netlify.app
AI_SERVICE_URL=https://your-ai-service.onrender.com
```

```bash
npm run dev     # development (node --watch)
npm start       # production
npm run seed    # seed demo accounts
```

---

## API Routes

### Auth — `/api/auth`
```
POST /register       # phone + email registration
POST /login          # phone number OR email login
GET  /me             # current user
```

### Animals — `/api/animals`
```
GET    /             # list farmer's animals
POST   /             # add animal
PUT    /:id          # update
DELETE /:id          # delete
```

### Predictions — `/api/predictions`
```
POST /heat           # heat detection (stage: csv|photo|combined)
POST /infection      # infection check (stage: csv|photo|combined)
GET  /               # list (paginated, filterable)
GET  /animal/:id     # by animal
GET  /cycle/:species # reproductive cycle info
```

### Appointments — `/api/appointments`
```
GET  /               # list
POST /               # book
PUT  /:id/status     # update status
DELETE /:id          # cancel
```

### Reports — `/api/reports`
```
GET  /               # list
POST /               # generate (AI Centre only)
GET  /:id            # single report
GET  /appointment/:id
```

### Dashboard — `/api/dashboard`
```
GET  /               # role-based summary stats
```

---

## AI Service Integration
The backend proxies requests to the Python FastAPI service at `AI_SERVICE_URL`.
Falls back to a JS-based engine if the Python service is unavailable.

---

## Deploy to Render
1. Root directory: `backend`
2. Build: `npm install`
3. Start: `npm start`
4. Set all environment variables in Render dashboard
