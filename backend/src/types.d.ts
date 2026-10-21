import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; companyId: string; role: 'admin' | 'user' };
    }
  }
}

export {};
