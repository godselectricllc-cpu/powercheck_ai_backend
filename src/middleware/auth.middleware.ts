import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import type { Role } from '@prisma/client';

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    req.user = {
      id: payload.userId,
      role: payload.role as Role,
    };

    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}
