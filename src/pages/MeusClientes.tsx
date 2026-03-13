import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ShoppingBag, Megaphone, Users, MessageSquare, Globe,
  CheckCircle, Send, PackageCheck, Wrench, Settings, LogOut,
  Plus, Briefcase, DollarSign, X, Search, Bell, Mail
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

export interface MarkfyClient {
  id: string;
  name: string;
  email: string;
  company: string;
  projects: MarkfyClientProject[];
  createdAt: string;
}

export interface MarkfyClientProject {
  id: string;
  name: string;
  value: number;
  status: 'em_andamento' | 'concluido';
  notes: string;
  createdAt: string;
}

function getClients(): MarkfyClient[] {
  try { return JSON.parse(localStorage.getItem('markfy_clients') || '[]'); }
  catch { return []; }
}
function saveClients(c: MarkfyClient[]) { localStorage.setItem('markfy_clients', JSON.stringify(c)); }

function getUserInitials(user: any): string {
  const name = user?.user_metadata?.full_name;
  if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (user?.email?.[0] || 'U').toUpperCase();
}
function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
}
function nameInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const COLORS = ['#29B2FE', '#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
function avatarColor(name: string) { let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length]; }

const MeusClientes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  const [clients, setClients] = useState<MarkfyClient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState<MarkfyClient | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectValue, setProjectValue] = useState<number | ''>('');
  const [projectStatus, setProjectStatus] = useState<'em_andamento' | 'concluido'>('em_andamento');
  const [notes, setNotes] = useState('');

  useEffect(() => { setClients(getClients()); }, []);

  const resetForm = () => { setName(''); setEmail(''); setCompany(''); setProjectName(''); setProjectValue(''); setProjectStatus('em_andamento'); setNotes(''); };

  const handleSave = () => {
    if (!name.trim() || !email.trim() || !projectName.trim() || !projectValue) return;
    const newClient: MarkfyClient = {
      id: crypto.randomUUID(), name, email, company,
      projects: [{
        id: crypto.randomUUID(), name: projectName, value: Number(projectValue),
        status: projectStatus, notes, createdAt: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
    };
    const updated = [newClient, ...clients];
    saveClients(updated); setClients(updated); setShowModal(false); resetForm();
    toast({ title: 'Cliente adicionado com sucesso!', duration: 3000 });
  };

  const totalClients = clients.length;
  const activeProjects = clients.reduce((s, c) => s + c.projects.filter(p => p.status === 'em_andamento').length, 0);
  const completedProjects = clients.reduce((s, c) => s + c.projects.filter(p => p.status === 'concluido').length, 0);
  const totalRevenue = clients.reduce((s, c) => s + c.projects.reduce((ps, p) => ps + p.value, 0), 0);

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
              <p className="text-[11px] text-[#9CA3B4]">Meus Clientes</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map(link => {
              const isActive = link.path === location.pathname;
              return (
                <button key={link.label} onClick={() => link.path && navigate(link.path)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'text-[#29B2FE]' : 'text-[#6B7280] hover:text-[#111] hover:bg-[#f3f4f6]'}`}
                  style={isActive ? { background: 'rgba(41,178,254,0.08)', border: '1px solid rgba(41,178,254,0.2)' } : undefined}>
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
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-[#E8ECF4] shrink-0">
          <div className="flex items-center gap-2 bg-[#F3F4F8] rounded-full px-4 py-2 flex-1 max-w-xl">
            <Search size={16} className="text-[#9CA3B4]" />
            <input type="text" placeholder="Buscar clientes..." className="bg-transparent text-sm text-[#1A1D26] outline-none flex-1 placeholder:text-[#9CA3B4]" />
          </div>
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-full bg-[#F3F4F8] flex items-center justify-center text-[#6B7280]"><Bell size={18} /></button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#29B2FE' }}>{initials}</div>
              <span className="text-sm font-medium text-[#1A1D26] max-md:hidden">{displayName}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-[#111827]">Meus Clientes</h1>
                <p className="text-sm text-[#6b7280] mt-1">Histórico de clientes e projetos</p>
              </div>
              <button onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 hover:bg-[#29B2FE]/5"
                style={{ borderColor: '#29B2FE', color: '#29B2FE' }}>
                <Plus size={16} /> Adicionar Cliente
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Clientes', value: totalClients, icon: Users, color: '#29B2FE' },
                { label: 'Projetos Ativos', value: activeProjects, icon: Briefcase, color: '#6366f1' },
                { label: 'Projetos Concluídos', value: completedProjects, icon: CheckCircle, color: '#10b981' },
                { label: 'Receita Total', value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`, icon: DollarSign, color: '#f59e0b' },
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
            {clients.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed p-16 text-center" style={{ borderColor: '#29B2FE' }}>
                <div className="text-5xl mb-4">👥</div>
                <h2 className="text-xl font-bold text-[#111827] mb-2">Nenhum cliente ainda</h2>
                <p className="text-sm text-[#6b7280] mb-6">Complete projetos ou adicione clientes manualmente</p>
                <button onClick={() => { resetForm(); setShowModal(true); }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white hover:brightness-110"
                  style={{ background: '#29B2FE' }}>
                  <Plus size={16} /> Adicionar Primeiro Cliente
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {clients.map(client => {
                  const lastProject = client.projects[client.projects.length - 1];
                  const totalVal = client.projects.reduce((s, p) => s + p.value, 0);
                  return (
                    <div key={client.id} className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden flex flex-col hover:shadow-lg hover:border-[#29B2FE]/20 transition-all">
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: avatarColor(client.name) }}>
                            {nameInitials(client.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#111827] truncate">{client.name}</p>
                            <p className="text-xs text-[#9CA3B4] truncate">{client.email}</p>
                            {client.company && <p className="text-[10px] text-[#9CA3B4] truncate">{client.company}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4 text-xs text-[#6B7280]">
                          <span className="flex items-center gap-1"><Briefcase size={12} /> {client.projects.length} projetos</span>
                          <span className="flex items-center gap-1"><DollarSign size={12} /> R$ {totalVal.toLocaleString('pt-BR')}</span>
                        </div>
                        {lastProject && (
                          <div className="bg-[#F8F9FC] rounded-xl p-3 mb-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-[#111827] truncate flex-1">{lastProject.name}</p>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg text-white ml-2 shrink-0 ${lastProject.status === 'concluido' ? 'bg-green-500' : ''}`}
                                style={lastProject.status === 'em_andamento' ? { background: '#29B2FE' } : undefined}>
                                {lastProject.status === 'em_andamento' ? 'Em andamento' : 'Concluído'}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 mt-auto">
                          <button onClick={() => setShowProjectsModal(client)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white hover:brightness-110" style={{ background: '#29B2FE' }}>
                            Ver Projetos
                          </button>
                          <button onClick={() => navigate('/mensagens')}
                            className="w-10 h-10 rounded-xl border border-[#E8ECF4] flex items-center justify-center text-[#6B7280] hover:text-[#29B2FE] hover:border-[#29B2FE]/30 transition-colors">
                            <Mail size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL — Adicionar Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E8ECF4]">
              <h3 className="text-lg font-bold text-[#111827]">Adicionar Cliente</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3B4] hover:text-[#111] hover:bg-[#F3F4F8]"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-[#111827] mb-1.5 block">Nome completo</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="João Silva"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#111827] mb-1.5 block">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@email.com" type="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#111827] mb-1.5 block">Empresa <span className="text-[#9CA3B4]">(opcional)</span></label>
                <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Tech Corp"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE]" />
              </div>
              <div className="border-t border-[#E8ECF4] pt-5">
                <p className="text-xs font-semibold text-[#9CA3B4] uppercase tracking-wider mb-4">Projeto</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#111827] mb-1.5 block">Nome do projeto</label>
                    <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Landing Page"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Valor (R$)</label>
                      <input type="number" value={projectValue} onChange={e => setProjectValue(e.target.value ? Number(e.target.value) : '')} placeholder="2500"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Status</label>
                      <select value={projectStatus} onChange={e => setProjectStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE] bg-white">
                        <option value="em_andamento">Em andamento</option>
                        <option value="concluido">Concluído</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#111827] mb-1.5 block">Notas</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Observações sobre o projeto..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE] resize-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E8ECF4]">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] border border-[#E8ECF4] hover:bg-[#F3F4F8]">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:brightness-110" style={{ background: '#29B2FE' }}>Salvar Cliente</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — Ver Projetos */}
      {showProjectsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E8ECF4]">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Projetos</h3>
                <p className="text-xs text-[#9CA3B4] mt-0.5">{showProjectsModal.name}</p>
              </div>
              <button onClick={() => setShowProjectsModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3B4] hover:text-[#111] hover:bg-[#F3F4F8]"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {showProjectsModal.projects.map(p => (
                <div key={p.id} className="border border-[#E8ECF4] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-[#111827]">{p.name}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg text-white ${p.status === 'concluido' ? 'bg-green-500' : ''}`}
                      style={p.status === 'em_andamento' ? { background: '#29B2FE' } : undefined}>
                      {p.status === 'em_andamento' ? 'Em andamento' : 'Concluído'}
                    </span>
                  </div>
                  <p className="text-lg font-extrabold mb-1" style={{ color: '#29B2FE' }}>R$ {p.value.toLocaleString('pt-BR')}</p>
                  {p.notes && <p className="text-xs text-[#6B7280] mt-2">{p.notes}</p>}
                  <p className="text-[10px] text-[#9CA3B4] mt-2">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeusClientes;
