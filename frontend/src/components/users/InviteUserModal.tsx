import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';

type InviteUserModalProps = {
  companyName?: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
};

type EmailState = 'idle' | 'checking' | 'registered' | 'unregistered';

/**
 * Convite de usuário.
 *
 * Começa apenas com o e-mail. Se o e-mail ainda não estiver cadastrado, os
 * campos de nome e senha provisória são exibidos para concluir o cadastro.
 */
export default function InviteUserModal({ companyName, onClose, onSaved, onError }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [emailState, setEmailState] = useState<EmailState>('idle');
  const [busy, setBusy] = useState(false);

  // Ao perder o foco do e-mail, verifica se ele já pertence a um usuário.
  useEffect(() => {
    const normalized = email.trim().toLowerCase();

    if (!normalized || !normalized.includes('@')) {
      setEmailState('idle');
      return;
    }

    let cancelled = false;
    setEmailState('checking');

    api<{ registered: boolean }>(`/users/check-email?email=${encodeURIComponent(normalized)}`)
      .then((result) => {
        if (cancelled) return;

        setEmailState(result.registered ? 'registered' : 'unregistered');

        if (result.registered) {
          setName('');
          setPassword('');
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;

        setEmailState('idle');
        onError(e.message);
      });

    return () => { cancelled = true; };
  }, [email]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);

    try {
      const body = emailState === 'unregistered'
        ? { email: email.trim(), name: name.trim(), password }
        : { email: email.trim() };

      await api('/users/invite', { method: 'POST', body: JSON.stringify(body) });
      await onSaved();
      onClose();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const needsAccountFields = emailState === 'unregistered';

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="product-modal" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">EQUIPE</span>
            <h2>Convidar usuário</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>×</button>
        </div>

        <label>
          E-mail
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colaborador@empresa.com"
          />
        </label>

        {emailState === 'checking' && <p className="modal-hint">Verificando e-mail…</p>}

        {emailState === 'registered' && (
          <p className="modal-hint">
            Este e-mail já está cadastrado. O usuário será vinculado a esta empresa como participante.
          </p>
        )}

        {needsAccountFields && (
          <>
            <label>
              Nome
              <input
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </label>
            <label>
              Senha provisória
              <input
                required
                type="password"
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
              />
            </label>
          </>
        )}

        <p className="modal-hint">
          O convite cria a participação em {companyName ?? 'sua empresa'}. O usuário recebe uma notificação
          e a participação é ativada quando ele aceita o convite.
        </p>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" disabled={busy || emailState === 'checking' || emailState === 'idle'}>
            {busy ? 'Enviando…' : 'Enviar convite'}
          </button>
        </div>
      </form>
    </div>
  );
}
