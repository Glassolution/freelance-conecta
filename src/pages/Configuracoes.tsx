import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ShoppingBag, Megaphone, Users, MessageSquare, Globe,
  CheckCircle, Send, PackageCheck, Wrench, Settings, LogOut,
  Crown, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import { getPlanBadgeStyle } from '@/lib/plan';

const sidebarLinks = [
  { icon: Home, label: 'Início', path: '/dashboard' },
  { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
  { icon: Megaphone, label: 'Meus Anúncios', path: '/meus-anuncios' },
  { icon: Users, label: 'Meus Clientes', path: '/meus-clientes' },
  { icon: MessageSquare, label: 'Mensagens', path: '/mensagens' },
  { icon: Globe, label: 'Criador.ia', path: null },
  { icon: CheckCircle, label: 'Serviços Aprovados', path: null },
  { icon: Send, label: 'Serviços Enviados', path: null },
  { icon: PackageCheck, label: 'Serviços Entregues', path: null },
  { icon: Wrench, label: 'Ferramentas', path: '/ferramentas' },
];

function getUserInitials(user: any): string {
  const name = user?.user_metadata?.full_name;
  if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (user?.email?.[0] || 'U').toUpperCase();
}

function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
}

const Configuracoes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { plan, planExpiresAt, isActive, loading, planLabel } = usePlanStatus();

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);
  const planBadgeStyle = getPlanBadgeStyle(plan, isActive);

  const formattedExpiry = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString('pt-BR')
    : null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen" style={{ background: '#f8f9fc' }}>
      {/* SIDEBAR */}
      <aside className="w-[240px] shrink-0 flex flex-col justify-between py-6 px-4 max-lg:hidden border-r border-[#edf0f7]" style={{ background: '#ffffff' }}>
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#29B2FE' }}>
              {initials}
            </div>
            <div className="flex items-center gap-1.5">
              <div>
                <p className="text-sm font-heading font-bold text-[#111] leading-tight">{displayName}</p>
                <p className="text-[11px] font-body text-[#9CA3B4]">Plataforma de Serviços</p>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
                style={planBadgeStyle}
              >
                {planLabel}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => {
              const isActiveLink = link.path === location.pathname;
              return (
                <button
                  key={link.label}
                  onClick={() => link.path && navigate(link.path)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-colors ${
                    isActiveLink ? 'text-[#29B2FE]' : 'text-[#6B7280] hover:text-[#111] hover:bg-[#f3f4f6]'
                  }`}
                  style={isActiveLink ? { background: 'rgba(41,178,254,0.08)', border: '1px solid rgba(41,178,254,0.2)' } : undefined}
                >
                  <link.icon size={18} />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={() => navigate('/configuracoes')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-[#29B2FE]"
            style={{ background: 'rgba(41,178,254,0.08)', border: '1px solid rgba(41,178,254,0.2)' }}
          >
            <Settings size={18} /> Configurações
          </button>
          <div className="border-t border-[#E8ECF4] my-2" />
          <button onClick={() => navigate('/')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-[#6B7280] hover:text-[#111] hover:bg-[#f3f4f6] transition-colors">
            <Home size={18} /> Página Inicial
          </button>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-[#ef4444] hover:bg-red-500/10 transition-colors">
            <LogOut size={18} /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[700px] mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[#111]">Configurações</h1>
            <p className="text-sm font-body text-[#9CA3B4] mt-1">Gerencie sua conta e assinatura.</p>
          </div>

          {/* SUBSCRIPTION SECTION */}
          <div>
            <h2 className="text-base font-heading font-bold text-[#111] mb-4">Minha Assinatura</h2>

            {loading ? (
              <div className="h-32 rounded-xl bg-[#f3f4f6] animate-pulse" />
            ) : isActive ? (
              <div
                style={{
                  border: '1.5px solid #22c55e',
                  background: '#f0fdf4',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={18} style={{ color: '#22c55e' }} />
                  <span className="text-sm font-heading font-bold text-[#111]">Plano Ativo</span>
                </div>
                <div className="space-y-2 text-sm font-body text-[#374151]">
                  <p><span className="text-[#6B7280]">Plano:</span> {planLabel}</p>
                  <p><span className="text-[#6B7280]">Status:</span> Ativo</p>
                  <p><span className="text-[#6B7280]">Válido até:</span> {formattedExpiry}</p>
                  <p className="text-xs text-[#9CA3B4]">Renova automaticamente</p>
                </div>
                <button
                  onClick={() => navigate('/pricing')}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-body font-medium border border-[#e5e7eb] text-[#6B7280] hover:bg-[#f3f4f6] transition-colors"
                >
                  Gerenciar Assinatura
                </button>
              </div>
            ) : (
              <div
                style={{
                  border: '1.5px solid #f59e0b',
                  background: '#fffbeb',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                  <span className="text-sm font-heading font-bold text-[#111]">Sem plano ativo</span>
                </div>
                <p className="text-sm font-body text-[#6B7280] mb-4">
                  Você não possui uma assinatura ativa.
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-5 py-2.5 rounded-lg text-sm font-body font-semibold text-white transition-colors"
                  style={{ background: '#29B2FE' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1a9ee8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#29B2FE')}
                >
                  Ver Planos →
                </button>
              </div>
            )}
          </div>

          {/* PROFILE SECTION */}
          <div>
            <h2 className="text-base font-heading font-bold text-[#111] mb-4">Perfil</h2>
            <div className="bg-white rounded-xl border border-[#edf0f7] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#29B2FE] to-[#0077cc] flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-body font-medium text-[#111]">{displayName}</p>
                  <p className="text-xs font-body text-[#9CA3B4]">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
