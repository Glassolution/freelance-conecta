import { useState, useEffect } from 'react';
import {
  Home, SlidersHorizontal, Globe, Briefcase,
  CheckCircle, Send, PackageCheck, Wrench,
  Settings, LogOut, Search, Bell, Mail, ChevronRight,
  Heart, Plus, ExternalLink, Loader2, ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const plataformas = [
  { name: 'Workana', role: 'Plataforma de Serviços', status: 'Conectado' },
  { name: 'GetNinjas', role: 'Plataforma de Serviços', status: 'Conectado' },
  { name: '99Freelas', role: 'Plataforma de Serviços', status: 'Conectado' },
];

const sidebarLinks = [
  { icon: Home, label: 'Início', active: true, path: '/dashboard' },
  { icon: ShoppingBag, label: 'Marketplace', active: false, path: '/marketplace' },
  { icon: Globe, label: 'Criador.ia', active: false, path: null },
  { icon: CheckCircle, label: 'Serviços Aprovados', active: false, path: null },
  { icon: Send, label: 'Serviços Enviados', active: false, path: null },
  { icon: PackageCheck, label: 'Serviços Entregues', active: false, path: null },
  { icon: Wrench, label: 'Ferramentas', active: false, path: '/ferramentas' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getUserInitials(user: any): string {
  const name = user?.user_metadata?.full_name;
  if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
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

interface Vaga {
  id: string;
  title: string;
  platform: string;
  tag: string;
  tag_color: string;
  price: number;
  author_name: string;
  author_role: string;
  image_url: string | null;
}

interface Proposta {
  id: string;
  client_name: string;
  client_date: string | null;
  tag: string;
  tag_color: string;
  description: string;
  status: string;
}

interface UserStat {
  period_label: string;
  period_value: number;
}

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [stats, setStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);
  const firstName = getUserFirstName(user);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [vagasRes, propostasRes, statsRes] = await Promise.all([
        supabase.from('vagas').select('*').order('created_at', { ascending: false }).limit(6),
        supabase.from('propostas').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('user_stats').select('period_label, period_value').order('created_at', { ascending: true }),
      ]);

      if (vagasRes.data) setVagas(vagasRes.data);
      if (propostasRes.data) setPropostas(propostasRes.data);
      if (statsRes.data && statsRes.data.length > 0) {
        setStats(statsRes.data);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const filteredVagas = searchQuery
    ? vagas.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : vagas;

  const vagasCount = vagas.length;
  const propostasCount = propostas.length;
  const progressPercent = vagasCount > 0 ? Math.min(Math.round((propostasCount / vagasCount) * 100), 100) : 0;

  return (
    <div className="flex h-screen" style={{ background: '#F8F9FC' }}>
      {/* LEFT SIDEBAR */}
      <aside className="w-[240px] shrink-0 flex flex-col justify-between py-6 px-4 max-lg:hidden border-r border-[#E8ECF4]" style={{ background: '#ffffff' }}>
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#29B2FE' }}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-[#111111] leading-tight">{displayName}</p>
              <p className="text-[11px] font-body text-[#9CA3B4]">Plataforma de Serviços</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => link.path && navigate(link.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-colors ${
                  link.active ? 'text-[#29B2FE]' : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#f3f4f6]'
                }`}
                style={link.active ? { background: 'rgba(41,178,254,0.08)', border: '1px solid rgba(41,178,254,0.2)' } : undefined}
              >
                <link.icon size={18} />
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-[#6B7280] hover:text-[#111111] hover:bg-[#f3f4f6] transition-colors">
            <Settings size={18} /> Configurações
          </button>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
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
              {propostasCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
            </button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#2563eb' }}>
                {initials}
              </div>
              <span className="text-sm font-body font-medium text-[#1A1D26] max-md:hidden">{displayName}</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-[#9CA3B4]" />
            </div>
          ) : (
            <div className="flex max-xl:flex-col">
              {/* CENTER COLUMN */}
              <div className="flex-1 p-6 space-y-6">
                {/* Banner */}
                <div className="relative rounded-2xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), #a78bfa)', minHeight: '180px' }}>
                  <div className="relative z-10 max-w-md">
                    <p className="text-xs font-body font-medium text-white/70 uppercase tracking-wider mb-1">Plataforma de Freelancers</p>
                    <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-white leading-tight mb-4">
                      Encontre as Melhores Vagas de Freelancer
                    </h2>
                    <button className="flex items-center gap-2 bg-white text-[#1A1D26] font-body font-medium text-sm px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors">
                      Marketplace <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-20 bg-white max-md:hidden" />
                  <div className="absolute right-20 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full opacity-10 bg-white max-md:hidden" />
                </div>

                {/* Category counts from real data */}
                <div className="flex gap-4 overflow-x-auto pb-1">
                  {[
                    { name: 'Dev & Tecnologia', icon: '💻', color: 'hsl(var(--primary))', count: vagas.filter(v => v.tag === 'DEV & TECH').length },
                    { name: 'Design & Criação', icon: '🎨', color: '#a78bfa', count: vagas.filter(v => v.tag === 'DESIGN').length },
                    { name: 'Marketing Digital', icon: '📈', color: '#38bdf8', count: vagas.filter(v => v.tag === 'MARKETING').length },
                  ].map((cat) => (
                    <div key={cat.name} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-[#E8ECF4] min-w-[200px]">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${cat.color}15` }}>
                        {cat.icon}
                      </div>
                      <div>
                        <p className="text-[11px] font-body text-[#9CA3B4]">{cat.count} vagas</p>
                        <p className="text-sm font-body font-medium text-[#1A1D26]">{cat.name}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vagas Recentes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold text-lg text-[#1A1D26]">
                      Vagas Recentes {vagasCount > 0 && <span className="text-sm font-body font-normal text-[#9CA3B4]">({vagasCount})</span>}
                    </h3>
                  </div>
                  {filteredVagas.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#E8ECF4] p-12 text-center">
                      <p className="font-body text-[#9CA3B4]">
                        {searchQuery ? 'Nenhuma vaga encontrada para essa busca.' : 'Nenhuma vaga disponível no momento.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {filteredVagas.slice(0, 3).map((vaga) => (
                        <div key={vaga.id} className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden group hover:shadow-lg transition-shadow">
                          <div className="relative h-36 overflow-hidden">
                            {vaga.image_url && <img src={vaga.image_url} alt={vaga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                            <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-[#9CA3B4] hover:text-red-500 transition-colors">
                              <Heart size={14} />
                            </button>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: vaga.tag_color, background: `${vaga.tag_color}15` }}>{vaga.tag}</span>
                              <span className="text-[10px] font-body text-[#9CA3B4]">{vaga.platform}</span>
                            </div>
                            <h4 className="font-body font-semibold text-sm text-[#1A1D26] leading-snug mb-3 line-clamp-2">{vaga.title}</h4>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2563eb] to-[#60a5fa] flex items-center justify-center text-white text-[9px] font-bold">
                                  {vaga.author_name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="text-xs font-body font-medium text-[#1A1D26] leading-tight">{vaga.author_name}</p>
                                  <p className="text-[10px] font-body text-[#9CA3B4]">{vaga.author_role}</p>
                                </div>
                              </div>
                              <span className="text-sm font-heading font-bold" style={{ color: '#2563eb' }}>
                                R$ {Number(vaga.price).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suas Propostas */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold text-lg text-[#1A1D26]">
                      Suas Propostas {propostasCount > 0 && <span className="text-sm font-body font-normal text-[#9CA3B4]">({propostasCount})</span>}
                    </h3>
                  </div>
                  {propostas.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#E8ECF4] p-12 text-center">
                      <p className="font-body text-[#9CA3B4]">Você ainda não enviou nenhuma proposta.</p>
                      <p className="font-body text-xs text-[#9CA3B4] mt-1">Explore as vagas acima e candidate-se!</p>
                    </div>
                  ) : (
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
                          {propostas.map((row) => (
                            <tr key={row.id} className="border-b border-[#E8ECF4] last:border-0">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563eb] to-[#60a5fa] flex items-center justify-center text-white text-[10px] font-bold">
                                    {row.client_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-body font-medium text-[#1A1D26]">{row.client_name}</p>
                                    {row.client_date && <p className="text-[11px] font-body text-[#9CA3B4]">{row.client_date}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-[10px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: row.tag_color, background: `${row.tag_color}15` }}>{row.tag}</span>
                              </td>
                              <td className="px-5 py-3 text-sm font-body text-[#6B7280]">{row.description}</td>
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
                  )}
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
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${progressPercent}, 100`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-heading font-bold text-[#1A1D26]">{progressPercent}%</span>
                      </div>
                    </div>
                    <p className="font-heading font-bold text-lg text-[#1A1D26]">{getGreeting()}, {firstName} 🔥</p>
                    <p className="text-xs font-body text-[#9CA3B4] text-center">
                      {propostasCount === 0
                        ? 'Comece explorando as vagas disponíveis!'
                        : `Você enviou ${propostasCount} proposta${propostasCount > 1 ? 's' : ''}. Continue assim!`}
                    </p>
                  </div>

                  {/* Mini bar chart — real stats or empty state */}
                  {stats.length > 0 ? (
                    <div className="flex items-end justify-between gap-3 h-24 mb-2">
                      {stats.map((s) => (
                        <div key={s.period_label} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(s.period_value * 2, 4)}px`, background: s.period_value === Math.max(...stats.map(d => d.period_value)) ? 'hsl(var(--primary))' : '#E8ECF4' }} />
                          <span className="text-[10px] font-body text-[#9CA3B4]">{s.period_label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl p-4 text-center" style={{ background: '#F8F9FC' }}>
                      <p className="text-xs font-body text-[#9CA3B4]">Seus dados de atividade aparecerão aqui conforme você usa a plataforma.</p>
                    </div>
                  )}
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
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563eb] to-[#60a5fa] flex items-center justify-center text-white text-[10px] font-bold">{p.name.substring(0, 2).toUpperCase()}</div>
                          <div>
                            <p className="text-sm font-body font-medium text-[#1A1D26]">{p.name}</p>
                            <p className="text-[11px] font-body text-[#9CA3B4]">{p.role}</p>
                          </div>
                        </div>
                        <button className="text-[11px] font-body font-medium px-3 py-1 rounded-full" style={{ color: 'var(--blue)', background: 'rgba(37,99,235,0.08)' }}>{p.status}</button>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2.5 rounded-xl text-sm font-body font-medium transition-colors" style={{ background: 'var(--blue)', color: 'white' }}>Ver Todas</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
