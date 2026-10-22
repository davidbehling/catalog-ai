import { Router } from 'express';
import { z } from 'zod';
import { Participant } from '../models/Participant.js';
import { requireAuth } from '../middleware/auth.js';
import {
  buildSessionUser,
  InvalidCredentialsError,
  login as loginUser,
  signToken
} from '../services/auth.js';
import { createCompany, createParticipant, createUser, EmailAlreadyInUseError } from '../services/users.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().trim().min(2).max(100)
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const company = await createCompany(input.companyName);
    const user = await createUser({ name: input.name, email: input.email, password: input.password });

    await createParticipant({
      userId: String(user._id),
      companyId: String(company._id),
      role: 'admin',
      status: 'activated'
    });

    const sessionUser = await buildSessionUser(String(user._id), String(company._id), 'admin');
    const token = signToken({ id: sessionUser.id, companyId: sessionUser.companyId, role: 'admin' });

    res.status(201).json({ token, user: sessionUser });
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
    const result = await loginUser(input.email, input.password);

    res.json(result);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: error.message });
      return;
    }

    next(error);
  }
});

/** Empresas do usuário autenticado, com o papel e a situação em cada uma. */
authRouter.get('/companies', requireAuth, async (req, res, next) => {
  try {
    const sessionUser = await buildSessionUser(req.auth!.userId, req.auth!.companyId || null, req.auth!.role);

    res.json({
      companies: sessionUser.memberships,
      activeCompanyId: sessionUser.companyId,
      role: sessionUser.role
    });
  } catch (error) {
    next(error);
  }
});

/** Alterna a empresa ativa e devolve um novo token com o papel da nova empresa. */
authRouter.post('/switch-company', requireAuth, async (req, res, next) => {
  try {
    const { companyId } = z.object({ companyId: z.string().min(1) }).parse(req.body);

    const participant = await Participant.findOne({
      user_id: req.auth!.userId,
      company_id: companyId,
      status: { $in: ['activated', 'pending'] }
    }).lean();

    if (!participant) {
      res.status(404).json({ error: 'Você não participa desta empresa' });
      return;
    }

    const sessionUser = await buildSessionUser(req.auth!.userId, companyId, participant.role);
    const token = signToken({ id: sessionUser.id, companyId, role: participant.role });

    res.json({ token, user: sessionUser });
  } catch (error) {
    next(error);
  }
});

/** Cria uma empresa para o usuário autenticado, que passa a administrá-la. */
authRouter.post('/companies', requireAuth, async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().trim().min(2).max(100) }).parse(req.body);

    const company = await createCompany(name);

    await createParticipant({
      userId: req.auth!.userId,
      companyId: String(company._id),
      role: 'admin',
      status: 'activated'
    });

    const sessionUser = await buildSessionUser(req.auth!.userId, String(company._id), 'admin');
    const token = signToken({ id: sessionUser.id, companyId: sessionUser.companyId, role: 'admin' });

    res.status(201).json({ token, user: sessionUser });
  } catch (error) {
    next(error);
  }
});

/** Dados do usuário autenticado, incluindo as empresas às quais pertence. */
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const sessionUser = await buildSessionUser(req.auth!.userId, req.auth!.companyId || null, req.auth!.role);

    res.json({ user: sessionUser });
  } catch (error) {
    next(error);
  }
});
