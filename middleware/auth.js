import jwt from 'jsonwebtoken';
import { HttpError } from './errorHandler.js';

// OAuth2 side: ask Google if an access token is valid and was issued to OUR app.
// Returns the token info, or null if Google rejects it (or OAuth2 is not configured).
async function verifyGoogleToken(token) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`
    );
    if (!res.ok) return null;
    const info = await res.json();
    // The token must have been issued for our client id, not for another app.
    if (info.aud !== clientId && info.azp !== clientId) return null;
    return info;
  } catch {
    return null;
  }
}

// Middleware "protect": put it before a route to require authentication.
// Expected header:  Authorization: Bearer <token>
export default async function protect(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authentication required: send the header "Authorization: Bearer <token>"');
  }

  // 1) Is it a JWT created by our own /api/auth/login ?
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, provider: 'local' };
    return next();
  } catch {
    // not ours (or expired / tampered): try OAuth2 next
  }

  // 2) Is it an OAuth2 access token issued by Google?
  const info = await verifyGoogleToken(token);
  if (info) {
    req.user = { id: info.sub, email: info.email, provider: 'google' };
    return next();
  }

  throw new HttpError(401, 'Invalid or expired token');
}
