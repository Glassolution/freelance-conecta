import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, HelpCircle, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type SupportSection = 'suporte' | 'faq' | 'contato';

interface SupportSidebarLayoutProps {
  active: SupportSection;
  children: ReactNode;
}

const SupportSidebarLayout = ({ active, children }: SupportSidebarLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const email = user?.email || 'sem-email';
  const initials = fullName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { key: 'faq' as const, label: 'Perguntas Frequentes', icon: HelpCircle, path: '/suporte/faq' },
    { key: 'contato' as const, label: 'Fale Conosco', icon: Mail, path: '/suporte/contato' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <aside className="shrink-0 flex flex-col justify-between border-r border-[#E5E7EB] bg-white p-4" style={{ width: 220 }}>
        <div>
          <button
            onClick={() => navigate('/suporte')}
            className="flex items-center gap-2 mb-8"
            type="button"
          >
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
              <rect width="40" height="40" rx="9" fill="#29B2FE" />
              <text x="50%" y="54%" dominantBaseline="central" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill="white">M</text>
            </svg>
            <span className="text-lg font-bold text-[#111827]">Markfy</span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              marginBottom: 16,
              background: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              color: '#6b7280',
              fontSize: 13,
              cursor: 'pointer',
              width: '100%'
            }}
            type="button"
          >
            <ArrowLeft size={14} />
            Voltar ao Dashboard
          </button>

          <div className="space-y-1">
            <button
              onClick={() => navigate('/suporte')}
              type="button"
              className="w-full text-left rounded-xl px-3 py-2 text-sm font-medium border transition-colors flex items-center gap-2"
              style={active === 'suporte' ? { color: '#29B2FE', background: '#ECF8FF', borderColor: '#BFEAFF' } : { color: '#4B5563', borderColor: 'transparent' }}
            >
              <MessageSquare size={15} /> Suporte
            </button>
          </div>

          <div className="my-4 border-t border-[#E5E7EB]" />

          <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] px-3 mb-2">Ajuda e contato</p>

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = active === item.key;
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  type="button"
                  className="w-full text-left rounded-xl px-3 py-2 text-sm font-medium border transition-colors flex items-center gap-2"
                  style={isActive ? { color: '#29B2FE', background: '#ECF8FF', borderColor: '#BFEAFF' } : { color: '#4B5563', borderColor: 'transparent' }}
                >
                  <Icon size={15} /> {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] p-3 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-[#29B2FE] text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111827] truncate">{fullName}</p>
              <p className="text-xs text-[#6B7280] truncate">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
};

export default SupportSidebarLayout;
