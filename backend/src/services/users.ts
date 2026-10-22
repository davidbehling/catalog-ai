import bcrypt from 'bcryptjs';
import { Company } from '../models/Company.js';
import { Participant } from '../models/Participant.js';
import { User } from '../models/User.js';

export type Role = 'admin' | 'user';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  createdAt: string;
  firstLogin: string | null;
  currentLogin: string | null;
};

export type CompanyMember = {
  id: string;
  participantId: string;
  name: string;
  email: string;
  role: Role;
  status: 'pending' | 'activated' | 'suspended';
  createdAt: string;
  firstLogin: string | null;
  currentLogin: string | null;
};

type UserLike = {
  _id: unknown;
  name: string;
  email: string;
  passwordHash?: string;
  companyId?: unknown;
  first_login?: string | null;
  current_login?: string | null;
  createdAt?: Date;
};

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('Já existe um usuário com este e-mail');
    this.name = 'EmailAlreadyInUseError';
  }
}

export class DuplicateParticipantError extends Error {
  constructor() {
    super('Este usuário já participa desta empresa');
    this.name = 'DuplicateParticipantError';
  }
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

export function toPublicUser(user: UserLike): PublicUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: 'user',
    companyId: String(user.companyId ?? ''),
    createdAt: (user.createdAt ?? new Date()).toISOString(),
    firstLogin: user.first_login ?? null,
    currentLogin: user.current_login ?? null
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const email = input.email.toLowerCase().trim();

  if (await User.exists({ email })) {
    throw new EmailAlreadyInUseError();
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    return await User.create({ name: input.name, email, passwordHash });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new EmailAlreadyInUseError();
    }

    throw error;
  }
}

export async function listCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  const participants = await Participant.find({ company_id: companyId })
    .populate<{ user_id: { _id: unknown; name: string; email: string; first_login?: string | null; current_login?: string | null } }>(
      'user_id',
      'name email first_login current_login'
    )
    .sort({ createdAt: -1 })
    .lean();

  return participants
    .filter((participant) => participant.user_id)
    .map((participant) => ({
      id: String(participant.user_id._id),
      participantId: String(participant._id),
      name: participant.user_id.name,
      email: participant.user_id.email,
      role: participant.role,
      status: participant.status,
      createdAt: participant.createdAt.toISOString(),
      firstLogin: participant.user_id.first_login ?? null,
      currentLogin: participant.user_id.current_login ?? null
    }));
}

export async function setParticipantStatus(
  participantId: string,
  status: 'pending' | 'activated' | 'suspended'
) {
  return Participant.findByIdAndUpdate(participantId, { $set: { status } }, { new: true }).lean();
}

export async function findParticipantByUserAndCompany(userId: string, companyId: string) {
  return Participant.findOne({ user_id: userId, company_id: companyId }).lean();
}

export async function createParticipant(input: {
  userId: string;
  companyId: string;
  role: Role;
  status: 'pending' | 'activated' | 'suspended';
}) {
  try {
    return await Participant.create({
      user_id: input.userId,
      company_id: input.companyId,
      role: input.role,
      status: input.status
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new DuplicateParticipantError();
    }

    throw error;
  }
}

export async function createCompany(name: string) {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'empresa';
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  return Company.create({ name, slug });
}
