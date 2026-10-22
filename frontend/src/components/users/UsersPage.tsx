import { useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { api } from '../../lib/api';
import type { TeamMember, User } from '../../types';
import InviteUserModal from './InviteUserModal';
import SuspendUserModal from './SuspendUserModal';
import UserRow from './UserRow';

type UsersPageProps = {
  user: User;
  active: boolean;
  onError: (message: string) => void;
};

export default function UsersPage({ user, active, onError }: UsersPageProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingMember, setPendingMember] = useState<TeamMember | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadMembers() {
    const result = await api<{ users: TeamMember[] }>('/users');
    setMembers(result.users);
  }

  useEffect(() => {
    if (!active) return;

    loadMembers().catch((e: Error) => onError(e.message));
  }, [active]);

  async function changeStatus(status: 'pending' | 'suspended') {
    if (!pendingMember) return;

    setBusy(true);

    try {
      await api(`/users/${pendingMember.participantId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadMembers();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EQUIPE</span>
          <h1>Usuários</h1>
          <p>Gerencie quem tem acesso ao catálogo da sua empresa.</p>
        </div>
        <button className="primary-button compact" onClick={() => setInviteOpen(true)}>
          <UserPlus size={17}/> Convidar usuário
        </button>
      </div>

      <div className="section-heading">
        <div>
          <h2>Membros da empresa</h2>
          <p>Somente administradores podem adicionar usuários.</p>
        </div>
        <span className="count-pill">{members.length} {members.length === 1 ? 'usuário' : 'usuários'}</span>
      </div>

      {members.length ? (
        <div className="user-table">
          <div className="user-table-head">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Perfil</span>
            <span>Desde</span>
            <span>Status</span>
            <span/>
          </div>
          {members.map((member) => (
            <UserRow
              key={member.participantId}
              member={member}
              isSelf={member.id === user.id}
              onToggleStatus={setPendingMember}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Users size={32}/>
          <h3>Nenhum usuário por aqui</h3>
          <p>Convide o primeiro membro da sua equipe.</p>
          <button className="primary-button compact" onClick={() => setInviteOpen(true)}>Convidar usuário</button>
        </div>
      )}

      {inviteOpen && (
        <InviteUserModal
          companyName={user.companyName}
          onClose={() => setInviteOpen(false)}
          onSaved={loadMembers}
          onError={onError}
        />
      )}

      {pendingMember && (
        <SuspendUserModal
          member={pendingMember}
          busy={busy}
          onClose={() => setPendingMember(null)}
          onConfirm={changeStatus}
        />
      )}
    </>
  );
}
