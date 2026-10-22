export type Role = 'admin' | 'user';

export type ParticipantStatus = 'pending' | 'activated' | 'suspended';

export type Membership = {
  companyId: string;
  companyName: string;
  role: Role;
  status: ParticipantStatus;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  companyName?: string;
  firstLogin: string | null;
  currentLogin: string | null;
  memberships: Membership[];
};

export type TeamMember = {
  id: string;
  participantId: string;
  name: string;
  email: string;
  role: Role;
  status: ParticipantStatus;
  createdAt: string;
  firstLogin: string | null;
  currentLogin: string | null;
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

export type Notification = {
  id: string;
  title: string;
  message: string;
  ready: boolean;
  companyId: string;
  createdAt: string;
};
