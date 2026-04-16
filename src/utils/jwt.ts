import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret';

export interface JwtPayload {
  userId: string;
  role: 'ADMIN' | 'TECHNICIAN';
  type: 'access' | 'refresh';
}

export function signAccessToken(userId: string, role: 'ADMIN' | 'TECHNICIAN') {
  const payload: JwtPayload = { userId, role, type: 'access' };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function signRefreshToken(userId: string, role: 'ADMIN' | 'TECHNICIAN') {
  const payload: JwtPayload = { userId, role, type: 'refresh' };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
