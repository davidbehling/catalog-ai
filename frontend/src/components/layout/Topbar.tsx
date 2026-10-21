import type { Tab, User } from '../../types';

type TopbarProps = {
  user: User;
  tab: Tab;
};

const TAB_LABELS: Record<Tab, string> = {
  products: 'Produtos',
  chat: 'Agente IA',
  users: 'Usuários'
};

export default function Topbar({ user, tab }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        Workspace
        <span>/</span>
        <strong>{TAB_LABELS[tab]}</strong>
      </div>
      <div className="topbar-right">
        <span className="status-dot" /> Sistema operacional
        <div className="top-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
      </div>
    </header>
  );
}
