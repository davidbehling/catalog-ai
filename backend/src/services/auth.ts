import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Participant } from '../models/Participant.js';
import { User } from '../models/User.js';
import { formatTimestamp } from '../utils/datetime.js';
import { activatePendingParticipants, listMemberships, type Membership } from './participants.js';

export type TokenPayload = { sub: string; companyId: string; role: 'admin' | 'user' };

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  companyId: string;
  companyName?: string;
  firstLogin: string | null;
  currentLogin: string | null;
  memberships: Membership[];
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super('E-mail ou senha inválidos');
    this.name = 'InvalidCredentialsError';
  }
}

export function signToken(user: { id: string; companyId: string; role: 'admin' | 'user' }) {
  return jwt.sign(
    { companyId: user.companyId, role: user.role },
    env.JWT_SECRET,
    { subject: user.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

export async function buildSessionUser(
  userId: string,
  activeCompanyId: string | null,
  role: 'admin' | 'user'
): Promise<SessionUser> {
  const user = await User.findById(userId).lean();

  if (!user) throw new InvalidCredentialsError();

  const memberships = await listMemberships(userId);
  const active = memberships.find((membership) => membership.companyId === activeCompanyId);

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role,
    companyId: activeCompanyId ?? '',
    companyName: active?.companyName,
    firstLogin: user.first_login ?? null,
    currentLogin: user.current_login ?? null,
    memberships
  };
}

/**
 * Autentica o usuário, registra os acessos e ativa participações pendentes.
 *
 * `current_login` é atualizado em todo login; `first_login` apenas no primeiro.
 * Quando `first_login` ainda não existia, o usuário é considerado recém-chegado e
 * todas as participações pendentes são ativadas.
 */
export async function login(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Bancos seedados antes da unicidade global podem ter o mesmo e-mail em
  // mais de uma empresa. Buscar todos os candidatos e validar a senha contra
  // cada um evita autenticar no tenant errado.
  const candidates = await User.find({ email: normalizedEmail }).select('+passwordHash');
  let user: (typeof candidates)[number] | null = null;

  for (const candidate of candidates) {
    if (await bcrypt.compare(password, candidate.passwordHash)) {
      user = candidate;
      break;
    }
  }

  if (!user) throw new InvalidCredentialsError();

  const isFirstLogin = !user.first_login;
  const timestamp = formatTimestamp();

  await User.updateOne(
    { _id: user._id },
    { $set: { current_login: timestamp, ...(isFirstLogin ? { first_login: timestamp } : {}) } }
  );

  if (isFirstLogin) {
    await activatePendingParticipants(String(user._id));
  }

  const memberships = await listMemberships(String(user._id));
  const activeMembership =
    memberships.find((membership) => membership.status === 'activated') ??
    memberships.find((membership) => membership.status === 'pending');

  const sessionUser = await buildSessionUser(
    String(user._id),
    activeMembership?.companyId ?? null,
    activeMembership?.role ?? 'user'
  );

  const token = signToken({
    id: sessionUser.id,
    companyId: sessionUser.companyId,
    role: sessionUser.role
  });

  return { token, user: sessionUser };
}
