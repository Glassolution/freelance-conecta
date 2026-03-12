import {
  Home, SlidersHorizontal, Globe, Briefcase,
  CheckCircle, Send, PackageCheck, Wrench,
  Settings, LogOut, Search, Bell, Mail, ExternalLink, ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const sidebarLinks = [
  { icon: Home, label: 'Início', active: false, path: '/dashboard' },
  { icon: ShoppingBag, label: 'Marketplace', active: false, path: '/marketplace' },
  { icon: Globe, label: 'Criador.ia', active: false, path: null },
  { icon: CheckCircle, label: 'Serviços Aprovados', active: false, path: null },
  { icon: Send, label: 'Serviços Enviados', active: false, path: null },
  { icon: PackageCheck, label: 'Serviços Entregues', active: false, path: null },
  { icon: Wrench, label: 'Ferramentas', active: true, path: '/ferramentas' },
];

function getUserInitials(user: any): string {
  const name = user?.user_metadata?.full_name;
  if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (user?.email?.[0] || 'U').toUpperCase();
}

function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
}

interface Tool {
  name: string;
  desc: string;
  icon: string;
  url: string;
}

interface ToolCategory {
  title: string;
  emoji: string;
  tools: Tool[];
}

const toolCategories: ToolCategory[] = [
  {
    title: 'Design',
    emoji: '🎨',
    tools: [
      { name: 'Figma', desc: 'Design de interfaces e prototipagem', icon: '🎯', url: 'https://figma.com' },
      { name: 'Canva', desc: 'Design gráfico e templates', icon: '🖼️', url: 'https://canva.com' },
      { name: 'Adobe Photoshop', desc: 'Edição de imagens profissional', icon: '📸', url: 'https://www.adobe.com/products/photoshop.html' },
    ],
  },
  {
    title: 'Desenvolvimento',
    emoji: '💻',
    tools: [
      { name: 'VS Code', desc: 'Editor de código', icon: '⌨️', url: 'https://code.visualstudio.com' },
      { name: 'GitHub', desc: 'Repositório e versionamento', icon: '🐙', url: 'https://github.com' },
      { name: 'Lovable', desc: 'Crie sites com IA', icon: '💜', url: 'https://lovable.dev' },
    ],
  },
  {
    title: 'Vídeo & Edição',
    emoji: '🎬',
    tools: [
      { name: 'Adobe Premiere', desc: 'Edição de vídeo profissional', icon: '🎞️', url: 'https://www.adobe.com/products/premiere.html' },
      { name: 'CapCut', desc: 'Edição de vídeo gratuita', icon: '✂️', url: 'https://www.capcut.com' },
      { name: 'DaVinci Resolve', desc: 'Edição e coloração', icon: '🎥', url: 'https://www.blackmagicdesign.com/products/davinciresolve' },
    ],
  },
  {
    title: 'Marketing',
    emoji: '📈',
    tools: [
      { name: 'Google Ads', desc: 'Anúncios pagos', icon: '📢', url: 'https://ads.google.com' },
      { name: 'Meta Business', desc: 'Anúncios no Instagram/Facebook', icon: '📱', url: 'https://business.facebook.com' },
      { name: 'Mailchimp', desc: 'Email marketing', icon: '📧', url: 'https://mailchimp.com' },
    ],
  },
  {
    title: 'No-Code & Sites',
    emoji: '🚀',
    tools: [
      { name: 'Lovable', desc: 'Crie sites com IA', icon: '💜', url: 'https://lovable.dev' },
      { name: 'WordPress', desc: 'CMS e blogs', icon: '📝', url: 'https://wordpress.com' },
      { name: 'Shopify', desc: 'Loja virtual', icon: '🛒', url: 'https://shopify.com' },
    ],
  },
];

const Ferramentas = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen" style={{ background: '#F8F9FC' }}>
      {/* LEFT SIDEBAR */}
      <aside className="w-[240px] shrink-0 flex flex-col justify-between py-6 px-4 max-lg:hidden border-r border-[#E8ECF4]" style={{ background: '#ffffff' }}>
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#2563eb' }}>
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
                  link.active ? 'text-[#2563eb]' : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#f3f4f6]'
                }`}
                style={link.active ? { background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' } : undefined}
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
                placeholder="Buscar ferramentas..."
                className="bg-transparent text-sm font-body text-[#1A1D26] outline-none flex-1 placeholder:text-[#9CA3B4]"
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
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#2563eb' }}>
                {initials}
              </div>
              <span className="text-sm font-body font-medium text-[#1A1D26] max-md:hidden">{displayName}</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-[#1A1D26] mb-1">Ferramentas</h1>
            <p className="text-sm font-body text-[#9CA3B4]">Acesse as ferramentas que você precisa para realizar seus projetos freelancer.</p>
          </div>

          {/* Tool Categories */}
          {toolCategories.map((category) => (
            <div key={category.title}>
              <h2 className="font-heading font-bold text-lg text-[#1A1D26] mb-4 flex items-center gap-2">
                <span>{category.emoji}</span>
                {category.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {category.tools.map((tool) => (
                  <div
                    key={`${category.title}-${tool.name}`}
                    className="bg-white rounded-2xl border border-[#E8ECF4] p-5 hover:shadow-lg transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(37,99,235,0.08)' }}>
                        {tool.icon}
                      </div>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: '#2563eb' }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <h3 className="font-body font-semibold text-sm text-[#1A1D26] mb-1">{tool.name}</h3>
                    <p className="text-xs font-body text-[#9CA3B4] mb-4 leading-relaxed">{tool.desc}</p>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-body font-semibold px-4 py-2 rounded-full transition-colors"
                      style={{ color: '#2563eb', background: 'rgba(37,99,235,0.08)' }}
                    >
                      Acessar <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Ferramentas;
