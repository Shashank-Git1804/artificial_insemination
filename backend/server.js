import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import compression from 'compression';
import authRoutes        from './routes/auth.js';
import animalRoutes      from './routes/animals.js';
import predictionRoutes  from './routes/predictions.js';
import appointmentRoutes from './routes/appointments.js';
import dashboardRoutes   from './routes/dashboard.js';
import reportRoutes      from './routes/reports.js';

dotenv.config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(compression());                          // gzip all responses
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    // Allow Netlify preview deploy URLs (hash--sitename.netlify.app)
    if (!origin || allowed.includes(origin) || /\.netlify\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));         // limit JSON body size
app.use('/uploads', express.static('uploads', { maxAge: '1d' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/animals',      animalRoutes);
app.use('/api/predictions',  predictionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/reports',      reportRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'OK', project: 'Jeeva - Karnataka Govt AI Livestock' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── MongoDB + start ───────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize:       10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS:   45000,
})
.then(() => {
  console.log('MongoDB Atlas connected');
  app.listen(process.env.PORT || 5000, () =>
    console.log(`Pashimitra server on port ${process.env.PORT || 5000}`)
  );
})
.catch(err => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
});
