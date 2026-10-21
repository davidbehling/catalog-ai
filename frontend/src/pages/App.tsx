import { useState } from 'react';
import { clearSession, getUser } from '../lib/api';
import type { Tab, User } from '../types';
import AuthScreen from '../components/layout/AuthScreen';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import ErrorBanner from '../components/ErrorBanner';
import OverviewPage from '../components/products/OverviewPage';
import ChatPanel from '../components/chat/ChatPanel';
import UsersPage from '../components/users/UsersPage';

export default function App() {
  const [user, setUser] = useState<User | null>(getUser());
  const [tab, setTab] = useState<Tab>('products');
  const [error, setError] = useState('');

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

  if (!user) return <AuthScreen onAuthenticated={setUser} />;

  return (
    <div className="app-shell">
      <Sidebar user={user} tab={tab} onTabChange={handleTabChange} onLogout={logout} />

      <main className="main-area">
        <Topbar user={user} tab={tab} />

        <div className="page-content">
          <ErrorBanner message={error} onClose={() => setError('')} />

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
        </div>
      </main>
    </div>
  );
}
