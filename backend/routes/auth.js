import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const safeUser = (u) => ({
  id: u._id, name: u.name, email: u.email, phone: u.phone,
  role: u.role, district: u.district, centreName: u.centreName,
});

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    // Normalise phone — strip spaces/dashes, ensure 10 digits
    if (req.body.phone)
      req.body.phone = req.body.phone.replace(/[\s\-]/g, '').replace(/^(\+91|91)/, '');

    const user  = await User.create(req.body);
    const token = signToken(user._id);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `${field === 'phone' ? 'Phone number' : 'Email'} already registered` });
    }
    res.status(400).json({ message: err.message });
  }
});

// ── Login — accepts email OR 10-digit phone number ────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;   // identifier = email or phone
    if (!identifier || !password)
      return res.status(400).json({ message: 'Phone/email and password are required' });

    const clean = identifier.trim().replace(/[\s\-]/g, '').replace(/^(\+91|91)/, '');

    // Detect if it looks like a phone number (10 digits) or email
    const isPhone = /^\d{10}$/.test(clean);
    const query   = isPhone
      ? { phone: clean }
      : { email: clean.toLowerCase() };

    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user._id), user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

router.get('/me', protect, (req, res) => res.json(req.user));

export default router;
