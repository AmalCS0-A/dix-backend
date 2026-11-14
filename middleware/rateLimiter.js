import rateLimit from 'express-rate-limit';

const WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

// Same JSON error shape as the rest of the API, with status 429.
const handler = (message) => (req, res) =>
  res.status(429).json({ status: 429, message });

// General limit: 100 requests / 15 minutes / IP address, for the whole /api.
export const apiLimiter = rateLimit({
  windowMs: WINDOW,
  limit: 100,
  standardHeaders: 'draft-7', // sends RateLimit-* headers so clients can see the quota
  legacyHeaders: false,
  handler: handler('Too many requests, please try again in 15 minutes.'),
});

// Stricter limit for login: 5 attempts / 15 minutes / IP address (brute-force protection).
export const loginLimiter = rateLimit({
  windowMs: WINDOW,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('Too many login attempts, please try again in 15 minutes.'),
});
