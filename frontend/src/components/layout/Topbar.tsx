import type { Tab, User } from '../../types';
import NotificationBell from './NotificationBell';

type TopbarProps = {
  user: User;
  tab: Tab;
  onError: (message: string) => void;
};

const TAB_LABELS: Record<Tab, string> = {
  products: 'Produtos',
  chat: 'Agente IA',
  users: 'Usuários'
};

export default function Topbar({ user, tab, onError }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        Workspace
        <span>/</span>
        <strong>{TAB_LABELS[tab]}</strong>
      </div>
      <div className="topbar-right">
        <span className="status-dot" /> Sistema operacional
        <NotificationBell onError={onError}/>
        <div className="top-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
      </div>
    </header>
  );
}
