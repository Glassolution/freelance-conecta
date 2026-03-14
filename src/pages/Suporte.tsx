import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Paperclip, SendHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SupportSidebarLayout from '@/components/support/SupportSidebarLayout';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

type RefundStep = 'idle' | 'awaiting_reason' | 'awaiting_email' | 'submitted';

const suggestedTopics = [
  '🛒 Marketplace',
  '💳 Planos e Pagamento',
  '🔧 Problemas Técnicos',
  '👤 Minha Conta',
  '📢 Meus Anúncios',
  '💬 Mensagens',
  '🔒 Acesso ao Dashboard',
  '💰 Reembolso',
];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const Suporte = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const [refundStep, setRefundStep] = useState<RefundStep>('idle');
  const [refundReason, setRefundReason] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoStartedRefundRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pushMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const isRefundIntent = (text: string) => /reembolso|refund|estorno/i.test(text);

  const askAI = async (conversation: ChatMessage[]) => {
    setIsLoading(true);

    const formattedMessages = conversation.map((m) => ({ role: m.role, content: m.content }));
    const { data, error } = await supabase.functions.invoke('support-chat', {
      body: { messages: formattedMessages },
    });

    setIsLoading(false);

    if (error) {
      const msg = error.message || 'Não foi possível responder agora.';
      const isRateLimit = msg.includes('429');
      const isPaymentRequired = msg.includes('402');

      toast({
        title: isRateLimit ? 'Muitas solicitações' : isPaymentRequired ? 'Créditos insuficientes' : 'Erro no suporte IA',
        description: msg,
        variant: 'destructive',
      });
      return;
    }

    if (data?.reply) {
      pushMessage('assistant', data.reply);
      return;
    }

    pushMessage('assistant', 'Não consegui gerar uma resposta agora. Tente novamente em instantes.');
  };

  const saveRefundRequest = async (reason: string, email: string) => {
    if (!user?.id) return;

    const { error } = await supabase.functions.invoke('support-refund-request', {
      body: { reason, email },
    });

    if (error) {
      toast({ title: 'Erro ao registrar reembolso', description: error.message, variant: 'destructive' });
      return;
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Solicitação de reembolso registrada',
      message: 'Recebemos sua solicitação. Nossa equipe vai analisar em até 5 dias úteis.',
      type: 'refund',
    } as never);
  };

  const processMessage = async (rawText: string, attachedFile?: File | null) => {
    const baseText = rawText.trim();
    const normalized = attachedFile
      ? `${baseText || 'Anexei um screenshot para análise.'}\n\n[Screenshot anexado: ${attachedFile.name}]`
      : baseText;

    if (!normalized) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: normalized,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (refundStep === 'awaiting_reason') {
      setRefundReason(baseText || normalized);
      setRefundStep('awaiting_email');
      pushMessage('assistant', '2️⃣ Confirme seu email cadastrado, por favor.');
      return;
    }

    if (refundStep === 'awaiting_email') {
      if (!baseText.includes('@')) {
        pushMessage('assistant', 'Por favor, informe um email válido para continuar a solicitação de reembolso.');
        return;
      }

      await saveRefundRequest(refundReason, baseText);
      setRefundStep('submitted');
      pushMessage('assistant', '✅ Solicitação registrada! Seu reembolso será processado em até 5 dias úteis via Mercado Pago.');
      return;
    }

    if (isRefundIntent(baseText || normalized)) {
      setRefundStep('awaiting_reason');
      pushMessage('assistant', 'Entendido! Para solicitar seu reembolso, preciso de algumas informações:\n1️⃣ Qual o motivo do reembolso?');
      return;
    }

    await askAI([...messages, userMessage]);
  };

  const handleSend = async () => {
    const fileToSend = attachment;
    await processMessage(input, fileToSend);
    setInput('');
    setAttachment(null);
  };

  useEffect(() => {
    if (searchParams.get('type') !== 'refund' || autoStartedRefundRef.current) return;

    autoStartedRefundRef.current = true;
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: 'Olá! Gostaria de solicitar um reembolso.',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Entendido! Para solicitar seu reembolso, preciso de algumas informações:\n1️⃣ Qual o motivo do reembolso?',
        createdAt: new Date().toISOString(),
      },
    ]);
    setRefundStep('awaiting_reason');
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const groupedMessages = useMemo(() => messages, [messages]);

  return (
    <SupportSidebarLayout active="suporte">
      <div className="h-screen flex flex-col" style={{ background: '#f8fafc' }}>
        {groupedMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-3xl w-full text-center">
              <div className="mx-auto mb-4">
                <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{ width: 64, height: 64, borderRadius: 14, margin: '0 auto' }}>
                  <rect width="40" height="40" rx="9" fill="#29B2FE" />
                  <text x="50%" y="54%" dominantBaseline="central" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill="white">M</text>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-[#111827]">Bem-vindo ao Suporte Markfy</h1>
              <p className="text-[#6B7280] mt-2 text-base">Como podemos te ajudar hoje?</p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {suggestedTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => processMessage(topic)}
                    className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:text-[#29B2FE] hover:border-[#29B2FE] transition-colors"
                    style={{ borderColor: '#D1D5DB' }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {groupedMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' ? (
                  <div className="max-w-[75%]">
                    <div className="flex items-start gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#29B2FE] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-1">M</div>
                      <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-1 ml-10">{formatTime(msg.createdAt)}</p>
                  </div>
                ) : (
                  <div className="max-w-[75%]">
                    <div className="rounded-2xl px-4 py-3 text-sm text-white whitespace-pre-wrap" style={{ background: '#29B2FE' }}>
                      {msg.content}
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-1 text-right">{formatTime(msg.createdAt)}</p>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#6B7280]">
                  <Loader2 size={14} className="animate-spin" />
                  Digitando resposta...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </main>
        )}

        <footer className="px-6 pb-6">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm p-3">
            {attachment && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EFF6FF] text-[#1D4ED8] px-3 py-1 text-xs font-medium">
                📎 {attachment.name}
                <button type="button" onClick={() => setAttachment(null)}>
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
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 w-11 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#29B2FE]"
                title="Anexar screenshot"
              >
                <Paperclip size={18} />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type message..."
                rows={1}
                className="flex-1 min-h-[44px] max-h-40 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={(!input.trim() && !attachment) || isLoading}
                className="h-11 w-11 rounded-lg flex items-center justify-center text-white disabled:opacity-50"
                style={{ background: '#29B2FE' }}
              >
                <SendHorizontal size={18} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </SupportSidebarLayout>
  );
};

export default Suporte;
