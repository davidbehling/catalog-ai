import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export type Role = 'admin' | 'user';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  createdAt: string;
};

type UserLike = {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  companyId: unknown;
  createdAt?: Date;
};

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('Já existe um usuário com este e-mail');
    this.name = 'EmailAlreadyInUseError';
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
    role: user.role === 'admin' ? 'admin' : 'user',
    companyId: String(user.companyId),
    createdAt: (user.createdAt ?? new Date()).toISOString()
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  companyId: string;
}) {
  const email = input.email.toLowerCase().trim();

  if (await User.exists({ email })) {
    throw new EmailAlreadyInUseError();
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    return await User.create({
      name: input.name,
      email,
      passwordHash,
      role: input.role,
      companyId: input.companyId
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new EmailAlreadyInUseError();
    }

    throw error;
  }
}
