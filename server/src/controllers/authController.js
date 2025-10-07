import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

function signJwt(payload) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function signup(req, res) {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const token = signJwt({ userId: user._id });
  setAuthCookie(res, token);
  return res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email },
  });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = signJwt({ userId: user._id });
  setAuthCookie(res, token);
  return res.json({ user: { id: user._id, name: user.name, email: user.email } });
}

export async function logout(req, res) {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
}

export async function me(req, res) {
  // expects auth middleware to set req.user
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user = await User.findById(req.user.userId).select('name email');
  return res.json({ user: { id: user._id, name: user.name, email: user.email } });
}
