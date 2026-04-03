# 🌱 Jeeva — Frontend
### React + Vite | Karnataka Govt AI Livestock Portal

---

## Stack
- React 19.2
- Vite 8
- React Router DOM 7
- Axios
- Recharts (analytics)
- jsPDF (report download)
- react-hot-toast

---

## Setup
```bash
npm install
```

Create `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
```

---

## Pages

### Farmer
| Page | Description |
|------|-------------|
| Dashboard | Animal summary, recent predictions |
| Animals | Add/edit livestock |
| Heat Detection | 3-stage AI heat detection with factor report |
| Health Check | 3-stage AI infection screening with factor report |
| Appointments | Book & track AI insemination |
| Milk Tracker | Daily milk production log |
| Vaccination | Vaccination records |
| Animal History | Full prediction & health history |
| Analytics | Charts & trends |

### AI Centre
| Page | Description |
|------|-------------|
| Dashboard | Alerts summary |
| Appointments | Manage farmer appointments |
| Alerts | Paginated heat & infection alerts |
| Reports | Generate & download official govt PDF reports |
| Analytics | Centre-level analytics |

---

## Key Components
- `ImageCapture` — camera + gallery upload with client-side compression (max 1200px, JPEG 0.75)
- `Layout` — sidebar navigation with role-based menu
- `AuthContext` — JWT auth with phone/email login
- `LanguageContext` — Kannada / Hindi / English support

---

## Deploy to Netlify
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
4. `public/_redirects` handles SPA routing automatically
