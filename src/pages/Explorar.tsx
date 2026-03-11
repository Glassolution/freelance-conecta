import { useState, useEffect, useMemo } from 'react';
import {
  Home, Globe, Briefcase,
  CheckCircle, Send, PackageCheck, Wrench,
  Settings, LogOut, Search, Bell, Mail,
  Heart, ChevronRight, Loader2, SlidersHorizontal,
  ArrowUpDown, X, Clock, ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

const sidebarLinks = [
  { icon: Home, label: 'Início', active: false, path: '/dashboard' },
  { icon: Briefcase, label: 'Explorar', active: true, path: '/explorar' },
  { icon: Globe, label: 'Criador.ia', active: false, path: null },
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
  url: string | null;
}

const Explorar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchVagas = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('vagas')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setVagas(data);
      setLoading(false);
    };
    fetchVagas();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Derive unique categories and platforms from data
  const categories = useMemo(() => {
    const map = new Map<string, { color: string; count: number }>();
    vagas.forEach((v) => {
      const existing = map.get(v.tag);
      if (existing) {
        existing.count++;
      } else {
        map.set(v.tag, { color: v.tag_color, count: 1 });
      }
    });
    return Array.from(map.entries()).map(([name, info]) => ({ name, color: info.color, count: info.count }));
  }, [vagas]);

  const platforms = useMemo(() => {
    const map = new Map<string, number>();
    vagas.forEach((v) => {
      map.set(v.platform, (map.get(v.platform) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [vagas]);

  // Filtered + sorted vagas
  const filteredVagas = useMemo(() => {
    let result = [...vagas];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.tag.toLowerCase().includes(q) ||
          v.platform.toLowerCase().includes(q) ||
          v.author_name.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((v) => selectedCategories.includes(v.tag));
    }

    // Platform filter
    if (selectedPlatforms.length > 0) {
      result = result.filter((v) => selectedPlatforms.includes(v.platform));
    }

    // Price filter
    const min = priceMin ? Number(priceMin) : 0;
    const max = priceMax ? Number(priceMax) : Infinity;
    if (priceMin || priceMax) {
      result = result.filter((v) => v.price >= min && v.price <= max);
    }

    // Sort
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }
    // 'newest' is already the default order from Supabase

    return result;
  }, [vagas, searchQuery, selectedCategories, selectedPlatforms, priceMin, priceMax, sortBy]);

  const featuredVagas = vagas.slice(0, 3);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const togglePlatform = (plat: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPlatforms([]);
    setPriceMin('');
    setPriceMax('');
    setSortBy('newest');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedPlatforms.length > 0 || priceMin || priceMax;

  // Filter panel content (reused in sidebar and mobile sheet)
  const filterContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-heading font-bold text-sm text-[#1A1D26] mb-3">Categorias</h3>
        <div className="space-y-2.5">
          {categories.map((cat) => (
            <label key={cat.name} className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                checked={selectedCategories.includes(cat.name)}
                onCheckedChange={() => toggleCategory(cat.name)}
              />
              <span className="text-sm font-body text-[#6B7280] group-hover:text-[#1A1D26] transition-colors flex-1">
                {cat.name}
              </span>
              <span
                className="text-[10px] font-body font-bold px-1.5 py-0.5 rounded"
                style={{ color: cat.color, background: `${cat.color}15` }}
              >
                {cat.count}
              </span>
            </label>
          ))}
          {categories.length === 0 && !loading && (
            <p className="text-xs font-body text-[#9CA3B4]">Nenhuma categoria disponível</p>
          )}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <h3 className="font-heading font-bold text-sm text-[#1A1D26] mb-3">Plataforma</h3>
        <div className="space-y-2.5">
          {platforms.map((plat) => (
            <label key={plat.name} className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                checked={selectedPlatforms.includes(plat.name)}
                onCheckedChange={() => togglePlatform(plat.name)}
              />
              <span className="text-sm font-body text-[#6B7280] group-hover:text-[#1A1D26] transition-colors flex-1">
                {plat.name}
              </span>
              <span className="text-[11px] font-body text-[#9CA3B4]">
                ({plat.count})
              </span>
            </label>
          ))}
          {platforms.length === 0 && !loading && (
            <p className="text-xs font-body text-[#9CA3B4]">Nenhuma plataforma disponível</p>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-heading font-bold text-sm text-[#1A1D26] mb-3">Faixa de Preço</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-body text-[#9CA3B4] uppercase tracking-wider mb-1 block">Mín</label>
            <div className="flex items-center gap-1 bg-[#F3F4F8] rounded-lg px-3 py-2">
              <span className="text-xs font-body text-[#9CA3B4]">R$</span>
              <input
                type="number"
                placeholder="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="bg-transparent text-sm font-body text-[#1A1D26] outline-none w-full"
              />
            </div>
          </div>
          <span className="text-[#9CA3B4] mt-4">—</span>
          <div className="flex-1">
            <label className="text-[10px] font-body text-[#9CA3B4] uppercase tracking-wider mb-1 block">Máx</label>
            <div className="flex items-center gap-1 bg-[#F3F4F8] rounded-lg px-3 py-2">
              <span className="text-xs font-body text-[#9CA3B4]">R$</span>
              <input
                type="number"
                placeholder="50000"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="bg-transparent text-sm font-body text-[#1A1D26] outline-none w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 rounded-xl text-sm font-body font-medium text-[#e85d26] border border-[#e85d26]/20 hover:bg-[#e85d26]/5 transition-colors flex items-center justify-center gap-2"
        >
          <X size={14} />
          Limpar Filtros
        </button>
      )}
    </div>
  );

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
              <p className="text-[11px] font-body text-[#9CA3B4]">Plataforma de Serviços</p>
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
                placeholder="Buscar serviços..."
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
          {loading ? (
            <div className="p-6 space-y-6">
              {/* Skeleton banner */}
              <Skeleton className="w-full h-[180px] rounded-2xl" />
              {/* Skeleton featured */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[420px] rounded-2xl" />
                ))}
              </div>
              {/* Skeleton grid */}
              <div className="flex gap-6">
                <Skeleton className="w-[260px] h-[400px] rounded-2xl shrink-0 max-lg:hidden" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-[420px] rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Featured Banner */}
              <div className="relative rounded-2xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg, #e85d26, #a78bfa)', minHeight: '180px' }}>
                <div className="relative z-10 max-w-lg">
                  <p className="text-xs font-body font-medium text-white/70 uppercase tracking-wider mb-1">Marketplace</p>
                  <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-white leading-tight mb-2">
                    Explore os Melhores Serviços Freelancer
                  </h2>
                  <p className="text-sm font-body text-white/80 mb-4">
                    Encontre profissionais qualificados para o seu projeto
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 backdrop-blur text-white text-sm font-body font-medium px-4 py-2 rounded-full">
                      {vagas.length} serviços disponíveis
                    </span>
                  </div>
                </div>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-20 bg-white max-md:hidden" />
                <div className="absolute right-20 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full opacity-10 bg-white max-md:hidden" />
              </div>

              {/* Featured Vagas */}
              {featuredVagas.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold text-lg text-[#1A1D26]">Destaques</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {featuredVagas.map((vaga) => (
                      <div
                        key={`featured-${vaga.id}`}
                        className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden group hover:scale-[1.02] transition-transform duration-300 hover:shadow-lg"
                      >
                        {/* Image */}
                        <div className="relative h-44 overflow-hidden">
                          {vaga.image_url ? (
                            <img src={vaga.image_url} alt={vaga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e85d26]/10 to-[#a78bfa]/10">
                              <Briefcase size={36} className="text-[#9CA3B4]" />
                            </div>
                          )}
                          <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#9CA3B4] hover:text-red-500 transition-colors">
                            <Heart size={14} />
                          </button>
                          <div className="absolute top-3 left-3 bg-[#e85d26] text-white text-[10px] font-body font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                            Destaque
                          </div>
                        </div>

                        <div className="p-5">
                          {/* Author */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e85d26] to-[#f59e0b] flex items-center justify-center text-white text-[11px] font-bold">
                              {vaga.author_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-body font-semibold text-[#1A1D26] leading-tight">{vaga.author_name}</p>
                              <p className="text-[11px] font-body text-[#9CA3B4]">{vaga.author_role}</p>
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="font-heading font-bold text-base text-[#1A1D26] leading-snug mb-2 line-clamp-2">
                            {vaga.title}
                          </h4>

                          {/* Tag */}
                          <p className="text-xs font-body text-[#9CA3B4] mb-4 line-clamp-2">
                            {vaga.tag} via {vaga.platform}
                          </p>

                          {/* Divider */}
                          <div className="border-t border-[#E8ECF4] pt-4">
                            {/* Price + Delivery */}
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-[10px] font-body text-[#9CA3B4] uppercase tracking-wider mb-0.5">A partir de</p>
                                <p className="text-xl font-heading font-extrabold" style={{ color: '#e85d26' }}>
                                  R$ {Number(vaga.price).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 text-[#9CA3B4]">
                                <Clock size={13} />
                                <span className="text-xs font-body">{Math.max(5, Math.floor(vaga.price / 300))} dias</span>
                              </div>
                            </div>

                            {/* CTA Button */}
                            {vaga.url ? (
                              <a href={vaga.url} target="_blank" rel="noopener noreferrer" className="block">
                                <button className="w-full py-3 rounded-xl text-sm font-body font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                                  style={{ background: '#e85d26' }}
                                >
                                  <ShoppingCart size={15} />
                                  Contratar Serviço
                                </button>
                              </a>
                            ) : (
                              <button disabled className="w-full py-3 rounded-xl text-sm font-body font-semibold text-white/60 flex items-center justify-center gap-2 cursor-not-allowed"
                                style={{ background: '#9CA3B4' }}
                              >
                                Indisponível
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main content: Filters + Grid */}
              <div className="flex gap-6">
                {/* Filter Sidebar - Desktop */}
                <div className="w-[260px] shrink-0 max-lg:hidden">
                  <div className="bg-white rounded-2xl border border-[#E8ECF4] p-5 sticky top-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-heading font-bold text-base text-[#1A1D26] flex items-center gap-2">
                        <SlidersHorizontal size={16} />
                        Filtros
                      </h3>
                      {hasActiveFilters && (
                        <span className="text-[10px] font-body font-bold text-white bg-[#e85d26] rounded-full w-5 h-5 flex items-center justify-center">
                          {selectedCategories.length + selectedPlatforms.length + (priceMin || priceMax ? 1 : 0)}
                        </span>
                      )}
                    </div>
                    {filterContent}
                  </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 min-w-0">
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading font-bold text-lg text-[#1A1D26]">
                        {filteredVagas.length} {filteredVagas.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
                      </h3>

                      {/* Mobile filter trigger */}
                      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                        <SheetTrigger asChild>
                          <button className="lg:hidden flex items-center gap-2 text-sm font-body font-medium px-3 py-2 rounded-xl border border-[#E8ECF4] text-[#6B7280] hover:text-[#1A1D26] hover:border-[#1A1D26]/20 transition-colors relative">
                            <SlidersHorizontal size={14} />
                            Filtros
                            {hasActiveFilters && (
                              <span className="w-2 h-2 rounded-full bg-[#e85d26] absolute -top-0.5 -right-0.5" />
                            )}
                          </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle className="font-heading font-bold text-[#1A1D26] flex items-center gap-2">
                              <SlidersHorizontal size={16} />
                              Filtros
                            </SheetTitle>
                          </SheetHeader>
                          <div className="mt-6">
                            {filterContent}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <ArrowUpDown size={14} className="text-[#9CA3B4]" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-sm font-body font-medium text-[#6B7280] bg-transparent outline-none cursor-pointer border border-[#E8ECF4] rounded-lg px-3 py-1.5 hover:border-[#e85d26]/30 transition-colors"
                      >
                        <option value="newest">Mais recentes</option>
                        <option value="price_asc">Menor preço</option>
                        <option value="price_desc">Maior preço</option>
                      </select>
                    </div>
                  </div>

                  {/* Active filter pills */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedCategories.map((cat) => (
                        <button
                          key={`pill-${cat}`}
                          onClick={() => toggleCategory(cat)}
                          className="flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1.5 rounded-full transition-colors"
                          style={{ color: '#e85d26', background: 'rgba(232,93,38,0.08)' }}
                        >
                          {cat}
                          <X size={12} />
                        </button>
                      ))}
                      {selectedPlatforms.map((plat) => (
                        <button
                          key={`pill-${plat}`}
                          onClick={() => togglePlatform(plat)}
                          className="flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1.5 rounded-full bg-[#F3F4F8] text-[#6B7280] hover:text-[#1A1D26] transition-colors"
                        >
                          {plat}
                          <X size={12} />
                        </button>
                      ))}
                      {(priceMin || priceMax) && (
                        <button
                          onClick={() => { setPriceMin(''); setPriceMax(''); }}
                          className="flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1.5 rounded-full bg-[#F3F4F8] text-[#6B7280] hover:text-[#1A1D26] transition-colors"
                        >
                          R$ {priceMin || '0'} — R$ {priceMax || '...'}
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Card Grid */}
                  {filteredVagas.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#E8ECF4] p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#F3F4F8] flex items-center justify-center mx-auto mb-4">
                        <Search size={24} className="text-[#9CA3B4]" />
                      </div>
                      <p className="font-heading font-bold text-lg text-[#1A1D26] mb-1">Nenhum serviço encontrado</p>
                      <p className="font-body text-sm text-[#9CA3B4] mb-4">
                        Tente ajustar os filtros ou buscar por outro termo.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-sm font-body font-medium px-5 py-2.5 rounded-full transition-colors"
                          style={{ color: 'white', background: '#e85d26' }}
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredVagas.map((vaga) => (
                        <div
                          key={vaga.id}
                          className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden group hover:scale-[1.02] transition-transform duration-300 hover:shadow-lg"
                        >
                          {/* Image */}
                          <div className="relative h-44 overflow-hidden">
                            {vaga.image_url ? (
                              <img src={vaga.image_url} alt={vaga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e85d26]/10 to-[#a78bfa]/10">
                                <Briefcase size={32} className="text-[#9CA3B4]" />
                              </div>
                            )}
                            <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#9CA3B4] hover:text-red-500 transition-colors">
                              <Heart size={14} />
                            </button>
                            <span
                              className="absolute top-3 left-3 text-[10px] font-body font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                              style={{ color: vaga.tag_color, background: `${vaga.tag_color}20`, backdropFilter: 'blur(8px)' }}
                            >
                              {vaga.tag}
                            </span>
                          </div>

                          <div className="p-5">
                            {/* Author */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e85d26] to-[#f59e0b] flex items-center justify-center text-white text-[11px] font-bold">
                                {vaga.author_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-body font-semibold text-[#1A1D26] leading-tight">{vaga.author_name}</p>
                                <p className="text-[11px] font-body text-[#9CA3B4]">{vaga.author_role}</p>
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="font-heading font-bold text-base text-[#1A1D26] leading-snug mb-2 line-clamp-2">
                              {vaga.title}
                            </h4>

                            {/* Platform info */}
                            <p className="text-xs font-body text-[#9CA3B4] mb-4 line-clamp-2">
                              {vaga.tag} via {vaga.platform}
                            </p>

                            {/* Divider */}
                            <div className="border-t border-[#E8ECF4] pt-4">
                              {/* Price + Delivery */}
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <p className="text-[10px] font-body text-[#9CA3B4] uppercase tracking-wider mb-0.5">A partir de</p>
                                  <p className="text-xl font-heading font-extrabold" style={{ color: '#e85d26' }}>
                                    R$ {Number(vaga.price).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-[#9CA3B4]">
                                  <Clock size={13} />
                                  <span className="text-xs font-body">{Math.max(5, Math.floor(vaga.price / 300))} dias</span>
                                </div>
                              </div>

                              {/* CTA Button */}
                              <button className="w-full py-3 rounded-xl text-sm font-body font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                                style={{ background: '#e85d26' }}
                              >
                                <ShoppingCart size={15} />
                                Contratar Serviço
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explorar;
