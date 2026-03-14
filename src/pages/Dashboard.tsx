import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Home, Globe, Briefcase,
  CheckCircle, Send, PackageCheck, Wrench,
  Settings, LogOut, Search, Bell, ChevronRight, ChevronDown,
  Loader2, ShoppingBag, Megaphone, Users, MessageSquare,
  TrendingUp, TrendingDown, ExternalLink, Eye, FileText, DollarSign, UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import ProfileDropdown from '@/components/ProfileDropdown';

const plataformas = [
  { name: 'Workana', role: 'Plataforma de Serviços', status: 'Conectado' },
  { name: 'GetNinjas', role: 'Plataforma de Serviços', status: 'Conectado' },
  { name: '99Freelas', role: 'Plataforma de Serviços', status: 'Conectado' },
];

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
  created_at: string;
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

interface ClientMetric {
  project_value: number | null;
  created_at: string;
}

interface MessageMetric {
  created_at: string;
}

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState('Semanal');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isActive, planLabel, loading: planLoading } = usePlanStatus();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileTriggerRef = useRef<HTMLDivElement>(null);

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [clientsData, setClientsData] = useState<ClientMetric[]>([]);
  const [messagesData, setMessagesData] = useState<MessageMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);
  const firstName = getUserFirstName(user);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);
      const [vagasRes, propostasRes, clientsRes, messagesRes] = await Promise.all([
        supabase.from('vagas').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('propostas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('clients').select('project_value, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('messages').select('created_at').eq('sender_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (vagasRes.data) setVagas(vagasRes.data);
      if (propostasRes.data) setPropostas(propostasRes.data);
      if (clientsRes.data) setClientsData(clientsRes.data as ClientMetric[]);
      if (messagesRes.data) setMessagesData(messagesRes.data as MessageMetric[]);

      setLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleGoHome = () => {
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

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (selectedView === 'Últimas 24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (selectedView === 'Semanal') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (selectedView === 'Mensal') return new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }, [selectedView]);

  const firstClientDate = useMemo(() => {
    if (clientsData.length === 0) return null;
    return clientsData.reduce((min, client) => {
      const current = new Date(client.created_at);
      return current < min ? current : min;
    }, new Date(clientsData[0].created_at));
  }, [clientsData]);

  const annualCalculable = useMemo(() => {
    if (selectedView !== 'Anual') return true;
    if (!firstClientDate) return false;

    const now = new Date();
    const monthsDiff = (now.getFullYear() - firstClientDate.getFullYear()) * 12 + (now.getMonth() - firstClientDate.getMonth());
    return monthsDiff >= 11;
  }, [selectedView, firstClientDate]);

  const isAnnualUnavailable = selectedView === 'Anual' && !annualCalculable;

  const clientsInRange = useMemo(
    () => clientsData.filter((client) => new Date(client.created_at) >= rangeStart),
    [clientsData, rangeStart]
  );

  const receitaSelecionada = useMemo(
    () => clientsInRange.reduce((acc, client) => acc + Number(client.project_value || 0), 0),
    [clientsInRange]
  );

  const clientesAtivos = clientsInRange.length;

  const messagesSentCount = useMemo(
    () => messagesData.filter((msg) => new Date(msg.created_at) >= rangeStart).length,
    [messagesData, rangeStart]
  );

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const chartData = useMemo(() => {
    const now = new Date();

    if (selectedView === 'Mensal') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const data = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`,
        faturamento: 0,
        clientes: 0,
      }));

      clientsData.forEach((client) => {
        const d = new Date(client.created_at);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          const dayIndex = d.getDate() - 1;
          data[dayIndex].faturamento += Number(client.project_value || 0);
          data[dayIndex].clientes += 1;
        }
      });

      return data;
    }

    if (selectedView === 'Semanal') {
      const data = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 6 + i);
        return {
          name: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
          key: d.toDateString(),
          faturamento: 0,
          clientes: 0,
        };
      });

      clientsData.forEach((client) => {
        const d = new Date(client.created_at);
        const key = d.toDateString();
        const bucket = data.find((item) => item.key === key);
        if (bucket) {
          bucket.faturamento += Number(client.project_value || 0);
          bucket.clientes += 1;
        }
      });

      return data;
    }

    if (selectedView === 'Últimas 24h') {
      const data = Array.from({ length: 6 }, (_, i) => {
        const end = new Date(now.getTime() - (5 - i) * 4 * 60 * 60 * 1000);
        const start = new Date(end.getTime() - 4 * 60 * 60 * 1000);
        return {
          name: `${end.getHours().toString().padStart(2, '0')}h`,
          start,
          end,
          faturamento: 0,
          clientes: 0,
        };
      });

      clientsData.forEach((client) => {
        const d = new Date(client.created_at);
        const bucket = data.find((item) => d > item.start && d <= item.end);
        if (bucket) {
          bucket.faturamento += Number(client.project_value || 0);
          bucket.clientes += 1;
        }
      });

      return data;
    }

    const data = monthLabels.map((label, idx) => ({
      name: label,
      monthIndex: idx,
      faturamento: 0,
      clientes: 0,
    }));

    clientsData.forEach((client) => {
      const d = new Date(client.created_at);
      if (d >= rangeStart) {
        const month = d.getMonth();
        data[month].faturamento += Number(client.project_value || 0);
        data[month].clientes += 1;
      }
    });

    return data;
  }, [clientsData, selectedView, rangeStart]);

  const views = ['Últimas 24h', 'Semanal', 'Mensal', 'Anual'];

  const periodoLabel = selectedView === 'Últimas 24h'
    ? 'últimas 24h'
    : selectedView === 'Semanal'
      ? 'últimos 7 dias'
      : selectedView === 'Mensal'
        ? 'mês atual'
        : 'últimos 12 meses';

  const kpiCards = [
    {
      label: 'Vagas Disponíveis',
      value: vagasCount.toString(),
      change: '+12%',
      positive: true,
      subtitle: 'base total',
      icon: Briefcase,
      iconBg: 'hsl(200, 95%, 57%)',
    },
    {
      label: `Mensagens (${selectedView})`,
      value: messagesSentCount.toString(),
      change: '+18%',
      positive: true,
      subtitle: periodoLabel,
      icon: Send,
      iconBg: 'hsl(142, 71%, 45%)',
    },
    {
      label: `Lucro (${selectedView})`,
      value: formatCurrency(receitaSelecionada),
      change: '+24%',
      positive: true,
      subtitle: periodoLabel,
      icon: DollarSign,
      iconBg: 'hsl(200, 95%, 57%)',
    },
    {
      label: `Clientes (${selectedView})`,
      value: clientesAtivos.toString(),
      change: '+11%',
      positive: true,
      subtitle: periodoLabel,
      icon: UserCheck,
      iconBg: 'hsl(262, 83%, 68%)',
    },
  ];

  return (
    <div className="flex h-screen" style={{ background: '#f8f9fc' }}>
      {/* LEFT SIDEBAR */}
      <aside className="w-[240px] shrink-0 flex flex-col justify-between py-6 px-4 max-lg:hidden border-r border-[#edf0f7]" style={{ background: '#ffffff' }}>
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <svg
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}
            >
              <rect width="40" height="40" rx="9" fill="#29B2FE" />
              <text
                x="50%"
                y="54%"
                dominantBaseline="central"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontWeight="800"
                fontSize="22"
                fill="white"
              >
                M
              </text>
            </svg>
            <span className="font-heading font-extrabold text-lg text-[#111] tracking-tight">Markfy</span>
          </div>

          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => {
              const isActive = link.path === location.pathname;
              return (
                <button
                  key={link.label}
                  onClick={() => link.path && navigate(link.path)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-colors ${
                    isActive ? 'text-[#29B2FE]' : 'text-[#6B7280] hover:text-[#111] hover:bg-[#f3f4f6]'
                  }`}
                  style={isActive ? { background: 'rgba(41,178,254,0.08)', border: '1px solid rgba(41,178,254,0.2)' } : undefined}
                >
                  <link.icon size={18} />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <div className="border-t border-[#E8ECF4] my-2"></div>
          
          <button onClick={handleGoHome} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-[#6B7280] hover:text-[#111111] hover:bg-[#f3f4f6] transition-colors">
            <Home size={18} /> Página Inicial
          </button>

          <div className="relative mt-2" ref={profileTriggerRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#E8ECF4] px-3 py-2.5 hover:bg-[#f3f4f6] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#29B2FE] to-[#0077cc] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-[#111] truncate leading-tight">{displayName}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{user?.email}</p>
              </div>
            </button>

            <ProfileDropdown
              open={profileDropdownOpen}
              onClose={() => setProfileDropdownOpen(false)}
              anchorRef={profileTriggerRef}
            />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 shrink-0 bg-white border-b border-[#edf0f7] flex items-center justify-between px-6">
          <div>
            <h1 className="font-heading font-bold text-xl text-[#111]">Dashboard</h1>
            <p className="text-xs font-body text-[#9CA3B4]">{getGreeting()}, {firstName}!</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3B4]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 pr-16 py-2 rounded-xl border border-[#edf0f7] bg-[#f8f9fc] text-sm font-body text-[#111] placeholder:text-[#9CA3B4] focus:outline-none focus:ring-2 focus:ring-[#29B2FE]/30 w-[240px]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-body text-[#9CA3B4] bg-white border border-[#edf0f7] px-1.5 py-0.5 rounded">⌘ K</span>
            </div>

            {/* Notification */}
            <button className="relative w-9 h-9 rounded-xl border border-[#edf0f7] flex items-center justify-center text-[#6B7280] hover:text-[#111] hover:bg-[#f8f9fc] transition-colors">
              <Bell size={18} />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#29B2FE] to-[#0077cc] flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-body font-medium text-[#111] leading-tight">{firstName}</p>
                <p className="text-[10px] font-body font-semibold" style={{ color: isActive ? '#29B2FE' : planLabel === 'Expirado' ? '#ef4444' : '#9ca3af' }}>
                  {isActive ? `• ${planLabel}` : planLabel === 'Expirado' ? '• Expirado' : '• Gratuito'}
                </p>
              </div>
              <ChevronDown size={14} className="text-[#9CA3B4] hidden md:block" />
            </div>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-[#9CA3B4]" />
            </div>
          ) : (
            <div className="space-y-6 max-w-[1200px] mx-auto">
              {/* VIEW TABS */}
              <div className="flex items-center gap-1">
                <span className="text-sm font-body font-medium text-[#9CA3B4] mr-2">Visualizar</span>
                <ChevronRight size={14} className="text-[#9CA3B4] mr-2" />
                {views.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedView(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
                      selectedView === v
                        ? 'text-[#29B2FE] border-b-2 border-[#29B2FE] bg-transparent'
                        : 'text-[#6B7280] hover:text-[#111]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpiCards.map((card) => (
                  <div key={card.label} className="bg-white rounded-2xl border border-[#edf0f7] p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.iconBg}15` }}>
                        <card.icon size={20} style={{ color: card.iconBg }} />
                      </div>
                      <span className="text-sm font-body font-medium text-[#6B7280]">{card.label}</span>
                    </div>
                    <div className="flex items-end gap-3">
                      <p className="text-2xl font-heading font-bold text-[#111]">{card.value}</p>
                      <div className="flex items-center gap-1 mb-1">
                        {card.positive ? (
                          <TrendingUp size={14} className="text-emerald-500" />
                        ) : (
                          <TrendingDown size={14} className="text-red-500" />
                        )}
                        <span className={`text-xs font-body font-medium ${card.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                          {card.change}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] font-body text-[#9CA3B4] mt-1">{card.subtitle}</p>
                  </div>
                ))}
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Bar Chart - Desempenho */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-[#edf0f7] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading font-bold text-base text-[#111]">Faturamento e Clientes ({selectedView})</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-6">
                        {[
                          { label: 'Faturamento', color: '#29B2FE' },
                          { label: 'Clientes', color: '#10b981' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                            <span className="text-xs font-body text-[#6B7280]">{item.label}</span>
                          </div>
                        ))}
                      </div>
                      <button className="flex items-center gap-1 text-xs font-body text-[#6B7280] border border-[#edf0f7] px-3 py-1.5 rounded-lg hover:bg-[#f8f9fc] transition-colors">
                        {selectedView} <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} barGap={2} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value: number, name: string) =>
                          name === 'faturamento'
                            ? [formatCurrency(Number(value)), 'Faturamento']
                            : [Number(value), 'Clientes']
                        }
                        contentStyle={{
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          fontSize: 12,
                        }}
                      />
                      <Bar yAxisId="left" dataKey="faturamento" fill="#29B2FE" radius={[4, 4, 0, 0]} name="faturamento" />
                      <Bar yAxisId="right" dataKey="clientes" fill="#10b981" radius={[4, 4, 0, 0]} name="clientes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Plataformas Card */}
                <div className="bg-white rounded-2xl border border-[#edf0f7] p-6">
                  <h3 className="font-heading font-bold text-base text-[#111] mb-5">Plataformas Conectadas</h3>
                  <div className="flex flex-col gap-4">
                    {plataformas.map((p) => (
                      <div key={p.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#29B2FE] to-[#0077cc] flex items-center justify-center text-white text-[10px] font-bold">
                            {p.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-body font-medium text-[#111]">{p.name}</p>
                            <p className="text-[11px] font-body text-[#9CA3B4]">{p.role}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-body font-medium px-3 py-1 rounded-full" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Métricas inline */}
                  <div className="mt-6 pt-5 border-t border-[#edf0f7] space-y-3">
                    {[
                      { label: `Lucro (${selectedView})`, value: formatCurrency(receitaSelecionada), iconComponent: DollarSign },
                      { label: `Clientes (${selectedView})`, value: clientesAtivos.toString(), iconComponent: UserCheck },
                      { label: `Mensagens (${selectedView})`, value: messagesSentCount.toString(), iconComponent: MessageSquare },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <m.iconComponent size={16} className="text-[#9CA3B4]" />
                          <span className="text-xs font-body text-[#6B7280]">{m.label}</span>
                        </div>
                        <span className="text-sm font-heading font-bold text-[#111]">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TABLES ROW */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Propostas Recentes */}
                <div className="bg-white rounded-2xl border border-[#edf0f7] overflow-hidden">
                  <div className="flex items-center justify-between p-5 pb-0">
                    <h3 className="font-heading font-bold text-base text-[#111]">Propostas Recentes</h3>
                    <button className="flex items-center gap-1 text-xs font-body text-[#29B2FE] hover:underline">
                      Ver Detalhes <ExternalLink size={12} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#edf0f7]">
                          <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Cliente</th>
                          <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Categoria</th>
                          <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Data</th>
                          <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {propostas.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-sm font-body text-[#9CA3B4]">
                              Nenhuma proposta enviada ainda.
                            </td>
                          </tr>
                        ) : (
                          propostas.slice(0, 4).map((row) => (
                            <tr key={row.id} className="border-b border-[#edf0f7] last:border-0 hover:bg-[#f8f9fc] transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#29B2FE] to-[#0077cc] flex items-center justify-center text-white text-[10px] font-bold">
                                    {row.client_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <p className="text-sm font-body font-medium text-[#111]">{row.client_name}</p>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-[10px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: row.tag_color, background: `${row.tag_color}15` }}>
                                  {row.tag}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-xs font-body text-[#6B7280]">{row.client_date || '—'}</td>
                              <td className="px-5 py-3">
                                <button className="text-xs font-body font-medium px-3 py-1.5 rounded-lg" style={{ background: '#29B2FE', color: 'white' }}>
                                  Ver Detalhe
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vagas Recentes */}
                <div className="bg-white rounded-2xl border border-[#edf0f7] overflow-hidden">
                  <div className="flex items-center justify-between p-5 pb-0">
                    <h3 className="font-heading font-bold text-base text-[#111]">Vagas Recentes</h3>
                    <button onClick={() => navigate('/marketplace')} className="flex items-center gap-1 text-xs font-body text-[#29B2FE] hover:underline">
                      Ver Mais <ExternalLink size={12} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#edf0f7]">
                          <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Vaga</th>
                          <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Valor</th>
                          <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Plataforma</th>
                          <th className="text-left text-[11px] font-body font-medium text-[#9CA3B4] uppercase tracking-wider px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vagas.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-sm font-body text-[#9CA3B4]">
                              Nenhuma vaga disponível.
                            </td>
                          </tr>
                        ) : (
                          vagas.slice(0, 4).map((vaga) => (
                            <tr key={vaga.id} className="border-b border-[#edf0f7] last:border-0 hover:bg-[#f8f9fc] transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${vaga.tag_color}15` }}>
                                    <Briefcase size={14} style={{ color: vaga.tag_color }} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-body font-medium text-[#111] line-clamp-1 max-w-[180px]">{vaga.title}</p>
                                    <p className="text-[10px] font-body text-[#9CA3B4]">{vaga.tag}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm font-heading font-bold text-[#111]">
                                R$ {Number(vaga.price).toLocaleString('pt-BR')}
                              </td>
                              <td className="px-5 py-3 text-xs font-body text-[#6B7280]">{vaga.platform}</td>
                              <td className="px-5 py-3">
                                <span className="text-[10px] font-body font-medium px-2.5 py-1 rounded-full" style={{ color: '#29B2FE', background: 'rgba(41,178,254,0.08)' }}>
                                  DISPONÍVEL
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
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
