import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

type TokenPayload = { sub: string; companyId: string; role: 'admin' | 'user' };

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.header('authorization');

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autenticação necessária' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as TokenPayload;

    if (!payload.sub || !payload.companyId || !['admin', 'user'].includes(payload.role)) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    req.auth = { userId: payload.sub, companyId: payload.companyId, role: payload.role };

    next();
  } catch {

    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.auth?.role !== 'admin') {
    res.status(403).json({ error: 'Permissão de administrador necessária' });
    return;
  }

  next();
};
