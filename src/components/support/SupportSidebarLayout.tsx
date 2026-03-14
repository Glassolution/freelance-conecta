import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleHelp, Mail, MessageCircle } from 'lucide-react';
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
    { key: 'suporte' as const, icon: MessageCircle, label: 'Suporte', path: '/suporte' },
    { key: 'faq' as const, icon: CircleHelp, label: 'Perguntas Frequentes', path: '/suporte/faq' },
    { key: 'contato' as const, icon: Mail, label: 'Fale Conosco', path: '/suporte/contato' },
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

          <div className="space-y-1">
            <button
              onClick={() => navigate('/suporte')}
              type="button"
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition-colors"
              style={active === 'suporte' ? { color: '#29B2FE', background: '#ECF8FF', borderColor: '#BFEAFF' } : { color: '#4B5563', borderColor: 'transparent' }}
            >
              <MessageCircle size={16} /> 💬 Suporte
            </button>
          </div>

          <div className="my-4 border-t border-[#E5E7EB]" />

          <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] px-3 mb-2">Ajuda e contato</p>

          <div className="space-y-1">
            {navItems
              .filter((item) => item.key !== 'suporte')
              .map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.path)}
                    type="button"
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition-colors"
                    style={isActive ? { color: '#29B2FE', background: '#ECF8FF', borderColor: '#BFEAFF' } : { color: '#4B5563', borderColor: 'transparent' }}
                  >
                    <Icon size={16} /> {item.label}
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
