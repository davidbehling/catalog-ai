import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export const authRouter = Router();

const registerSchema = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(8), companyName: z.string().min(2).max(100) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function signToken(user: { id: string; companyId: string; role: 'admin' | 'user' }) {
  return jwt.sign({ companyId: user.companyId, role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase();
    const slug = `${input.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 7)}`;
    const company = await Company.create({ name: input.companyName, slug });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({ name: input.name, email, passwordHash, role: 'admin', companyId: company._id });

    res.status(201).json({ token: signToken({ id: user.id, companyId: company.id, role: 'admin' }), user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: company.id, companyName: company.name } });
  } catch (error) {
    next(error); 
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      res.status(401).json({ error: 'E-mail ou senha inválidos' });
      return;
    }

    res.json({ token: signToken({ id: user.id, companyId: String(user.companyId), role: user.role }), user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: String(user.companyId) } });
  } catch (error) {
    next(error); 
  }
});
