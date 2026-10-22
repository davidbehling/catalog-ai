import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import type { Membership } from '../../types';

type CompanySwitcherProps = {
  memberships: Membership[];
  activeCompanyId: string;
  busy: boolean;
  onSwitch: (companyId: string) => void;
};

export default function CompanySwitcher({ memberships, activeCompanyId, busy, onSwitch }: CompanySwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = memberships.find((membership) => membership.companyId === activeCompanyId);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function handleSelect(companyId: string) {
    setOpen(false);

    if (companyId !== activeCompanyId) onSwitch(companyId);
  }

  if (memberships.length <= 1) {
    return (
      <div className="workspace">
        <span className="workspace-icon">
          {(active?.companyName ?? 'M').slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{active?.companyName ?? 'Minha empresa'}</strong>
          <small>Plano demonstração</small>
        </div>
        <span className="chevron">⌄</span>
      </div>
    );
  }

  return (
    <div className="company-switcher" ref={containerRef}>
      <button className="workspace" onClick={() => setOpen((value) => !value)} disabled={busy}>
        <span className="workspace-icon">
          {(active?.companyName ?? 'M').slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{active?.companyName ?? 'Minha empresa'}</strong>
          <small>{memberships.length} empresas</small>
        </div>
        <ChevronDown size={15} className="chevron"/>
      </button>

      {open && (
        <div className="company-menu">
          <span className="company-menu-label">Trocar de empresa</span>
          {memberships.map((membership) => (
            <button
              key={membership.companyId}
              className={`company-option ${membership.companyId === activeCompanyId ? 'active' : ''}`}
              onClick={() => handleSelect(membership.companyId)}
            >
              <Building2 size={15}/>
              <span>
                <strong>{membership.companyName}</strong>
                <small>{membership.role === 'admin' ? 'Administrador' : 'Usuário'}</small>
              </span>
              {membership.companyId === activeCompanyId && <Check size={15}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
