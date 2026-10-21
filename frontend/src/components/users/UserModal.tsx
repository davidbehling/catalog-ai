import { useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { User } from '../../types';

type UserModalProps = {
  companyName?: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
};

const EMPTY_FORM = { name: '', email: '', password: '' };

export default function UserModal({ companyName, onClose, onSaved, onError }: UserModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  async function saveUser(event: FormEvent) {
    event.preventDefault();
    setBusy(true);

    try {
      await api('/users', { method: 'POST', body: JSON.stringify(form) });
      await onSaved();
      onClose();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="product-modal" onSubmit={saveUser}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">EQUIPE</span>
            <h2>Novo usuário</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>×</button>
        </div>

        <label>
          Nome
          <input required minLength={2} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo"/>
        </label>
        <label>
          E-mail
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="colaborador@empresa.com"/>
        </label>
        <label>
          Senha provisória
          <input required type="password" minLength={8} maxLength={128} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo de 8 caracteres"/>
        </label>

        <p className="modal-hint">
          O usuário será criado com perfil de acesso e vinculada à empresa {companyName ?? 'atual'}. Ele poderá consultar o catálogo e usar o agente de IA.
        </p>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" disabled={busy}>{busy ? 'Criando…' : 'Criar usuário'}</button>
        </div>
      </form>
    </div>
  );
}
