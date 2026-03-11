import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Home, Globe, Briefcase,
  CheckCircle, Send, PackageCheck, Wrench,
  Settings, LogOut, Search, Bell, Mail,
  Clock, ExternalLink, RefreshCw, Filter,
  ArrowUpDown, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const sidebarLinks = [
  { icon: Home, label: 'Início', active: false, path: '/dashboard' },
  { icon: Briefcase, label: 'Explorar', active: false, path: '/explorar' },
  { icon: Globe, label: 'Marketplace', active: true, path: '/marketplace' },
  { icon: CheckCircle, label: 'Serviços Aprovados', active: false, path: null },
  { icon: Send, label: 'Serviços Enviados', active: false, path: null },
  { icon: PackageCheck, label: 'Serviços Entregues', active: false, path: null },
  { icon: Wrench, label: 'Ferramentas', active: false, path: '/ferramentas' },
];

function getUserInitials(user: any): string {
  const name = user?.user_metadata?.full_name;
  if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (user?.email?.[0] || 'U').toUpperCase();
}

function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
}

interface FreelancerJob {
  id: number;
  title: string;
  seo_url: string;
  preview_description: string;
  submitdate: number;
  budget: {
    minimum: number;
    maximum: number;
    currency_id: number;
  };
  currency: {
    code: string;
    sign: string;
  };
  bid_stats: {
    bid_count: number;
  };
  time_submitted: number;
  time_updated: number;
  jobs: { name: string; id: number }[];
  type: string;
}

type FilterTab = 'all' | 'dev' | 'mobile' | 'marketing' | 'video' | 'design';
type SortOption = 'newest' | 'budget_desc' | 'bids_asc';

const filterTabs: { key: FilterTab; label: string; jobIds: number[] }[] = [
  { key: 'all', label: 'Todos', jobIds: [] },
  { key: 'dev', label: 'Dev & Programação', jobIds: [3, 2, 17, 59, 119, 7] },
  { key: 'mobile', label: 'Apps Mobile', jobIds: [9, 671] },
  { key: 'marketing', label: 'Marketing', jobIds: [162, 104, 153] },
  { key: 'video', label: 'Edição de Vídeo', jobIds: [582] },
  { key: 'design', label: 'Design', jobIds: [13, 14, 15, 20] },
];

