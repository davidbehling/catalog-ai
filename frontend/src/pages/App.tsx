import { useState } from 'react';
import { api, clearSession, getUser, saveSession } from '../lib/api';
import type { Tab, User } from '../types';
import AuthScreen from '../components/layout/AuthScreen';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import NoCompanyModal from '../components/layout/NoCompanyModal';
import ErrorBanner from '../components/ErrorBanner';
import OverviewPage from '../components/products/OverviewPage';
import ChatPanel from '../components/chat/ChatPanel';
import UsersPage from '../components/users/UsersPage';

export default function App() {
  const [user, setUser] = useState<User | null>(getUser());
  const [tab, setTab] = useState<Tab>('products');
  const [error, setError] = useState('');
  const [switchingCompany, setSwitchingCompany] = useState(false);

  function logout() {
    clearSession();
    setUser(null);
    setError('');
    setTab('products');
  }

  function handleTabChange(next: Tab) {
    if (next === 'users' && user?.role !== 'admin') return;

    setTab(next);
  }

  async function switchCompany(companyId: string) {
    setSwitchingCompany(true);
    setError('');

    try {
      const result = await api<{ token: string; user: User }>('/auth/switch-company', {
        method: 'POST',
        body: JSON.stringify({ companyId })
      });

      saveSession(result.token, result.user);
      setUser(result.user);
      setTab('products');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSwitchingCompany(false);
    }
  }

  async function createCompany(name: string) {
    setSwitchingCompany(true);
    setError('');

    try {
      const result = await api<{ token: string; user: User }>('/auth/companies', {
        method: 'POST',
        body: JSON.stringify({ name })
      });

      saveSession(result.token, result.user);
      setUser(result.user);
      setTab('products');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSwitchingCompany(false);
    }
  }

  if (!user) return <AuthScreen onAuthenticated={setUser} />;

  // Sem empresa ativa o usuário não tem o que consultar até criar a própria.
  const hasCompany = Boolean(user.companyId);
  const hasActiveMembership = user.memberships.some((membership) => membership.status === 'activated');

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        tab={tab}
        switchingCompany={switchingCompany}
        onTabChange={handleTabChange}
        onSwitchCompany={switchCompany}
        onLogout={logout}
      />

      <main className="main-area">
        <Topbar user={user} tab={tab} onError={setError} />

        <div className="page-content">
          <ErrorBanner message={error} onClose={() => setError('')} />

          {hasCompany ? (
            <>
              <div className="tab-panel" hidden={tab !== 'products'}>
                <OverviewPage user={user} onError={setError} />
              </div>

              <div className="tab-panel" hidden={tab !== 'chat'}>
                <ChatPanel user={user} active={tab === 'chat'} onError={setError} />
              </div>

              {user.role === 'admin' && (
                <div className="tab-panel" hidden={tab !== 'users'}>
                  <UsersPage user={user} active={tab === 'users'} onError={setError} />
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>Nenhuma empresa ativa</h3>
              <p>Crie sua empresa para começar a gerenciar o catálogo.</p>
            </div>
          )}
        </div>
      </main>

      {!hasCompany && (
        <NoCompanyModal
          busy={switchingCompany}
          onCreateCompany={createCompany}
          onLogout={logout}
        />
      )}
    </div>
  );
}
