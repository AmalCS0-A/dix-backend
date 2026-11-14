import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isText = (v) => typeof v === 'string' && v.trim() !== '';

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = req.body ?? {};

  // 1. validate the required fields (typeof check also blocks NoSQL injection like {"$ne": null})
  const errors = [];
  if (!isText(name)) errors.push('name is required');
  if (!isText(email) || !EMAIL_REGEX.test(email.trim())) errors.push('a valid email is required');
  if (typeof password !== 'string' || password.length < 6)
    errors.push('password is required (minimum 6 characters)');
  if (errors.length) throw new HttpError(400, 'Validation failed', errors);

  // 2. refuse a second account with the same email
  const cleanEmail = email.trim().toLowerCase();
  if (await User.findOne({ email: cleanEmail })) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  // 3. hash the password (10 = cost factor: how slow/expensive the hashing is) and store the user
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), email: cleanEmail, passwordHash });

  res.status(201).json({ message: 'User registered successfully', user });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!isText(email) || typeof password !== 'string' || password === '') {
    throw new HttpError(400, 'email and password are required');
  }

  // passwordHash is hidden by default (select:false), so we ask for it explicitly here
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  // Same message for "unknown email" and "wrong password": do not tell attackers which one failed
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

  res.status(200).json({ message: 'Login successful', token, user });
}
