import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ShoppingBag, Megaphone, Users, MessageSquare, Globe,
  CheckCircle, Send, PackageCheck, Wrench, Settings, LogOut,
  Plus, Eye, FileText, TrendingUp, Pause, Play, Pencil, X,
  Search, Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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

const CATEGORIES = ['Dev & Programação', 'Apps Mobile', 'Marketing', 'Edição de Vídeo', 'Design'];

export interface MarkfyAd {
  id: string;
  title: string;
  category: string;
  description: string;
  skills: string[];
  value: number;
  deadline: number;
  status: 'ativo' | 'pausado';
  views: number;
  createdAt: string;
  proposals: MarkfyProposal[];
}

export interface MarkfyProposal {
  id: string;
  adId: string;
  freelancerName: string;
  text: string;
  value: number;
  deadline: number;
  status: 'pendente' | 'aceita' | 'recusada';
  createdAt: string;
}

function getAds(): MarkfyAd[] {
  try {
    return JSON.parse(localStorage.getItem('markfy_ads') || '[]');
  } catch { return []; }
}

function saveAds(ads: MarkfyAd[]) {
  localStorage.setItem('markfy_ads', JSON.stringify(ads));
}

function getUserInitials(user: any): string {
  const name = user?.user_metadata?.full_name;
  if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (user?.email?.[0] || 'U').toUpperCase();
}

function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
}

