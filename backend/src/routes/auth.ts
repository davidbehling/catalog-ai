import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { createUser, EmailAlreadyInUseError, toPublicUser } from '../services/users.js';

export const authRouter = Router();

const registerSchema = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(8), companyName: z.string().min(2).max(100) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function signToken(user: { id: string; companyId: string; role: 'admin' | 'user' }) {
  return jwt.sign({ companyId: user.companyId, role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const slug = `${input.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 7)}`;
    const company = await Company.create({ name: input.companyName, slug });
    const user = await createUser({ name: input.name, email: input.email, password: input.password, role: 'admin', companyId: company.id });

    res.status(201).json({ token: signToken({ id: user.id, companyId: company.id, role: 'admin' }), user: { ...toPublicUser(user), companyName: company.name } });
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      res.status(409).json({ error: error.message });
      return;
    }

    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const email = input.email.toLowerCase();

    // Bancos seedados antes da unicidade global podem ter o mesmo e-mail em
    // mais de uma empresa. Buscar todos os candidatos e validar a senha contra
    // cada um evita autenticar no tenant errado.
    const candidates = await User.find({ email }).select('+passwordHash');
    let user: (typeof candidates)[number] | null = null;

    for (const candidate of candidates) {
      if (await bcrypt.compare(input.password, candidate.passwordHash)) {
        user = candidate;
        break;
      }
    }

    if (!user) {
      res.status(401).json({ error: 'E-mail ou senha inválidos' });
      return;
    }

    const company = await Company.findById(user.companyId).select('name').lean();

    res.json({ token: signToken({ id: user.id, companyId: String(user.companyId), role: user.role }), user: { ...toPublicUser(user), companyName: company?.name } });
  } catch (error) {
    next(error);
  }
});
