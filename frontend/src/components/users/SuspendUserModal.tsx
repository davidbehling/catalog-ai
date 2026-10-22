import { useState } from 'react';
import { Ban, RotateCcw } from 'lucide-react';
import type { TeamMember } from '../../types';

type SuspendUserModalProps = {
  member: TeamMember;
  busy: boolean;
  onClose: () => void;
  onConfirm: (status: 'pending' | 'suspended') => Promise<void>;
};

/**
 * Confirmação de suspensão ou reconvite de um participante.
 */
export default function SuspendUserModal({ member, busy, onClose, onConfirm }: SuspendUserModalProps) {
  const [error, setError] = useState('');
  const isSuspend = member.status !== 'suspended';

  async function handleConfirm() {
    setError('');

    try {
      await onConfirm(isSuspend ? 'suspended' : 'pending');
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="product-modal">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{isSuspend ? 'SUSPENSÃO' : 'RECONVITE'}</span>
            <h2>{isSuspend ? 'Suspender participante' : 'Reconvidar participante'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>×</button>
        </div>

        <p className="modal-hint">
          {isSuspend
            ? `Ao suspender ${member.name}, o participante perderá o acesso ao catálogo desta empresa. Você pode reconvidá-lo depois.`
            : `Ao reconvidar ${member.name}, ele voltará a ter o convite pendente e receberá uma notificação para aceitar a participação.`}
        </p>

        {error && <div className="error-banner">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" disabled={busy} onClick={handleConfirm}>
            {isSuspend ? <Ban size={15}/> : <RotateCcw size={15}/>}
            {busy ? 'Processando…' : isSuspend ? 'Confirmar suspensão' : 'Enviar reconvite'}
          </button>
        </div>
      </div>
    </div>
  );
}
