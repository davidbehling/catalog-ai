import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireCompany } from '../middleware/auth.js';
import { answerProductQuestion } from '../services/chat.js';

export const chatRouter = Router();

chatRouter.use(requireAuth);
chatRouter.use(requireCompany);

chatRouter.post('/', async (req, res, next) => {
  try {
    const { message } = z.object({ message: z.string().trim().min(1).max(2000) }).parse(req.body);
    const answer = await answerProductQuestion(req.auth!.companyId, message);

    res.json({ answer });
  } catch (error) { 
    next(error); 
  }
});
