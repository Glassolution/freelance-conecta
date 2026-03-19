import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Home, ShoppingBag, Megaphone, Users, MessageSquare, Globe,
  CheckCircle, Send, PackageCheck, Wrench, Settings, LogOut,
  Search, SendHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ensureProfile } from '@/lib/ensureProfile';
import NotificationBell from '@/components/NotificationBell';
import SettingsModal from '@/components/SettingsModal';

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

interface ConversationItem {
  id: string;
  participant_1: string;
  participant_2: string;
  other_name: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

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

const Mensagens = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('created_at', { ascending: false }) as any;

    if (!convs || convs.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get other participant profiles
    const otherIds = convs
      .map((c: any) => (c.participant_1 === user.id ? c.participant_2 : c.participant_1))
      .filter((id: string | null) => !!id);

    const profileMap: Record<string, string> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', otherIds) as any;
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p.full_name || ''; });
    }

    // Get last messages and unread counts
    const items: ConversationItem[] = await Promise.all(convs.map(async (c: any) => {
      const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1) as any;

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', c.id)
        .eq('read', false)
        .neq('sender_id', user.id) as any;

      return {
        id: c.id,
        participant_1: c.participant_1,
        participant_2: c.participant_2,
        other_name: c.contact_name || profileMap[otherId] || 'Usuário',
        last_message: lastMsg?.[0]?.content,
        last_message_at: lastMsg?.[0]?.created_at,
        unread_count: count || 0,
      };
    }));

    setConversations(items);
    setLoading(false);
  };

  useEffect(() => {
    if (user) { ensureProfile(); fetchConversations(); }
  }, [user]);

  useEffect(() => {
    if (!planLoading && !isPro) { navigate('/pricing'); }
  }, [isPro, planLoading]);

  const loadMessages = async (convId: string) => {
    setMessagesLoading(true);
    setActiveConvId(convId);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true }) as any;

    setMessages(data || []);
    setMessagesLoading(false);

    // Mark as read
    if (user) {
      await supabase
        .from('messages')
        .update({ read: true } as any)
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
        .eq('read', false);

      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
    }
  };

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeConvId) return;
    const channel = supabase
      .channel(`messages-${activeConvId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const requestedConversationId = searchParams.get('conversation');
    if (!requestedConversationId) return;
    if (activeConvId === requestedConversationId) return;

    const exists = conversations.some((conv) => conv.id === requestedConversationId);
    if (!exists) return;

    void loadMessages(requestedConversationId);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('conversation');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, conversations, activeConvId, setSearchParams]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConvId || !user) return;
    const content = messageInput.trim();
    setMessageInput('');

    await supabase.from('messages').insert({
      conversation_id: activeConvId,
      sender_id: user.id,
      content,
    } as any);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const filteredConversations = searchQuery
    ? conversations.filter(c => c.other_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  // Group messages by date
  const groupedMessages: { label: string; messages: Message[] }[] = [];
  let currentLabel = '';
  for (const msg of messages) {
    const label = getDateLabel(msg.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      groupedMessages.push({ label, messages: [] });
    }
    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  }

  if (planLoading) return null;
  if (!isPro) return null;

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
                  {!isPro && ['Meus Anúncios','Meus Clientes','Mensagens','Serviços Aprovados','Serviços Enviados','Serviços Entregues','Ferramentas'].includes(link.label) && <Lock size={12} className="ml-auto text-[#9CA3B4]" />}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => setShowSettingsModal(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:text-[#111] hover:bg-[#f3f4f6]"><Settings size={18} /> Configurações</button>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10"><LogOut size={18} /> Sair</button>
        </div>
      </aside>

      {/* MAIN — Two column chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Conversation List */}
        <div className="w-[320px] shrink-0 bg-white border-r border-[#E8ECF4] flex flex-col">
          <div className="p-4 border-b border-[#E8ECF4]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#111827]">Mensagens</h2>
              <NotificationBell />
            </div>
            <div className="flex items-center gap-2 bg-[#F3F4F8] rounded-full px-3 py-2">
              <Search size={14} className="text-[#9CA3B4]" />
              <input type="text" placeholder="Buscar conversa..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-[#1A1D26] outline-none flex-1 placeholder:text-[#9CA3B4]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#9CA3B4]">Nenhuma conversa ainda</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button key={conv.id} onClick={() => loadMessages(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F8F9FC] relative ${activeConvId === conv.id ? 'bg-[#F8F9FC]' : ''}`}>
                  {activeConvId === conv.id && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: '#29B2FE' }} />}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: avatarColor(conv.other_name) }}>
                    {nameInitials(conv.other_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#111827] truncate">{conv.other_name}</p>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-[#9CA3B4] shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-[#9CA3B4] truncate mt-0.5">
                        {conv.last_message.length > 40 ? conv.last_message.slice(0, 40) + '...' : conv.last_message}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#29B2FE' }}>
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Chat Area */}
        <div className="flex-1 flex flex-col bg-[#F8F9FC]">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-[#f3f4f6] flex items-center justify-center mb-4"><MessageSquare size={24} className="text-[#9CA3B4]" /></div>
                <p className="text-lg font-bold text-[#111827] mb-1">Selecione uma conversa para começar</p>
                <p className="text-sm text-[#9CA3B4]">Escolha uma conversa na lista ao lado</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat top bar */}
              <div className="flex items-center gap-3 px-6 h-16 bg-white border-b border-[#E8ECF4] shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: avatarColor(activeConv.other_name) }}>
                  {nameInitials(activeConv.other_name)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">{activeConv.other_name}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <Skeleton className="h-10 w-48 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : (
                  groupedMessages.map(group => (
                    <div key={group.label}>
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[#E8ECF4]" />
                        <span className="text-[10px] font-semibold text-[#9CA3B4] uppercase tracking-wider">{group.label}</span>
                        <div className="flex-1 h-px bg-[#E8ECF4]" />
                      </div>
                      {group.messages.map(msg => (
                        <div key={msg.id} className={`flex mb-3 ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[70%]">
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              msg.sender_id === user?.id
                                ? 'text-white rounded-br-md'
                                : 'bg-white text-[#1A1D26] border border-[#E8ECF4] rounded-bl-md'
                            }`}
                              style={msg.sender_id === user?.id ? { background: '#29B2FE' } : undefined}>
                              {msg.content}
                            </div>
                            <p className={`text-[10px] text-[#9CA3B4] mt-1 ${msg.sender_id === user?.id ? 'text-right' : ''}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
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

      <SettingsModal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  );
};

export default Mensagens;
