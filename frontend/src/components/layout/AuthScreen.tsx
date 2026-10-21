import { useState, type FormEvent } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { api, saveSession } from '../../lib/api';
import type { User } from '../../types';

type AuthScreenProps = {
  onAuthenticated: (user: User) => void;
};

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('admin-a@example.com');
  const [password, setPassword] = useState('Demo1234!');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('Minha empresa');

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password, companyName };
      const result = await api<{ token: string; user: User }>(path, { method: 'POST', body: JSON.stringify(body) });

      saveSession(result.token, result.user);
      onAuthenticated(result.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="brand">
          <span className="brand-mark"><Sparkles size={21}/></span> maria
          <span className="brand-dot">.</span>
        </div>
        <div className="visual-copy">
          <span className="eyebrow">CATÁLOGO INTELIGENTE</span>
          <h1>Seus produtos.<br/><em>Conversas melhores.</em></h1>
          <p>Uma experiência simples para gerenciar seu catálogo e responder clientes com inteligência.</p>
        </div>
        <div className="visual-bottom">
          <span><ShieldCheck size={16}/> Ambiente multi-tenant</span>
          <span>Plataforma de demonstração</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand brand">
            <span className="brand-mark"><Sparkles size={21}/></span> maria
            <span className="brand-dot">.</span>
          </div>
          <span className="eyebrow">BEM-VINDO À MARIA</span>
          <h2>{mode === 'login' ? 'Entre na sua conta' : 'Crie sua empresa'}</h2>
          <p className="muted">
            {mode === 'login'
              ? 'Acesse seu espaço de trabalho e catálogo.'
              : 'Seu primeiro usuário será administrador da empresa.'}
          </p>

          <form onSubmit={submitAuth} className="stack-form">
            {mode === 'register' && (
              <>
                <label>
                  Seu nome
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo"/>
                </label>
                <label>
                  Nome da empresa
                  <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Sua empresa"/>
                </label>
              </>
            )}
            <label>
              E-mail
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com"/>
            </label>
            <label>
              Senha
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres"/>
            </label>
            {error && <div className="error-banner">{error}</div>}
            <button className="primary-button" disabled={busy}>
              {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar na plataforma' : 'Criar conta'} <span>→</span>
            </button>
          </form>

          <p className="switch-auth">
            {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>

          <div className="demo-note">
            <strong>Conta de demonstração</strong>
            <span>admin-a@example.com · Demo1234!</span>
          </div>
        </div>
      </section>
    </main>
  );
}
