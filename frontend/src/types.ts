export type Role = 'admin' | 'user';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  companyName?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  createdAt: string;
};

export type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
};

export type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

export type Tab = 'products' | 'chat' | 'users';
