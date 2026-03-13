import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ShoppingBag, Megaphone, Users, MessageSquare, Globe,
  CheckCircle, Send, PackageCheck, Wrench, Settings, LogOut,
  Search, Bell, SendHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

interface Conversation {
  id: string;
  name: string;
  online: boolean;
  unread: number;
  messages: ChatMessage[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    name: 'Farmácia São José',
    online: true,
    unread: 1,
    messages: [
      { id: 'm1', text: 'Olá, vi seu anúncio e tenho interesse!', sender: 'them', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'm2', text: 'Pode me contar mais sobre o projeto?', sender: 'them', timestamp: new Date(Date.now() - 3500000).toISOString() },
    ],
  },
  {
    id: 'conv-2',
    name: 'Tech Startup BR',
    online: false,
    unread: 0,
    messages: [
      { id: 'm3', text: 'Preciso de um desenvolvedor React.', sender: 'them', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: 'm4', text: 'Claro! Tenho experiência com React e TypeScript. Podemos conversar sobre os detalhes?', sender: 'me', timestamp: new Date(Date.now() - 85000000).toISOString() },
      { id: 'm5', text: 'Ótimo! Vou te enviar o briefing do projeto.', sender: 'them', timestamp: new Date(Date.now() - 84000000).toISOString() },
    ],
  },
];

function getConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem('markfy_messages');
    if (saved) return JSON.parse(saved);
  } catch {}
  localStorage.setItem('markfy_messages', JSON.stringify(MOCK_CONVERSATIONS));
  return MOCK_CONVERSATIONS;
}
function saveConversations(c: Conversation[]) { localStorage.setItem('markfy_messages', JSON.stringify(c)); }

function getUserInitials(user: any): string {
  const name = user?.user_metadata?.full_name;
  if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (user?.email?.[0] || 'U').toUpperCase();
}
function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
}
function nameInitials(name: string) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }

const COLORS = ['#29B2FE', '#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
function avatarColor(name: string) { let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length]; }

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getDateLabel(ts: string): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getLastMessagePreview(conv: Conversation): string {
  if (conv.messages.length === 0) return '';
  const last = conv.messages[conv.messages.length - 1];
  return last.text.length > 40 ? last.text.slice(0, 40) + '...' : last.text;
}

function getLastMessageTime(conv: Conversation): string {
  if (conv.messages.length === 0) return '';
  return formatTime(conv.messages[conv.messages.length - 1].timestamp);
}

const Mensagens = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setConversations(getConversations()); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeConvId, conversations]);

  const activeConv = conversations.find(c => c.id === activeConvId) || null;

  const filteredConversations = searchQuery
    ? conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConvId) return;
    const updated = conversations.map(c => {
      if (c.id !== activeConvId) return c;
      return {
        ...c,
        messages: [...c.messages, {
          id: crypto.randomUUID(),
          text: messageInput.trim(),
          sender: 'me' as const,
          timestamp: new Date().toISOString(),
        }],
      };
    });
    saveConversations(updated); setConversations(updated); setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const selectConversation = (id: string) => {
    setActiveConvId(id);
    const updated = conversations.map(c => c.id === id ? { ...c, unread: 0 } : c);
    saveConversations(updated); setConversations(updated);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  // Group messages by date
  const groupedMessages: { label: string; messages: ChatMessage[] }[] = [];
  if (activeConv) {
    let currentLabel = '';
    for (const msg of activeConv.messages) {
      const label = getDateLabel(msg.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groupedMessages.push({ label, messages: [] });
      }
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  return (
    <div className="flex h-screen" style={{ background: '#F8F9FC' }}>
      {/* SIDEBAR */}
      <aside className="w-[240px] shrink-0 flex flex-col justify-between py-6 px-4 max-lg:hidden border-r border-[#E8ECF4] bg-white">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#29B2FE' }}>{initials}</div>
            <div>
              <p className="text-sm font-bold text-[#111] leading-tight">{displayName}</p>
              <p className="text-[11px] text-[#9CA3B4]">Mensagens</p>
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

      {/* MAIN — Two column chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Conversation List */}
        <div className="w-[320px] shrink-0 bg-white border-r border-[#E8ECF4] flex flex-col">
          <div className="p-4 border-b border-[#E8ECF4]">
            <h2 className="text-lg font-bold text-[#111827] mb-3">Mensagens</h2>
            <div className="flex items-center gap-2 bg-[#F3F4F8] rounded-full px-3 py-2">
              <Search size={14} className="text-[#9CA3B4]" />
              <input type="text" placeholder="Buscar conversa..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-[#1A1D26] outline-none flex-1 placeholder:text-[#9CA3B4]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map(conv => (
              <button key={conv.id} onClick={() => selectConversation(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F8F9FC] relative ${activeConvId === conv.id ? 'bg-[#F8F9FC]' : ''}`}>
                {activeConvId === conv.id && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: '#29B2FE' }} />}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: avatarColor(conv.name) }}>
                    {nameInitials(conv.name)}
                  </div>
                  {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#111827] truncate">{conv.name}</p>
                    <span className="text-[10px] text-[#9CA3B4] shrink-0 ml-2">{getLastMessageTime(conv)}</span>
                  </div>
                  <p className="text-xs text-[#9CA3B4] truncate mt-0.5">{getLastMessagePreview(conv)}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#29B2FE' }}>
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — Chat Area */}
        <div className="flex-1 flex flex-col bg-[#F8F9FC]">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-lg font-bold text-[#111827] mb-1">Selecione uma conversa para começar</p>
                <p className="text-sm text-[#9CA3B4]">Escolha uma conversa na lista ao lado</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat top bar */}
              <div className="flex items-center gap-3 px-6 h-16 bg-white border-b border-[#E8ECF4] shrink-0">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: avatarColor(activeConv.name) }}>
                    {nameInitials(activeConv.name)}
                  </div>
                  {activeConv.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">{activeConv.name}</p>
                  <p className="text-[10px] text-[#9CA3B4]">{activeConv.online ? 'Online' : 'Offline'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {groupedMessages.map(group => (
                  <div key={group.label}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#E8ECF4]" />
                      <span className="text-[10px] font-semibold text-[#9CA3B4] uppercase tracking-wider">{group.label}</span>
                      <div className="flex-1 h-px bg-[#E8ECF4]" />
                    </div>
                    {group.messages.map(msg => (
                      <div key={msg.id} className={`flex mb-3 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%]">
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.sender === 'me'
                              ? 'text-white rounded-br-md'
                              : 'bg-white text-[#1A1D26] border border-[#E8ECF4] rounded-bl-md'
                          }`}
                            style={msg.sender === 'me' ? { background: '#29B2FE' } : undefined}>
                            {msg.text}
                          </div>
                          <p className={`text-[10px] text-[#9CA3B4] mt-1 ${msg.sender === 'me' ? 'text-right' : ''}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-6 py-4 bg-white border-t border-[#E8ECF4] shrink-0">
                <div className="flex items-end gap-3">
                  <textarea
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite uma mensagem..."
                    rows={1}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm outline-none focus:border-[#29B2FE] resize-none max-h-[120px]"
                    style={{ minHeight: '42px' }}
                  />
                  <button onClick={handleSendMessage}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 hover:brightness-110 transition-all"
                    style={{ background: '#29B2FE' }}>
                    <SendHorizontal size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mensagens;
