import { useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { api } from '../../lib/api';
import type { TeamMember, User } from '../../types';
import UserModal from './UserModal';

type UsersPageProps = {
  user: User;
  active: boolean;
  onError: (message: string) => void;
};

export default function UsersPage({ user, active, onError }: UsersPageProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadMembers() {
    const result = await api<{ users: TeamMember[] }>('/users');
    setMembers(result.users);
  }

  useEffect(() => {
    if (!active) return;

    loadMembers().catch((e: Error) => onError(e.message));
  }, [active]);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EQUIPE</span>
          <h1>Usuários</h1>
          <p>Gerencie quem tem acesso ao catálogo da sua empresa.</p>
        </div>
        <button className="primary-button compact" onClick={() => setModalOpen(true)}>
          <UserPlus size={17}/> Novo usuário
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
          </div>
          {members.map((member) => (
            <div className="user-row" key={member.id}>
              <div className="user-identity">
                <span className="avatar small">{member.name.slice(0, 1).toUpperCase()}</span>
                <strong>{member.name}</strong>
              </div>
              <span className="user-email">{member.email}</span>
              <span className={`role-pill ${member.role}`}>{member.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
              <span className="user-since">{new Date(member.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Users size={32}/>
          <h3>Nenhum usuário por aqui</h3>
          <p>Adicione o primeiro membro da sua equipe.</p>
          <button className="primary-button compact" onClick={() => setModalOpen(true)}>Adicionar usuário</button>
        </div>
      )}

      {modalOpen && (
        <UserModal
          companyName={user.companyName}
          onClose={() => setModalOpen(false)}
          onSaved={loadMembers}
          onError={onError}
        />
      )}
    </>
  );
}
