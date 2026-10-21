import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { createUser, EmailAlreadyInUseError, toPublicUser } from '../services/users.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

usersRouter.get('/', requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find({ companyId: req.auth!.companyId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ users: users.map(toPublicUser) });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const input = createUserSchema.parse(req.body);

    const user = await createUser({
      name: input.name,
      email: input.email,
      password: input.password,
      role: 'user',
      companyId: req.auth!.companyId
    });

    res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      res.status(409).json({ error: error.message });
      return;
    }

    next(error);
  }
});
