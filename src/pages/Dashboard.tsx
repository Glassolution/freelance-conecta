import { useState } from 'react';
import {
  Home, User, SlidersHorizontal, Globe, Briefcase,
  CheckCircle, Send, PackageCheck, Wrench,
  Settings, LogOut, Search, Bell, Mail, ChevronRight,
  Heart, Plus, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const categories = [
  { name: 'Dev & Tecnologia', progress: '2/8 vistas', icon: '💻', color: 'hsl(var(--primary))' },
  { name: 'Design & Criação', progress: '3/8 vistas', icon: '🎨', color: '#a78bfa' },
  { name: 'Marketing Digital', progress: '6/12 vistas', icon: '📈', color: '#38bdf8' },
];

const vagasRecentes = [
  { title: 'Desenvolvimento de App React Native', platform: 'Workana', tag: 'DEV & TECH', tagColor: '#38bdf8', price: 'R$ 3.500', author: 'Leonardo Martins', role: 'Cliente', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop' },
  { title: 'Redesign de Identidade Visual Completa', platform: '99Freelas', tag: 'DESIGN', tagColor: '#a78bfa', price: 'R$ 2.200', author: 'Camila Santos', role: 'Cliente', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop' },
  { title: 'Gestão de Tráfego Pago no Google Ads', platform: 'GetNinjas', tag: 'MARKETING', tagColor: '#34d399', price: 'R$ 1.800', author: 'Rafael Oliveira', role: 'Cliente', image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=250&fit=crop' },
];

const statsData = [
  { label: '1-10 Mar', value: 25 },
  { label: '11-20 Mar', value: 40 },
  { label: '21-30 Mar', value: 32 },
];

const plataformas = [
  { name: 'Workana', role: 'Plataforma de Serviços', status: 'Conectado' },
  { name: 'GetNinjas', role: 'Plataforma de Serviços', status: 'Conectado' },
  { name: '99Freelas', role: 'Plataforma de Serviços', status: 'Conectado' },
];

const sidebarLinks = [
  { icon: Home, label: 'Início', active: false },
  { icon: User, label: 'Perfil', active: false },
  { icon: SlidersHorizontal, label: 'Filtros', active: true },
  { icon: Globe, label: 'Criador.ia', active: false },
  { icon: Briefcase, label: 'Serviços', active: false },
  { icon: CheckCircle, label: 'Serviços Aprovados', active: false },
  { icon: Send, label: 'Serviços Enviados', active: false },
  { icon: PackageCheck, label: 'Serviços Entregues', active: false },
  { icon: Wrench, label: 'Ferramentas', active: false },
];

const lessonRows = [
  { client: 'Padhang Satrio', date: '2/16/2004', tag: 'DEV & TECH', tagColor: '#38bdf8', desc: 'Desenvolvimento de Landing Page' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getUserInitials(user: any): string {
  const name = user?.user_metadata?.full_name || user?.email || '';
  if (user?.user_metadata?.full_name) {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return (user?.email?.[0] || 'U').toUpperCase();
}

function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
}

function getUserFirstName(user: any): string {
  const full = user?.user_metadata?.full_name;
  if (full) return full.split(' ')[0];
  return user?.email?.split('@')[0] || 'Usuário';
}

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);
  const firstName = getUserFirstName(user);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen" style={{ background: '#F8F9FC' }}>
      {/* LEFT SIDEBAR — Dark theme like reference */}
      <aside className="w-[240px] shrink-0 flex flex-col justify-between py-6 px-4 max-lg:hidden" style={{ background: '#0A1628' }}>
        <div>
          {/* Logo + user info */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: 'hsl(var(--primary))' }}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-white leading-tight">{displayName}</p>
              <p className="text-[11px] font-body text-white/40">Plataforma de Serviços</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-colors ${
                  link.active
                    ? 'text-[#C8FF00]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={link.active ? { background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.2)' } : undefined}
              >
                <link.icon size={18} />
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            <Settings size={18} /> Configurações
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-[#E8ECF4] shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="flex items-center gap-2 bg-[#F3F4F8] rounded-full px-4 py-2 flex-1">
              <Search size={16} className="text-[#9CA3B4]" />
              <input
                type="text"
                placeholder="Buscar vagas..."
                className="bg-transparent text-sm font-body text-[#1A1D26] outline-none flex-1 placeholder:text-[#9CA3B4]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-full bg-[#F3F4F8] flex items-center justify-center text-[#6B7280] hover:text-[#1A1D26] transition-colors">
              <Mail size={18} />
            </button>
            <button className="w-9 h-9 rounded-full bg-[#F3F4F8] flex items-center justify-center text-[#6B7280] hover:text-[#1A1D26] transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'hsl(var(--primary))' }}>
                {initials}
              </div>
              <span className="text-sm font-body font-medium text-[#1A1D26] max-md:hidden">{displayName}</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex max-xl:flex-col">
            {/* CENTER COLUMN */}
            <div className="flex-1 p-6 space-y-6">
              {/* Banner */}
              <div
                className="relative rounded-2xl overflow-hidden p-8"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), #a78bfa)', minHeight: '180px' }}
              >
                <div className="relative z-10 max-w-md">
                  <p className="text-xs font-body font-medium text-white/70 uppercase tracking-wider mb-1">Plataforma de Freelancers</p>
                  <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-white leading-tight mb-4">
                    Encontre as Melhores Vagas de Freelancer
                  </h2>
                  <button className="flex items-center gap-2 bg-white text-[#1A1D26] font-body font-medium text-sm px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors">
                    Explorar Vagas <ChevronRight size={16} />
                  </button>
                </div>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-20 bg-white max-md:hidden" />
                <div className="absolute right-20 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full opacity-10 bg-white max-md:hidden" />
              </div>

              {/* Category progress pills */}
              <div className="flex gap-4 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-[#E8ECF4] min-w-[200px]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${cat.color}15` }}>
                      {cat.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-body text-[#9CA3B4]">{cat.progress}</p>
                      <p className="text-sm font-body font-medium text-[#1A1D26]">{cat.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vagas Recentes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg text-[#1A1D26]">Vagas Recentes</h3>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full border border-[#E8ECF4] flex items-center justify-center text-[#9CA3B4] hover:text-[#1A1D26] transition-colors">‹</button>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: 'hsl(var(--primary))' }}>›</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vagasRecentes.map((vaga) => (
                    <div key={vaga.title} className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden group hover:shadow-lg transition-shadow">
                      <div className="relative h-36 overflow-hidden">
                        <img src={vaga.image} alt={vaga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-[#9CA3B4] hover:text-red-500 transition-colors">
                          <Heart size={14} />
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: vaga.tagColor, background: `${vaga.tagColor}15` }}>{vaga.tag}</span>
                          <span className="text-[10px] font-body text-[#9CA3B4]">{vaga.platform}</span>
                        </div>
                        <h4 className="font-body font-semibold text-sm text-[#1A1D26] leading-snug mb-3 line-clamp-2">{vaga.title}</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#a78bfa] flex items-center justify-center text-white text-[9px] font-bold">
                              {vaga.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-xs font-body font-medium text-[#1A1D26] leading-tight">{vaga.author}</p>
                              <p className="text-[10px] font-body text-[#9CA3B4]">{vaga.role}</p>
                            </div>
                          </div>
                          <span className="text-sm font-heading font-bold" style={{ color: 'hsl(var(--primary))' }}>{vaga.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suas Propostas */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg text-[#1A1D26]">Suas Propostas</h3>
                  <button className="text-sm font-body font-medium" style={{ color: 'hsl(var(--primary))' }}>Ver todas</button>
                </div>
                <div className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E8ECF4]">
                        <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Cliente</th>
                        <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Categoria</th>
                        <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Descrição</th>
                        <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessonRows.map((row, i) => (
                        <tr key={i} className="border-b border-[#E8ECF4] last:border-0">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#34d399] to-[#38bdf8] flex items-center justify-center text-white text-[10px] font-bold">PS</div>
                              <div>
                                <p className="text-sm font-body font-medium text-[#1A1D26]">{row.client}</p>
                                <p className="text-[11px] font-body text-[#9CA3B4]">{row.date}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: row.tagColor, background: `${row.tagColor}15` }}>{row.tag}</span>
                          </td>
                          <td className="px-5 py-3 text-sm font-body text-[#6B7280]">{row.desc}</td>
                          <td className="px-5 py-3">
                            <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary))', color: 'white' }}>
                              <ExternalLink size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="w-[300px] shrink-0 border-l border-[#E8ECF4] bg-white p-6 space-y-6 max-xl:w-full max-xl:border-l-0 max-xl:border-t max-xl:flex max-xl:gap-6 max-xl:flex-wrap">
              {/* Estatísticas */}
              <div className="flex-1 min-w-[260px]">
                <h3 className="font-heading font-bold text-base text-[#1A1D26] mb-4">Estatísticas</h3>
                <div className="flex flex-col items-center mb-4">
                  <div className="relative w-20 h-20 mb-3">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8ECF4" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="32, 100" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-heading font-bold text-[#1A1D26]">32%</span>
                    </div>
                  </div>
                  <p className="font-heading font-bold text-lg text-[#1A1D26]">{getGreeting()}, {firstName} 🔥</p>
                  <p className="text-xs font-body text-[#9CA3B4] text-center">Continue buscando para atingir sua meta!</p>
                </div>
                <div className="flex items-end justify-between gap-3 h-24 mb-2">
                  {statsData.map((s) => (
                    <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-lg transition-all" style={{ height: `${s.value * 2}px`, background: s.value === Math.max(...statsData.map(d => d.value)) ? 'hsl(var(--primary))' : '#E8ECF4' }} />
                      <span className="text-[10px] font-body text-[#9CA3B4]">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plataformas */}
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-base text-[#1A1D26]">Plataformas</h3>
                  <button className="w-7 h-7 rounded-full border border-[#E8ECF4] flex items-center justify-center text-[#9CA3B4] hover:text-[#1A1D26] transition-colors"><Plus size={14} /></button>
                </div>
                <div className="flex flex-col gap-3">
                  {plataformas.map((p) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#38bdf8] flex items-center justify-center text-white text-[10px] font-bold">{p.name.substring(0, 2).toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-body font-medium text-[#1A1D26]">{p.name}</p>
                          <p className="text-[11px] font-body text-[#9CA3B4]">{p.role}</p>
                        </div>
                      </div>
                      <button className="text-[11px] font-body font-medium px-3 py-1 rounded-full" style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.08)' }}>{p.status}</button>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2.5 rounded-xl text-sm font-body font-medium transition-colors" style={{ background: 'hsl(var(--primary))', color: 'white' }}>Ver Todas</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
