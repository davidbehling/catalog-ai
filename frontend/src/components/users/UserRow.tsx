import { Ban, RotateCcw } from 'lucide-react';
import type { TeamMember } from '../../types';

type UserRowProps = {
  member: TeamMember;
  isSelf: boolean;
  onToggleStatus: (member: TeamMember) => void;
};

const STATUS_LABELS: Record<TeamMember['status'], string> = {
  pending: 'Pendente',
  activated: 'Ativo',
  suspended: 'Suspenso'
};

export default function UserRow({ member, isSelf, onToggleStatus }: UserRowProps) {
  const isSuspended = member.status === 'suspended';

  return (
    <div className="user-row">
      <div className="user-identity">
        <span className="avatar small">{member.name.slice(0, 1).toUpperCase()}</span>
        <strong>{member.name}</strong>
      </div>
      <span className="user-email">{member.email}</span>
      <span className={`role-pill ${member.role}`}>{member.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
      <span className="user-since">{new Date(member.createdAt).toLocaleDateString('pt-BR')}</span>
      <span className={`status-pill ${member.status}`}>{STATUS_LABELS[member.status]}</span>
      <div className="user-row-actions">
        {isSelf ? (
          <span className="user-action-hint">Você</span>
        ) : (
          <button
            className={`icon-button ${isSuspended ? '' : 'danger'}`}
            title={isSuspended ? 'Reconvidar' : 'Suspender'}
            aria-label={isSuspended ? `Reconvidar ${member.name}` : `Suspender ${member.name}`}
            onClick={() => onToggleStatus(member)}
          >
            {isSuspended ? <RotateCcw size={15}/> : <Ban size={15}/>}
          </button>
        )}
      </div>
    </div>
  );
}