const MeusAnuncios = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  const [ads, setAds] = useState<MarkfyAd[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<MarkfyAd | null>(null);
  const [showProposalsModal, setShowProposalsModal] = useState<MarkfyAd | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [value, setValue] = useState<number | ''>('');
  const [deadline, setDeadline] = useState<number | ''>('');

  useEffect(() => {
    setAds(getAds());
  }, []);

  const resetForm = () => {
    setTitle(''); setCategory(CATEGORIES[0]); setDescription('');
    setSkills([]); setSkillInput(''); setValue(''); setDeadline('');
    setEditingAd(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (ad: MarkfyAd) => {
    setEditingAd(ad); setTitle(ad.title); setCategory(ad.category);
    setDescription(ad.description); setSkills(ad.skills);
    setValue(ad.value); setDeadline(ad.deadline); setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim() || !description.trim() || !value || !deadline) return;
    const updated = [...ads];
    if (editingAd) {
      const idx = updated.findIndex(a => a.id === editingAd.id);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], title, category, description, skills, value: Number(value), deadline: Number(deadline) };
      }
      toast({ title: 'Anúncio atualizado com sucesso!', duration: 3000 });
    } else {
      const newAd: MarkfyAd = {
        id: crypto.randomUUID(), title, category, description, skills,
        value: Number(value), deadline: Number(deadline), status: 'ativo',
        views: 0, createdAt: new Date().toISOString(), proposals: [],
      };
      updated.unshift(newAd);
      toast({ title: 'Anúncio publicado com sucesso!', duration: 3000 });
    }
    saveAds(updated); setAds(updated); setShowModal(false); resetForm();
  };

  const toggleStatus = (id: string) => {
    const updated = ads.map(a => a.id === id ? { ...a, status: (a.status === 'ativo' ? 'pausado' : 'ativo') as 'ativo' | 'pausado' } : a);
    saveAds(updated); setAds(updated);
  };

  const handleAcceptProposal = (adId: string, proposalId: string) => {
    const updated = ads.map(a => {
      if (a.id !== adId) return a;
      return { ...a, proposals: a.proposals.map(p => p.id === proposalId ? { ...p, status: 'aceita' as const } : p) };
    });
    saveAds(updated); setAds(updated);
    setShowProposalsModal(updated.find(a => a.id === adId) || null);
    toast({ title: 'Proposta aceita! O freelancer foi notificado.', duration: 3000 });
  };

  const handleRejectProposal = (adId: string, proposalId: string) => {
    const updated = ads.map(a => {
      if (a.id !== adId) return a;
      return { ...a, proposals: a.proposals.map(p => p.id === proposalId ? { ...p, status: 'recusada' as const } : p) };
    });
    saveAds(updated); setAds(updated);
    setShowProposalsModal(updated.find(a => a.id === adId) || null);
    toast({ title: 'Proposta recusada.', duration: 3000 });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const activeAds = ads.filter(a => a.status === 'ativo');
  const totalViews = ads.reduce((s, a) => s + a.views, 0);
  const totalProposals = ads.reduce((s, a) => s + a.proposals.length, 0);
  const conversionRate = totalViews > 0 ? ((totalProposals / totalViews) * 100).toFixed(1) : '0';

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <div className="flex h-screen" style={{ background: '#F8F9FC' }}>
      {/* SIDEBAR */}
      <aside className="w-[240px] shrink-0 flex flex-col justify-between py-6 px-4 max-lg:hidden border-r border-[#E8ECF4] bg-white">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#29B2FE' }}>{initials}</div>
            <div>
              <p className="text-sm font-bold text-[#111] leading-tight">{displayName}</p>
              <p className="text-[11px] text-[#9CA3B4]">Meus Anúncios</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map(link => {
              const isActive = link.path === location.pathname;
              return (
                <button key={link.label} onClick={() => link.path && navigate(link.path)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'text-[#29B2FE]' : 'text-[#6B7280] hover:text-[#111] hover:bg-[#f3f4f6]'}`}
                  style={isActive ? { background: 'rgba(41,178,254,0.08)', border: '1px solid rgba(41,178,254,0.2)' } : undefined}
                >
                  <link.icon size={18} />{link.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:text-[#111] hover:bg-[#f3f4f6]"><Settings size={18} /> Configurações</button>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10"><LogOut size={18} /> Sair</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-[#E8ECF4] shrink-0">
          <div className="flex items-center gap-2 bg-[#F3F4F8] rounded-full px-4 py-2 flex-1 max-w-xl">
            <Search size={16} className="text-[#9CA3B4]" />
            <input type="text" placeholder="Buscar anúncios..." className="bg-transparent text-sm text-[#1A1D26] outline-none flex-1 placeholder:text-[#9CA3B4]" />
          </div>
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-full bg-[#F3F4F8] flex items-center justify-center text-[#6B7280]"><Bell size={18} /></button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#29B2FE' }}>{initials}</div>
              <span className="text-sm font-medium text-[#1A1D26] max-md:hidden">{displayName}</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-[#111827]">Meus Anúncios</h1>
                <p className="text-sm text-[#6b7280] mt-1">Gerencie seus serviços e acompanhe seu desempenho</p>
              </div>
              <button onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: '#29B2FE' }}>
                <Plus size={16} /> Novo Anúncio
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total de Anúncios', value: ads.length, icon: Megaphone, color: '#29B2FE' },
                { label: 'Visualizações', value: totalViews, icon: Eye, color: '#6366f1' },
                { label: 'Propostas Recebidas', value: totalProposals, icon: FileText, color: '#f59e0b' },
                { label: 'Taxa de Conversão', value: `${conversionRate}%`, icon: TrendingUp, color: '#10b981' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-[#E8ECF4] p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <s.icon size={22} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#9CA3B4] font-medium">{s.label}</p>
                    <p className="text-2xl font-extrabold text-[#111827]">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Content */}
            {ads.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed p-16 text-center" style={{ borderColor: '#29B2FE' }}>
                <div className="text-5xl mb-4">📢</div>
                <h2 className="text-xl font-bold text-[#111827] mb-2">Você ainda não tem anúncios ativos</h2>
                <p className="text-sm text-[#6b7280] mb-6">Crie seu primeiro serviço e comece a receber clientes</p>
                <button onClick={openCreate}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                  style={{ background: '#29B2FE' }}>
                  <Plus size={16} /> Criar Primeiro Anúncio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {ads.map(ad => (
                  <div key={ad.id} className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden flex flex-col hover:shadow-lg hover:border-[#29B2FE]/20 transition-all">
                    <div className="p-5 flex flex-col flex-1">
                      {/* Status + Category */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white ${ad.status === 'ativo' ? '' : 'opacity-60'}`}
                          style={{ background: ad.status === 'ativo' ? '#10b981' : '#9CA3B4' }}>
                          {ad.status === 'ativo' ? 'Ativo' : 'Pausado'}
                        </span>
                        <span className="text-[10px] font-medium text-[#9CA3B4] bg-[#F3F4F8] px-2 py-0.5 rounded-md">{ad.category}</span>
                      </div>

                      <h4 className="font-bold text-[15px] text-[#1A1D26] leading-snug mb-2 line-clamp-2">{ad.title}</h4>
                      <p className="text-xs text-[#9CA3B4] mb-3 line-clamp-3 flex-1">{ad.description}</p>

                      {/* Skills */}
                      {ad.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {ad.skills.slice(0, 4).map(s => (
                            <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F3F4F8] text-[#6B7280]">{s}</span>
                          ))}
                        </div>
                      )}

                      {/* Value + Stats */}
                      <div className="border-t border-[#E8ECF4] pt-3 mt-auto">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-lg font-extrabold" style={{ color: '#29B2FE' }}>R$ {ad.value.toLocaleString('pt-BR')}</p>
                          <p className="text-xs text-[#9CA3B4]">{ad.deadline} dias</p>
                        </div>
                        <div className="flex items-center gap-4 mb-4 text-xs text-[#9CA3B4]">
                          <span className="flex items-center gap-1"><Eye size={12} /> {ad.views} views</span>
                          <span className="flex items-center gap-1"><FileText size={12} /> {ad.proposals.length} propostas</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setShowProposalsModal(ad)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110" style={{ background: '#29B2FE' }}>
                            Ver Propostas
                          </button>
                          <button onClick={() => openEdit(ad)}
                            className="w-10 h-10 rounded-xl border border-[#E8ECF4] flex items-center justify-center text-[#6B7280] hover:text-[#29B2FE] hover:border-[#29B2FE]/30 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => toggleStatus(ad.id)}
                            className="w-10 h-10 rounded-xl border border-[#E8ECF4] flex items-center justify-center text-[#6B7280] hover:text-[#29B2FE] hover:border-[#29B2FE]/30 transition-colors">
                            {ad.status === 'ativo' ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL — Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E8ECF4]">
              <h3 className="text-lg font-bold text-[#111827]">{editingAd ? 'Editar Anúncio' : 'Criar Anúncio'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3B4] hover:text-[#111] hover:bg-[#F3F4F8]"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-[#111827] mb-1.5 block">Título</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Criação de Landing Page"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE] transition-colors" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#111827] mb-1.5 block">Categoria</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE] bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#111827] mb-1.5 block">Descrição <span className="text-[#9CA3B4]">({description.length}/500)</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))} rows={4} placeholder="Descreva o serviço que você oferece..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE] resize-none transition-colors" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#111827] mb-1.5 block">Skills</label>
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown}
                  placeholder="Digite uma skill e pressione Enter"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE] transition-colors" />
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map(s => (
                      <span key={s} className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full text-white" style={{ background: '#29B2FE' }}>
                        {s}
                        <button onClick={() => setSkills(skills.filter(sk => sk !== s))} className="hover:opacity-70"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Valor (R$)</label>
                  <input type="number" value={value} onChange={e => setValue(e.target.value ? Number(e.target.value) : '')} placeholder="1500"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE] transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Prazo (dias)</label>
                  <input type="number" value={deadline} onChange={e => setDeadline(e.target.value ? Number(e.target.value) : '')} placeholder="15"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE] transition-colors" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E8ECF4]">
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] border border-[#E8ECF4] hover:bg-[#F3F4F8] transition-colors">Cancelar</button>
              <button onClick={handleSave}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: '#29B2FE' }}>
                {editingAd ? 'Salvar Alterações' : 'Publicar Anúncio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — Ver Propostas */}
      {showProposalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E8ECF4]">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Propostas</h3>
                <p className="text-xs text-[#9CA3B4] mt-0.5">{showProposalsModal.title}</p>
              </div>
              <button onClick={() => setShowProposalsModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3B4] hover:text-[#111] hover:bg-[#F3F4F8]"><X size={18} /></button>
            </div>
            <div className="p-6">
              {showProposalsModal.proposals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm font-medium text-[#111827]">Nenhuma proposta recebida ainda</p>
                  <p className="text-xs text-[#9CA3B4] mt-1">As propostas aparecerão aqui quando freelancers se candidatarem</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {showProposalsModal.proposals.map(p => (
                    <div key={p.id} className="border border-[#E8ECF4] rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#29B2FE' }}>
                          {p.freelancerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827]">{p.freelancerName}</p>
                          <p className="text-[10px] text-[#9CA3B4]">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        {p.status !== 'pendente' && (
                          <span className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg text-white ${p.status === 'aceita' ? 'bg-green-500' : 'bg-red-400'}`}>
                            {p.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mb-3">{p.text}</p>
                      <div className="flex items-center gap-4 text-xs text-[#9CA3B4] mb-3">
                        <span>R$ {p.value.toLocaleString('pt-BR')}</span>
                        <span>{p.deadline} dias</span>
                      </div>
                      {p.status === 'pendente' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAcceptProposal(showProposalsModal.id, p.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white hover:brightness-110" style={{ background: '#10b981' }}>Aceitar</button>
                          <button onClick={() => handleRejectProposal(showProposalsModal.id, p.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white hover:brightness-110 bg-red-400">Recusar</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeusAnuncios;
