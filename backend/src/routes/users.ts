import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth, requireCompany } from '../middleware/auth.js';
import { Company } from '../models/Company.js';
import { Participant } from '../models/Participant.js';
import { User } from '../models/User.js';
import { createNotification } from '../services/notifications.js';
import {
  createParticipant,
  createUser,
  DuplicateParticipantError,
  EmailAlreadyInUseError,
  listCompanyMembers,
  setParticipantStatus
} from '../services/users.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

async function getCompanyName(companyId: string): Promise<string> {
  const company = await Company.findById(companyId).select('name').lean();
  return company?.name ?? '';
}

const inviteSchema = z.object({
  email: z.string().email(),
  // Ausentes quando o e-mail já pertence a um usuário existente.
  name: z.string().trim().min(2).max(80).optional(),
  password: z.string().min(8).max(128).optional()
});

const statusSchema = z.object({
  status: z.enum(['pending', 'activated', 'suspended'])
});

/** Verifica se o e-mail já está cadastrado, para decidir o formulário do convite. */
usersRouter.get('/check-email', requireCompany, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.query);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).lean();

    res.json({ registered: Boolean(user), name: user?.name ?? null });
  } catch (error) {
    next(error);
  }
});

/** Lista os participantes da empresa com situação e ações disponíveis. */
usersRouter.get('/', requireCompany, requireAdmin, async (req, res, next) => {
  try {
    const members = await listCompanyMembers(req.auth!.companyId);

    res.json({ users: members });
  } catch (error) {
    next(error);
  }
});

/**
 * Convida um usuário para a empresa.
 *
 * Se o e-mail ainda não existir, cria o usuário e o participante com situação
 * pendente. Se já existir, apenas vincula o participante, também pendente.
 */
usersRouter.post('/invite', requireCompany, requireAdmin, async (req, res, next) => {
  try {
    const input = inviteSchema.parse(req.body);
    const normalizedEmail = input.email.toLowerCase().trim();
    const companyId = req.auth!.companyId;

    const inviter = await User.findById(req.auth!.userId).lean();

    if (!inviter) {
      res.status(404).json({ error: 'Usuário autenticado não encontrado' });
      return;
    }

    const companyName = await getCompanyName(companyId);

    let user = await User.findOne({ email: normalizedEmail }).lean();
    let created = false;

    if (!user) {
      if (!input.name || !input.password) {
        res.status(400).json({ error: 'Nome e senha provisória são obrigatórios para novos usuários' });
        return;
      }

      const newUser = await createUser({
        name: input.name,
        email: normalizedEmail,
        password: input.password
      });

      user = newUser.toObject();
      created = true;
    }

    const existingParticipant = await Participant.findOne({
      user_id: user._id,
      company_id: companyId
    }).lean();

    if (existingParticipant) {
      res.status(409).json({ error: 'Este usuário já participa desta empresa' });
      return;
    }

    await createParticipant({
      userId: String(user._id),
      companyId,
      role: 'user',
      status: 'pending'
    });

    await createNotification({
      userId: String(user._id),
      companyId,
      title: 'Convite',
      message: `O usuário ${inviter.name} o convidou para participar da empresa ${companyName}`.trim()
    });

    res.status(201).json({
      user: { id: String(user._id), name: user.name, email: user.email },
      created
    });
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      res.status(409).json({ error: error.message });
      return;
    }

    if (error instanceof DuplicateParticipantError) {
      res.status(409).json({ error: error.message });
      return;
    }

    next(error);
  }
});

/** Suspende ou reconvida um participante. */
usersRouter.patch('/:participantId/status', requireCompany, requireAdmin, async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const participantId = req.params.participantId;

    const participant = await Participant.findOne({
      _id: participantId,
      company_id: req.auth!.companyId
    }).lean();

    if (!participant) {
      res.status(404).json({ error: 'Participante não encontrado' });
      return;
    }

    if (String(participant.user_id) === req.auth!.userId) {
      res.status(400).json({ error: 'Não é possível alterar a própria situação' });
      return;
    }

    await setParticipantStatus(participantId, status);

    // Reconvidar é equivalente a um novo convite: o participante volta a pendente
    // e recebe uma notificação para aceitar a participação.
    if (status === 'pending') {
      const inviter = await User.findById(req.auth!.userId).lean();
      const invited = await User.findById(participant.user_id).lean();

      if (inviter && invited) {
        await createNotification({
          userId: String(invited._id),
          companyId: req.auth!.companyId,
          title: 'Convite',
          message: `O usuário ${inviter.name} o convidou novamente para participar da empresa ${await getCompanyName(req.auth!.companyId)}`.trim()
        });
      }
    }

    res.json({ participant: { id: participantId, status } });
  } catch (error) {
    next(error);
  }
});
