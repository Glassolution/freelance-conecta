import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Paperclip, SendHorizontal, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SupportSidebarLayout from '@/components/support/SupportSidebarLayout';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  buttons?: { label: string; value: string }[];
}

type RefundStep =
  | 'idle'
  | 'asked_confirmation'
  | 'checking'
  | 'eligible_awaiting_email'
  | 'not_eligible_choice'
  | 'submitted';

interface RefundCheckResult {
  eligible: boolean;
  reason: string;
  daysDiff?: number;
  plan?: string;
  planLabel?: string;
  startedFormatted?: string;
  profileEmail?: string;
  message: string;
}

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

const isRefundIntent = (text: string) => /reembolso|refund|estorno|cancelar/i.test(text);

const Suporte = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const [refundStep, setRefundStep] = useState<RefundStep>('idle');
  const [refundCheckResult, setRefundCheckResult] = useState<RefundCheckResult | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoStartedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pushMessage = (
    role: 'user' | 'assistant',
    content: string,
    buttons?: { label: string; value: string }[],
  ) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString(), buttons },
    ]);
  };

  // ── AI chat ──
  const askAI = async (conversation: ChatMessage[]) => {
    setIsLoading(true);
    const formatted = conversation.map((m) => ({ role: m.role, content: m.content }));
    const { data, error } = await supabase.functions.invoke('support-chat', {
      body: { messages: formatted },
    });
    setIsLoading(false);

    if (error) {
      toast({ title: 'Erro no suporte IA', description: error.message, variant: 'destructive' });
      return;
    }
    pushMessage('assistant', data?.reply || 'Não consegui responder agora.');
  };

  // ── Smart refund helpers ──
  const startRefundFlow = () => {
    setRefundStep('asked_confirmation');
    pushMessage(
      'assistant',
      'Você gostaria de solicitar um reembolso do seu plano atual?\nVou verificar sua elegibilidade automaticamente.',
      [
        { label: 'Sim, quero reembolso', value: 'refund_yes' },
        { label: 'Não, só tinha uma dúvida', value: 'refund_no' },
      ],
    );
  };

  const runRefundCheck = async () => {
    setRefundStep('checking');
    pushMessage('assistant', '🔍 Verificando sua assinatura...');
    setIsLoading(true);

    const { data, error } = await supabase.functions.invoke('smart-refund', {
      body: { action: 'check' },
    });

    setIsLoading(false);

    if (error) {
      pushMessage('assistant', 'Erro ao verificar elegibilidade. Tente novamente.');
      setRefundStep('idle');
      return;
    }

    const result = data as RefundCheckResult;
    setRefundCheckResult(result);

    if (result.reason === 'no_plan') {
      pushMessage('assistant', `⚠️ ${result.message}`);
      setRefundStep('idle');
      return;
    }

    if (result.eligible) {
      setRefundStep('eligible_awaiting_email');
      pushMessage(
        'assistant',
        `✅ Boa notícia! Verificamos que você ativou seu plano há ${result.daysDiff} dias e está dentro do prazo de reembolso.\n\n📋 **Resumo:**\n- Plano: ${result.planLabel}\n- Ativado em: ${result.startedFormatted}\n- Dias desde ativação: ${result.daysDiff} dias\n- Status: ✅ Elegível para reembolso\n\nPara confirmar o reembolso, **confirme seu email cadastrado**:`,
      );
    } else {
      setRefundStep('not_eligible_choice');
      pushMessage(
        'assistant',
        `⚠️ Infelizmente seu pedido de reembolso não pode ser processado.\n\n📋 **Verificação:**\n- Plano: ${result.planLabel}\n- Ativado em: ${result.startedFormatted}\n- Dias desde ativação: ${result.daysDiff} dias\n- Prazo para reembolso: 7 dias\n- Status: ❌ Fora do prazo\n\nNossa política permite reembolso apenas nos primeiros 7 dias após a contratação.\n\nPosso oferecer duas opções:`,
        [
          { label: '❌ Cancelar assinatura', value: 'cancel_sub' },
          { label: '✅ Manter meu plano', value: 'keep_plan' },
        ],
      );
    }
  };

  const processApprovedRefund = async (emailInput: string) => {
    if (!emailInput.includes('@')) {
      pushMessage('assistant', 'Por favor, informe um email válido.');
      return;
    }

    if (refundCheckResult?.profileEmail && emailInput.trim().toLowerCase() !== refundCheckResult.profileEmail.toLowerCase()) {
      pushMessage('assistant', 'O email informado não corresponde ao email cadastrado na sua conta. Tente novamente.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.functions.invoke('smart-refund', {
      body: { action: 'approve', reason: refundReason || 'Solicitado pelo usuário', email: emailInput },
    });
    setIsLoading(false);

    if (error) {
      pushMessage('assistant', 'Erro ao processar reembolso. Tente novamente.');
      return;
    }

    setRefundStep('submitted');
    pushMessage(
      'assistant',
      '✅ **Reembolso aprovado e assinatura cancelada!**\n\n💰 O valor será estornado em até 5 dias úteis via Mercado Pago para o método de pagamento original.\n\nSeu acesso ao dashboard será encerrado agora.\nObrigado por usar a Markfy!',
    );

    setTimeout(() => navigate('/'), 3000);
  };

  const processCancelOnly = async () => {
    setIsLoading(true);
    const { error } = await supabase.functions.invoke('smart-refund', {
      body: { action: 'cancel_only', reason: 'outside_7_day_window' },
    });
    setIsLoading(false);

    if (error) {
      pushMessage('assistant', 'Erro ao cancelar assinatura. Tente novamente.');
      return;
    }

    setRefundStep('submitted');
    pushMessage(
      'assistant',
      'Assinatura cancelada. Você terá acesso até o fim do período já pago.\nApós isso, seu plano volta para Gratuito.',
    );
  };

  // ── Button handler ──
  const handleButtonClick = async (value: string) => {
    if (value === 'refund_yes') {
      pushMessage('user', 'Sim, quero reembolso');
      await runRefundCheck();
    } else if (value === 'refund_no') {
      pushMessage('user', 'Não, só tinha uma dúvida');
      setRefundStep('idle');
      pushMessage('assistant', 'Entendido! Em que mais posso ajudar? 😊');
    } else if (value === 'cancel_sub') {
      pushMessage('user', 'Cancelar assinatura');
      await processCancelOnly();
    } else if (value === 'keep_plan') {
      pushMessage('user', 'Manter meu plano');
      setRefundStep('idle');
      pushMessage('assistant', 'Ótima escolha! Seu plano continua ativo.\nSe precisar de mais ajuda, estou aqui! 😊');
    }
  };

  // ── Main message processor ──
  const processMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Handle refund sub-steps
    if (refundStep === 'eligible_awaiting_email') {
      await processApprovedRefund(text);
      return;
    }

    // Detect refund intent
    if (refundStep === 'idle' && isRefundIntent(text)) {
      setRefundReason(text);
      startRefundFlow();
      return;
    }

    // Default: ask AI
    await askAI([...messages, userMsg]);
  };

  const handleSend = async () => {
    await processMessage(input);
    setInput('');
    setAttachment(null);
  };

  // Auto-start refund from URL param
  useEffect(() => {
    if (searchParams.get('type') !== 'refund' || autoStartedRef.current) return;
    autoStartedRef.current = true;
    setRefundReason('Solicitado via link de reembolso');
    setTimeout(() => {
      pushMessage('user', 'Olá! Gostaria de solicitar um reembolso.');
      startRefundFlow();
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const grouped = useMemo(() => messages, [messages]);

  return (
    <SupportSidebarLayout active="suporte">
      <div className="h-screen flex flex-col" style={{ background: '#f8fafc' }}>
        {grouped.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-3xl w-full text-center">
              <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{ width: 64, height: 64, borderRadius: 14, margin: '0 auto 16px' }}>
                <rect width="40" height="40" rx="9" fill="#29B2FE" />
                <text x="50%" y="54%" dominantBaseline="central" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill="white">M</text>
              </svg>
              <h1 className="text-3xl font-bold text-[#111827]">Bem-vindo ao Suporte Markfy</h1>
              <p className="text-[#6B7280] mt-2 text-base">Como podemos te ajudar hoje?</p>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
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
            {grouped.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' ? (
                  <div className="max-w-[75%]">
                    <div className="flex items-start gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#29B2FE] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-1">M</div>
                      <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827]">
                        <div className="prose prose-sm max-w-none [&_p]:mb-1 [&_p]:mt-0 [&_ul]:mb-1 [&_li]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {msg.buttons && msg.buttons.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {msg.buttons.map((btn) => (
                              <button
                                key={btn.value}
                                onClick={() => handleButtonClick(btn.value)}
                                className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors hover:border-[#29B2FE] hover:text-[#29B2FE]"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        )}
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
                  Verificando...
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
                <button type="button" onClick={() => setAttachment(null)}><X size={12} /></button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="h-11 w-11 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#29B2FE]" title="Anexar screenshot">
                <Paperclip size={18} />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="flex-1 min-h-[44px] max-h-40 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none resize-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
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
