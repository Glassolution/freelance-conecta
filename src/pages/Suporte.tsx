import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  FolderOpen,
  Loader2,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  SendHorizontal,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface SupportConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const TOPICS = ['Marketplace', 'Planos e Pagamento', 'Problemas Técnicos', 'Minha Conta', 'Reembolso'];

const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const makeConversationTitle = (firstMessage: string) => {
  const trimmed = firstMessage.trim();
  if (!trimmed) return 'Nova conversa';
  return trimmed.slice(0, 40) + (trimmed.length > 40 ? '...' : '');
};

const toInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const toPlanLabel = (plan: string | null | undefined) => {
  if (!plan || plan === 'free') return 'Plano Gratuito';
  if (plan === 'mensal') return 'Plano Mensal';
  if (plan === 'trimestral') return 'Plano Trimestral';
  return `Plano ${plan}`;
};

const sortConversations = (items: SupportConversation[]) =>
  [...items].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

const Suporte = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const db = supabase as any;

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = user?.email || 'sem-email';
  const userInitials = toInitials(userName);

  const [userPlan, setUserPlan] = useState('Plano Gratuito');

  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);

    const { data, error } = await db
      .from('support_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setIsLoadingMessages(false);

    if (error) {
      toast({ title: 'Erro ao carregar mensagens', description: error.message, variant: 'destructive' });
      return;
    }

    const mapped: SupportMessage[] = (data || []).map((row: any) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));

    setMessages(mapped);
  };

  const loadConversations = async (preferredConversationId?: string | null) => {
    if (!user?.id) return;

    setIsLoadingConversations(true);

    const { data, error } = await db
      .from('support_conversations')
      .select('id, user_id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    setIsLoadingConversations(false);

    if (error) {
      toast({ title: 'Erro ao carregar conversas', description: error.message, variant: 'destructive' });
      return;
    }

    const list: SupportConversation[] = data || [];
    setConversations(sortConversations(list));

    if (list.length === 0) {
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    const targetId = preferredConversationId && list.some((item) => item.id === preferredConversationId)
      ? preferredConversationId
      : activeConversationId && list.some((item) => item.id === activeConversationId)
        ? activeConversationId
        : list[0].id;

    if (!targetId) {
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    setActiveConversationId(targetId);
    await loadMessages(targetId);
  };

  const loadUserPlan = async () => {
    if (!user?.id) return;

    const { data } = await db
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle();

    setUserPlan(toPlanLabel(data?.plan));
  };

  useEffect(() => {
    if (!user?.id) return;
    void Promise.all([loadConversations(), loadUserPlan()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((item) => item.title.toLowerCase().includes(term));
  }, [conversations, searchTerm]);

  const createConversation = async () => {
    if (!user?.id) return null;

    const { data, error } = await db
      .from('support_conversations')
      .insert({ user_id: user.id, title: 'Nova conversa' })
      .select('id, user_id, title, created_at, updated_at')
      .single();

    if (error || !data) {
      toast({ title: 'Erro ao criar conversa', description: error?.message || 'Tente novamente.', variant: 'destructive' });
      return null;
    }

    const newConversation = data as SupportConversation;
    setConversations((prev) => sortConversations([newConversation, ...prev]));
    setActiveConversationId(newConversation.id);
    setMessages([]);
    setSearchOpen(false);
    setSearchTerm('');
    setMenuConversationId(null);
    if (isMobile) setMobileSidebarOpen(false);

    return newConversation.id;
  };

  const handleRenameConversation = async (conversation: SupportConversation) => {
    const newTitle = window.prompt('Renomear conversa', conversation.title)?.trim();
    if (!newTitle || !user?.id) return;

    const { error } = await db
      .from('support_conversations')
      .update({ title: newTitle })
      .eq('id', conversation.id)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Erro ao renomear conversa', description: error.message, variant: 'destructive' });
      return;
    }

    setConversations((prev) =>
      sortConversations(
        prev.map((item) =>
          item.id === conversation.id
            ? { ...item, title: newTitle, updated_at: new Date().toISOString() }
            : item,
        ),
      ),
    );
    setMenuConversationId(null);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!user?.id) return;
    if (!window.confirm('Deseja realmente excluir esta conversa?')) return;

    const { error } = await db
      .from('support_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Erro ao excluir conversa', description: error.message, variant: 'destructive' });
      return;
    }

    const nextConversations = conversations.filter((conversation) => conversation.id !== conversationId);
    setConversations(nextConversations);
    setMenuConversationId(null);

    if (activeConversationId === conversationId) {
      const nextId = nextConversations[0]?.id ?? null;
      setActiveConversationId(nextId);
      if (nextId) {
        await loadMessages(nextId);
      } else {
        setMessages([]);
      }
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMenuConversationId(null);
    await loadMessages(conversationId);
    if (isMobile) setMobileSidebarOpen(false);
  };

  const handleSend = async (rawInput?: string) => {
    const text = (rawInput ?? input).trim();
    if (!text && !attachment) return;
    if (!user?.id) return;

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await createConversation();
      if (!conversationId) return;
    }

    const userContent = text || `📎 Screenshot anexado: ${attachment?.name}`;
    const userMessage: SupportMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      createdAt: new Date().toISOString(),
    };

    const isFirstUserMessage = messages.length === 0;
    const history = [...messages.map((item) => ({ role: item.role, content: item.content })), { role: 'user', content: userContent }];

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachment(null);

    const { error: userInsertError } = await db
      .from('support_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: userContent,
      });

    if (userInsertError) {
      toast({ title: 'Erro ao salvar mensagem', description: userInsertError.message, variant: 'destructive' });
    }

    if (isFirstUserMessage && text) {
      const title = makeConversationTitle(text);
      const { error: titleError } = await db
        .from('support_conversations')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (!titleError) {
        setConversations((prev) =>
          sortConversations(
            prev.map((item) =>
              item.id === conversationId
                ? { ...item, title, updated_at: new Date().toISOString() }
                : item,
            ),
          ),
        );
      }
    }

    setIsThinking(true);

    const { data, error } = await supabase.functions.invoke('support-chat', {
      body: { messages: history },
    });

    setIsThinking(false);

    if (error) {
      toast({ title: 'Erro no suporte IA', description: error.message, variant: 'destructive' });
      return;
    }

    const assistantContent = data?.reply || 'Não consegui responder agora.';
    const assistantMessage: SupportMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: assistantContent,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    const { error: assistantInsertError } = await db
      .from('support_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
      });

    if (assistantInsertError) {
      toast({ title: 'Erro ao salvar resposta', description: assistantInsertError.message, variant: 'destructive' });
    }

    setConversations((prev) =>
      sortConversations(
        prev.map((item) =>
          item.id === conversationId
            ? { ...item, updated_at: new Date().toISOString() }
            : item,
        ),
      ),
    );
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-[hsl(var(--support-bg))] text-[hsl(var(--support-text))]">
      {isMobile && mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu lateral"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[hsl(var(--support-backdrop)/0.55)]"
        />
      )}

      <aside
        className={`z-40 flex h-screen w-[260px] flex-col border-r border-[hsl(var(--support-border))] bg-[hsl(var(--support-bg))] p-4 ${
          isMobile
            ? `fixed left-0 top-0 transition-transform duration-200 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'relative shrink-0'
        }`}
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void createConversation()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--support-primary))] px-3 py-2 text-sm font-medium text-[hsl(var(--support-primary-foreground))] transition-opacity hover:opacity-90"
          >
            <Plus size={16} /> Nova conversa
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[hsl(var(--support-text-muted))] transition-colors hover:bg-[hsl(var(--support-hover))]"
          >
            <Search size={16} /> Procurar
          </button>

          {searchOpen && (
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar conversa..."
              className="w-full rounded-xl border border-[hsl(var(--support-border))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--support-text))] outline-none placeholder:text-[hsl(var(--support-text-faint))]"
            />
          )}
        </div>

        <div className="my-4 h-px bg-[hsl(var(--support-border))]" />

        <div className="space-y-1">
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[hsl(var(--support-text-muted))] hover:bg-[hsl(var(--support-hover))]">
            <MessageSquare size={16} /> Conversas
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[hsl(var(--support-text-muted))] hover:bg-[hsl(var(--support-hover))]">
            <FolderOpen size={16} /> Projetos
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[hsl(var(--support-text-muted))] hover:bg-[hsl(var(--support-hover))]">
            <Bookmark size={16} /> Salvos
          </button>
        </div>

        <div className="my-4 h-px bg-[hsl(var(--support-border))]" />

        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--support-text-faint))]">Recentes</p>

        <div className="mt-2 flex-1 overflow-y-auto space-y-1 pr-1">
          {isLoadingConversations ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-[hsl(var(--support-text-muted))]">
              <Loader2 size={14} className="animate-spin" /> Carregando...
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[hsl(var(--support-text-faint))]">Nenhuma conversa encontrada.</p>
          ) : (
            filteredConversations.map((conversation) => {
              const isActive = activeConversationId === conversation.id;
              const showMenu = menuConversationId === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className="group relative"
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setMenuConversationId(conversation.id);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => void handleSelectConversation(conversation.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-[hsl(var(--support-active))] text-[hsl(var(--support-text))]'
                        : 'text-[hsl(var(--support-text-muted))] hover:bg-[hsl(var(--support-hover))]'
                    }`}
                  >
                    <span className="block truncate pr-8">{conversation.title.slice(0, 35)}</span>
                  </button>

                  <button
                    type="button"
                    aria-label="Ações da conversa"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuConversationId((prev) => (prev === conversation.id ? null : conversation.id));
                    }}
                    className="absolute right-2 top-2 rounded-md p-1 text-[hsl(var(--support-text-faint))] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[hsl(var(--support-hover))] hover:text-[hsl(var(--support-text-muted))]"
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {showMenu && (
                    <div
                      className="absolute right-2 top-9 z-50 min-w-[130px] rounded-lg border border-[hsl(var(--support-border))] bg-[hsl(var(--support-surface))] p-1 shadow-lg"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => void handleRenameConversation(conversation)}
                        className="w-full rounded-md px-2 py-1.5 text-left text-xs text-[hsl(var(--support-text-muted))] hover:bg-[hsl(var(--support-hover))]"
                      >
                        Renomear
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteConversation(conversation.id)}
                        className="w-full rounded-md px-2 py-1.5 text-left text-xs text-[hsl(var(--support-text-muted))] hover:bg-[hsl(var(--support-hover))]"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 rounded-xl border border-[hsl(var(--support-border))] bg-[hsl(var(--support-surface))] p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--support-primary))] text-xs font-bold text-[hsl(var(--support-primary-foreground))]">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[hsl(var(--support-text))]">{userName}</p>
              <p className="truncate text-xs text-[hsl(var(--support-text-faint))]">{userPlan}</p>
              <p className="truncate text-[11px] text-[hsl(var(--support-text-faint))]">{userEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex h-screen min-w-0 flex-1 flex-col bg-[hsl(var(--support-bg))]">
        <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-6">
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-md p-1.5 text-[hsl(var(--support-text-muted))] hover:bg-[hsl(var(--support-hover))]"
              aria-label="Abrir menu lateral"
            >
              <Menu size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--support-text-muted))] transition-colors hover:text-[hsl(var(--support-text))]"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-36">
          {!hasMessages ? (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--support-primary))] text-2xl font-extrabold text-[hsl(var(--support-primary-foreground))]">
                M
              </div>

              <h1 className="text-center text-[28px] font-semibold text-[hsl(var(--support-text))]">
                Como posso te ajudar, {userName}?
              </h1>

              <div className="flex flex-wrap justify-center gap-2">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => void handleSend(topic)}
                    className="rounded-full border border-[hsl(var(--support-border))] bg-transparent px-3.5 py-1.5 text-[13px] text-[hsl(var(--support-text-muted))] transition-colors hover:border-[hsl(var(--support-primary))] hover:text-[hsl(var(--support-primary))]"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[680px] space-y-6 px-4 py-6">
              {isLoadingMessages ? (
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--support-text-muted))]">
                  <Loader2 size={14} className="animate-spin" /> Carregando mensagens...
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id}>
                    {message.role === 'assistant' ? (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--support-primary))] text-xs font-bold text-[hsl(var(--support-primary-foreground))]">
                          M
                        </div>
                        <div className="min-w-0">
                          <div className="prose prose-sm max-w-none text-[hsl(var(--support-text-subtle))] [&_p]:mb-1 [&_p]:mt-0 [&_ul]:mb-1 [&_li]:mb-0 [&_strong]:text-[hsl(var(--support-text))]">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                          <p className="mt-1 text-xs text-[hsl(var(--support-text-faint))]">{formatTime(message.createdAt)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <div className="max-w-[75%] whitespace-pre-wrap rounded-2xl bg-[hsl(var(--support-user-bubble))] px-4 py-2.5 text-sm text-[hsl(var(--support-primary-foreground))]">
                          {message.content}
                        </div>
                        <p className="text-xs text-[hsl(var(--support-text-faint))]">{formatTime(message.createdAt)}</p>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isThinking && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--support-primary))] text-xs font-bold text-[hsl(var(--support-primary-foreground))]">
                    M
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[hsl(var(--support-text-muted))]">
                    <Loader2 size={14} className="animate-spin" /> Pensando...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="sticky bottom-6 z-20 px-4">
          <div className="mx-auto max-w-[680px] rounded-2xl border border-[hsl(var(--support-border))] bg-[hsl(var(--support-surface))] p-3 shadow-sm">
            {attachment && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--support-border))] bg-[hsl(var(--support-hover))] px-3 py-1 text-xs text-[hsl(var(--support-text-muted))]">
                📎 {attachment.name}
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="rounded p-0.5 text-[hsl(var(--support-text-faint))] hover:bg-[hsl(var(--support-surface))] hover:text-[hsl(var(--support-text))]"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setAttachment(event.target.files?.[0] || null)}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md p-2 text-[hsl(var(--support-text-faint))] transition-colors hover:bg-[hsl(var(--support-hover))] hover:text-[hsl(var(--support-text-muted))]"
                aria-label="Anexar screenshot"
              >
                <Paperclip size={16} />
              </button>

              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Como posso ajudar você hoje?"
                rows={1}
                className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-[hsl(var(--support-text))] outline-none placeholder:text-[hsl(var(--support-text-faint))]"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />

              <span className="hidden pb-2 text-xs text-[hsl(var(--support-text-faint))] sm:block">Markfy AI</span>

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={(!input.trim() && !attachment) || isThinking}
                className="rounded-lg bg-[hsl(var(--support-primary))] p-2 text-[hsl(var(--support-primary-foreground))] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Enviar mensagem"
              >
                <SendHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Suporte;
