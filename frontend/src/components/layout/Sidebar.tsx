import { Bot, LayoutDashboard, LogOut, MessageCircle, Sparkles, Users } from 'lucide-react';
import type { Tab, User } from '../../types';

type SidebarProps = {
  user: User;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
};

export default function Sidebar({ user, tab, onTabChange, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><Sparkles size={20}/></span> maria
        <span className="brand-dot">.</span>
      </div>

      <div className="workspace">
        <span className="workspace-icon">{(user.companyName ?? 'M').slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{user.companyName ?? 'Minha empresa'}</strong>
          <small>Plano demonstração</small>
        </div>
        <span className="chevron">⌄</span>
      </div>

      <div className="nav-label">WORKSPACE</div>

      <button className={`nav-item ${tab === 'products' ? 'active' : ''}`} onClick={() => onTabChange('products')}>
        <LayoutDashboard size={18}/>
        Visão geral
      </button>

      <button className={`nav-item ${tab === 'chat' ? 'active' : ''}`} onClick={() => onTabChange('chat')}>
        <MessageCircle size={18}/>
        Agente IA
        <span className="nav-new">AI</span>
      </button>

      {user.role === 'admin' && (
        <button className={`nav-item ${tab === 'users' ? 'active' : ''}`} onClick={() => onTabChange('users')}>
          <Users size={18}/>
          Usuários
        </button>
      )}

      <div className="sidebar-bottom">
        <div className="ai-card">
          <div className="ai-card-icon">
            <Bot size={18}/>
          </div>
          <strong>Seu catálogo, mais inteligente</strong>
          <p>Converse com a IA para encontrar produtos e responder dúvidas.</p>
          <button onClick={() => onTabChange('chat')}>
            Experimentar agente <span>↗</span>
          </button>
        </div>

        <div className="profile-row">
          <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div className="profile-copy">
            <strong>{user.name}</strong>
            <small>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</small>
          </div>
          <button className="icon-button logout" title="Sair" onClick={onLogout}>
            <LogOut size={17}/>
          </button>
        </div>
      </div>
    </aside>
  );
}
