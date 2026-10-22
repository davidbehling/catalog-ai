import { useState } from 'react';
import { Building2, LogOut } from 'lucide-react';

type NoCompanyModalProps = {
  busy: boolean;
  onCreateCompany: (name: string) => Promise<void>;
  onLogout: () => void;
};

/**
 * Exibido quando o usuário não está ativo em nenhuma empresa.
 * Permite criar a própria empresa ou encerrar a sessão.
 */
export default function NoCompanyModal({ busy, onCreateCompany, onLogout }: NoCompanyModalProps) {
  const [name, setName] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const companyName = name.trim();
    if (!companyName) return;

    await onCreateCompany(companyName);
  }

  return (
    <div className="modal-backdrop">
      <form className="product-modal" onSubmit={handleSubmit}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">SEM EMPRESA ATIVA</span>
            <h2>Você ainda não faz parte de nenhuma empresa</h2>
          </div>
        </div>

        <p className="modal-hint">
          Você precisa de uma empresa para acessar o catálogo. Crie a sua agora ou saia da sua conta.
        </p>

        <label>
          Nome da empresa
          <input
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Minha empresa"
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onLogout}>
            <LogOut size={15}/> Sair da conta
          </button>
          <button className="primary-button" disabled={busy}>
            <Building2 size={15}/> {busy ? 'Criando…' : 'Criar empresa'}
          </button>
        </div>
      </form>
    </div>
  );
}
