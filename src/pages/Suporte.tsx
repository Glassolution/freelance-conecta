import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Paperclip, SendHorizontal, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

const topics = ['Marketplace', 'Planos e Pagamento', 'Problemas Técnicos', 'Minha Conta', 'Reembolso'];

const isRefundIntent = (text: string) => /reembolso|refund|estorno|cancelar/i.test(text);

const Suporte = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

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

  const pushMessage = (role: 'user' | 'assistant', content: string, buttons?: { label: string; value: string }[]) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString(), buttons }]);
  };

  const askAI = async (conversation: ChatMessage[]) => {
    setIsLoading(true);
    const formatted = conversation.map((m) => ({ role: m.role, content: m.content }));
    const { data, error } = await supabase.functions.invoke('support-chat', { body: { messages: formatted } });
    setIsLoading(false);
    if (error) { toast({ title: 'Erro no suporte IA', description: error.message, variant: 'destructive' }); return; }
    pushMessage('assistant', data?.reply || 'Não consegui responder agora.');
  };

  const startRefundFlow = () => {
    setRefundStep('asked_confirmation');
    pushMessage('assistant', 'Você gostaria de solicitar um reembolso do seu plano atual?\nVou verificar sua elegibilidade automaticamente.', [
      { label: 'Sim, quero reembolso', value: 'refund_yes' },
      { label: 'Não, só tinha uma dúvida', value: 'refund_no' },
    ]);
  };

  const runRefundCheck = async () => {
    setRefundStep('checking');
    pushMessage('assistant', '🔍 Verificando sua assinatura...');
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke('smart-refund', { body: { action: 'check' } });
    setIsLoading(false);
    if (error) { pushMessage('assistant', 'Erro ao verificar elegibilidade. Tente novamente.'); setRefundStep('idle'); return; }
    const result = data as RefundCheckResult;
    setRefundCheckResult(result);
    if (result.reason === 'no_plan') { pushMessage('assistant', `⚠️ ${result.message}`); setRefundStep('idle'); return; }
    if (result.eligible) {
      setRefundStep('eligible_awaiting_email');
      pushMessage('assistant', `✅ Boa notícia! Verificamos que você ativou seu plano há ${result.daysDiff} dias e está dentro do prazo de reembolso.\n\n📋 **Resumo:**\n- Plano: ${result.planLabel}\n- Ativado em: ${result.startedFormatted}\n- Dias desde ativação: ${result.daysDiff} dias\n- Status: ✅ Elegível para reembolso\n\nPara confirmar o reembolso, **confirme seu email cadastrado**:`);
    } else {
      setRefundStep('not_eligible_choice');
      pushMessage('assistant', `⚠️ Infelizmente seu pedido de reembolso não pode ser processado.\n\n📋 **Verificação:**\n- Plano: ${result.planLabel}\n- Ativado em: ${result.startedFormatted}\n- Dias desde ativação: ${result.daysDiff} dias\n- Prazo para reembolso: 7 dias\n- Status: ❌ Fora do prazo\n\nNossa política permite reembolso apenas nos primeiros 7 dias após a contratação.\n\nPosso oferecer duas opções:`, [
        { label: '❌ Cancelar assinatura', value: 'cancel_sub' },
        { label: '✅ Manter meu plano', value: 'keep_plan' },
      ]);
    }
  };

  const processApprovedRefund = async (emailInput: string) => {
    if (!emailInput.includes('@')) { pushMessage('assistant', 'Por favor, informe um email válido.'); return; }
    if (refundCheckResult?.profileEmail && emailInput.trim().toLowerCase() !== refundCheckResult.profileEmail.toLowerCase()) {
      pushMessage('assistant', 'O email informado não corresponde ao email cadastrado na sua conta. Tente novamente.'); return;
    }
    setIsLoading(true);
    const { error } = await supabase.functions.invoke('smart-refund', { body: { action: 'approve', reason: refundReason || 'Solicitado pelo usuário', email: emailInput } });
    setIsLoading(false);
    if (error) { pushMessage('assistant', 'Erro ao processar reembolso. Tente novamente.'); return; }
    setRefundStep('submitted');
    pushMessage('assistant', '✅ **Reembolso aprovado e assinatura cancelada!**\n\n💰 O valor será estornado em até 5 dias úteis via Mercado Pago para o método de pagamento original.\n\nSeu acesso ao dashboard será encerrado agora.\nObrigado por usar a Markfy!');
    setTimeout(() => navigate('/'), 3000);
  };

  const processCancelOnly = async () => {
    setIsLoading(true);
    const { error } = await supabase.functions.invoke('smart-refund', { body: { action: 'cancel_only', reason: 'outside_7_day_window' } });
    setIsLoading(false);
    if (error) { pushMessage('assistant', 'Erro ao cancelar assinatura. Tente novamente.'); return; }
    setRefundStep('submitted');
    pushMessage('assistant', 'Assinatura cancelada. Você terá acesso até o fim do período já pago.\nApós isso, seu plano volta para Gratuito.');
  };

  const handleButtonClick = async (value: string) => {
    if (value === 'refund_yes') { pushMessage('user', 'Sim, quero reembolso'); await runRefundCheck(); }
    else if (value === 'refund_no') { pushMessage('user', 'Não, só tinha uma dúvida'); setRefundStep('idle'); pushMessage('assistant', 'Entendido! Em que mais posso ajudar? 😊'); }
    else if (value === 'cancel_sub') { pushMessage('user', 'Cancelar assinatura'); await processCancelOnly(); }
    else if (value === 'keep_plan') { pushMessage('user', 'Manter meu plano'); setRefundStep('idle'); pushMessage('assistant', 'Ótima escolha! Seu plano continua ativo.\nSe precisar de mais ajuda, estou aqui! 😊'); }
  };

  const processMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    if (refundStep === 'eligible_awaiting_email') { await processApprovedRefund(text); return; }
    if (refundStep === 'idle' && isRefundIntent(text)) { setRefundReason(text); startRefundFlow(); return; }
    await askAI([...messages, userMsg]);
  };

  const handleSend = async () => { await processMessage(input); setInput(''); setAttachment(null); };

  useEffect(() => {
    if (searchParams.get('type') !== 'refund' || autoStartedRef.current) return;
    autoStartedRef.current = true;
    setRefundReason('Solicitado via link de reembolso');
    setTimeout(() => { pushMessage('user', 'Olá! Gostaria de solicitar um reembolso.'); startRefundFlow(); }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const grouped = useMemo(() => messages, [messages]);
  const hasMessages = grouped.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <header className="h-14 shrink-0 flex items-center px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: '#888' }}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </header>

      {/* Messages / Empty state */}
      <div className="flex-1 overflow-y-auto pb-28">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center" style={{ minHeight: '70vh', gap: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#29B2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white', fontWeight: 800 }}>M</div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: 'white', textAlign: 'center' }}>Como posso te ajudar, {userName}?</h1>
            <div className="flex flex-wrap justify-center gap-2">
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => processMessage(topic)}
                  className="transition-colors"
                  style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #333', background: 'transparent', color: '#ccc', fontSize: 13, cursor: 'pointer' }}
                  onMouseOver={(e) => { (e.target as HTMLElement).style.borderColor = '#29B2FE'; }}
                  onMouseOut={(e) => { (e.target as HTMLElement).style.borderColor = '#333'; }}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto space-y-6 px-4 py-6" style={{ maxWidth: 680 }}>
            {grouped.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'assistant' ? (
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold" style={{ background: '#29B2FE' }}>M</div>
                    <div className="min-w-0">
                      <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-1 [&_p]:mt-0 [&_ul]:mb-1 [&_li]:mb-0 [&_strong]:text-white" style={{ color: '#e5e5e5' }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.buttons.map((btn) => (
                            <button
                              key={btn.value}
                              onClick={() => handleButtonClick(btn.value)}
                              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
                              style={{ border: '1px solid #444', color: '#ccc', background: 'transparent' }}
                              onMouseOver={(e) => { (e.target as HTMLElement).style.borderColor = '#29B2FE'; (e.target as HTMLElement).style.color = '#29B2FE'; }}
                              onMouseOut={(e) => { (e.target as HTMLElement).style.borderColor = '#444'; (e.target as HTMLElement).style.color = '#ccc'; }}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap" style={{ background: '#2a2a2a', color: 'white', maxWidth: '75%' }}>
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ background: '#29B2FE' }}>M</div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                  <Loader2 size={14} className="animate-spin" /> Pensando...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed input bar */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 680, padding: '0 16px', zIndex: 50 }}>
        <div style={{ background: '#2a2a2a', borderRadius: 16, border: '1px solid #333', padding: '12px 16px' }}>
          {attachment && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium" style={{ background: '#333', color: '#aaa' }}>
              📎 {attachment.name}
              <button type="button" onClick={() => setAttachment(null)}><X size={12} /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18 }} title="Anexar">📎</button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Como posso ajudar você hoje?"
              className="flex-1 bg-transparent border-none text-white outline-none"
              style={{ fontSize: 15 }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <span style={{ color: '#666', fontSize: 12, whiteSpace: 'nowrap' }}>Markfy AI</span>
            <button
              type="button"
              onClick={handleSend}
              disabled={(!input.trim() && !attachment) || isLoading}
              style={{ background: '#29B2FE', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'white', cursor: 'pointer', opacity: (!input.trim() && !attachment) || isLoading ? 0.5 : 1 }}
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suporte;