function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function formatBudget(budget: FreelancerJob['budget'], currency?: FreelancerJob['currency']): string {
  const sign = currency?.sign || '$';
  if (budget.minimum === budget.maximum) {
    return `${sign}${budget.minimum.toLocaleString()}`;
  }
  return `${sign}${budget.minimum.toLocaleString()} - ${sign}${budget.maximum.toLocaleString()}`;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  const [jobs, setJobs] = useState<FreelancerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('freelancer-jobs', {
        body: { limit: 50, offset: 0 },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch');

      const projects = data.data?.projects || [];
      setJobs(projects);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Filter by tab
    if (activeFilter !== 'all') {
      const tab = filterTabs.find(t => t.key === activeFilter);
      if (tab) {
        result = result.filter(job =>
          job.jobs?.some(j => tab.jobIds.includes(j.id))
        );
      }
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.preview_description?.toLowerCase().includes(q) ||
        j.jobs?.some(s => s.name.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'budget_desc') {
      result.sort((a, b) => (b.budget?.maximum || 0) - (a.budget?.maximum || 0));
    } else if (sortBy === 'bids_asc') {
      result.sort((a, b) => (a.bid_stats?.bid_count || 0) - (b.bid_stats?.bid_count || 0));
    } else {
      result.sort((a, b) => (b.time_submitted || b.submitdate || 0) - (a.time_submitted || a.submitdate || 0));
    }

    return result;
  }, [jobs, activeFilter, searchQuery, sortBy]);

  const lastRefreshLabel = lastRefresh
    ? `Atualizado ${lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <div className="flex h-screen" style={{ background: '#F8F9FC' }}>
      {/* LEFT SIDEBAR */}
      <aside className="w-[240px] shrink-0 flex flex-col justify-between py-6 px-4 max-lg:hidden border-r border-[#E8ECF4]" style={{ background: '#ffffff' }}>
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#e85d26' }}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-[#111111] leading-tight">{displayName}</p>
              <p className="text-[11px] font-body text-[#9CA3B4]">Marketplace Global</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => link.path && navigate(link.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-colors ${
                  link.active ? 'text-[#e85d26]' : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#f3f4f6]'
                }`}
                style={link.active ? { background: 'rgba(232,93,38,0.08)', border: '1px solid rgba(232,93,38,0.2)' } : undefined}
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
                placeholder="Buscar vagas no marketplace..."
                className="bg-transparent text-sm font-body text-[#1A1D26] outline-none flex-1 placeholder:text-[#9CA3B4]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastRefreshLabel && (
              <span className="text-[11px] font-body text-[#9CA3B4] flex items-center gap-1.5 max-md:hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {lastRefreshLabel}
              </span>
            )}
            <button
              onClick={() => fetchJobs(true)}
              disabled={refreshing}
              className="w-9 h-9 rounded-full bg-[#F3F4F8] flex items-center justify-center text-[#6B7280] hover:text-[#1A1D26] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button className="w-9 h-9 rounded-full bg-[#F3F4F8] flex items-center justify-center text-[#6B7280] hover:text-[#1A1D26] transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#e85d26' }}>
                {initials}
              </div>
              <span className="text-sm font-body font-medium text-[#1A1D26] max-md:hidden">{displayName}</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg, #0077b5, #00a6ff)', minHeight: '160px' }}>
              <div className="relative z-10 max-w-lg">
                <p className="text-xs font-body font-medium text-white/70 uppercase tracking-wider mb-1">Marketplace Global</p>
                <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-white leading-tight mb-2">
                  Vagas em Tempo Real do Freelancer.com
                </h2>
                <p className="text-sm font-body text-white/80 mb-3">
                  Encontre projetos internacionais atualizados automaticamente
                </p>
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 backdrop-blur text-white text-sm font-body font-medium px-4 py-2 rounded-full">
                    {jobs.length} vagas disponíveis
                  </span>
                  {lastRefreshLabel && (
                    <span className="bg-white/10 backdrop-blur text-white/80 text-xs font-body px-3 py-1.5 rounded-full">
                      {lastRefreshLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-15 bg-white max-md:hidden" />
            </div>

            {/* Filter Tabs + Sort */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-body font-medium whitespace-nowrap transition-all ${
                      activeFilter === tab.key
                        ? 'text-white shadow-md'
                        : 'text-[#6B7280] bg-white border border-[#E8ECF4] hover:border-[#0077b5]/30 hover:text-[#0077b5]'
                    }`}
                    style={activeFilter === tab.key ? { background: '#0077b5' } : undefined}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-[#9CA3B4]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm font-body font-medium text-[#6B7280] bg-transparent outline-none cursor-pointer border border-[#E8ECF4] rounded-lg px-3 py-1.5 hover:border-[#0077b5]/30 transition-colors"
                >
                  <option value="newest">Mais recentes</option>
                  <option value="budget_desc">Maior orçamento</option>
                  <option value="bids_asc">Menos propostas</option>
                </select>
              </div>
            </div>

            {/* Error State */}
            {error && !loading && (
              <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <Globe size={24} className="text-amber-500" />
                </div>
                <p className="font-heading font-bold text-lg text-[#1A1D26] mb-2">Não foi possível carregar as vagas</p>
                <p className="font-body text-sm text-[#9CA3B4] mb-5 max-w-md mx-auto">
                  Configure a chave de API do Freelancer.com nas configurações para carregar vagas em tempo real.
                </p>
                <button
                  onClick={() => fetchJobs()}
                  className="text-sm font-body font-semibold px-6 py-2.5 rounded-full text-white transition-all hover:brightness-110"
                  style={{ background: '#0077b5' }}
                >
                  Tentar novamente
                </button>
                {/* Skeleton placeholders */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-[#F8F9FC] rounded-2xl p-5 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-10 w-full rounded-xl mt-3" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E8ECF4] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-4 w-14" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-11 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            )}

            {/* Jobs Grid */}
            {!loading && !error && (
              <>
                <p className="text-sm font-body text-[#9CA3B4]">
                  {filteredJobs.length} {filteredJobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
                </p>

                {filteredJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E8ECF4] p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#F3F4F8] flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-[#9CA3B4]" />
                    </div>
                    <p className="font-heading font-bold text-lg text-[#1A1D26] mb-1">Nenhuma vaga encontrada</p>
                    <p className="font-body text-sm text-[#9CA3B4]">
                      Tente ajustar os filtros ou buscar por outro termo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden group hover:scale-[1.01] transition-all duration-300 hover:shadow-lg hover:border-[#0077b5]/20 flex flex-col"
                      >
                        <div className="p-5 flex flex-col flex-1">
                          {/* Header: platform + time */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-body font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white" style={{ background: '#0077b5' }}>
                              Freelancer
                            </span>
                            <span className="text-[11px] font-body text-[#9CA3B4] flex items-center gap-1">
                              <Clock size={11} />
                              {timeAgo(job.time_submitted || job.submitdate)}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-heading font-bold text-[15px] text-[#1A1D26] leading-snug mb-2 line-clamp-2">
                            {job.title}
                          </h4>

                          {/* Description */}
                          <p className="text-xs font-body text-[#9CA3B4] mb-3 line-clamp-3 flex-1">
                            {job.preview_description?.slice(0, 120)}
                            {(job.preview_description?.length || 0) > 120 ? '...' : ''}
                          </p>

                          {/* Skills */}
                          {job.jobs && job.jobs.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {job.jobs.slice(0, 4).map((skill) => (
                                <span
                                  key={skill.id}
                                  className="text-[10px] font-body font-medium px-2 py-0.5 rounded-md bg-[#F3F4F8] text-[#6B7280]"
                                >
                                  {skill.name}
                                </span>
                              ))}
                              {job.jobs.length > 4 && (
                                <span className="text-[10px] font-body text-[#9CA3B4]">
                                  +{job.jobs.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Divider */}
                          <div className="border-t border-[#E8ECF4] pt-3 mt-auto">
                            {/* Budget + Bids */}
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-[10px] font-body text-[#9CA3B4] uppercase tracking-wider mb-0.5">Orçamento</p>
                                <p className="text-lg font-heading font-extrabold" style={{ color: '#0077b5' }}>
                                  {job.budget ? formatBudget(job.budget, job.currency) : 'A definir'}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-[#9CA3B4]">
                                  <Users size={12} />
                                  <span className="text-xs font-body font-medium">
                                    {job.bid_stats?.bid_count || 0} propostas
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* CTA */}
                            <a
                              href={`https://www.freelancer.com/projects/${job.seo_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <button className="w-full py-3 rounded-xl text-sm font-body font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                                style={{ background: '#0077b5' }}
                              >
                                <ExternalLink size={14} />
                                Ver Vaga
                              </button>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
