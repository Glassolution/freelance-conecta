import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, SendHorizontal, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

type RefundStep = 'idle' | 'awaiting_reason' | 'awaiting_email' | 'submitted';

const suggestedQuestions = [
  'Como funciona o marketplace?',
  'Como cancelar meu plano?',
  'Não consigo acessar o dashboard',
  'Quero solicitar reembolso',
];

const Suporte = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [refundStep, setRefundStep] = useState<RefundStep>('idle');
  const [refundReason, setRefundReason] = useState('');

  const autoStartedRefundRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pushMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      role,
      content,
      createdAt: new Date().toISOString(),
    }]);
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
        title: isRateLimit
          ? 'Muitas solicitações'
          : isPaymentRequired
            ? 'Créditos insuficientes'
            : 'Erro no suporte IA',
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
    const { error } = await supabase.functions.invoke('support-refund-request', {
      body: { reason, email },
    });

    if (error) {
      toast({ title: 'Erro ao registrar reembolso', description: error.message, variant: 'destructive' });
      return;
    }

    await supabase.from('notifications').insert({
      user_id: user?.id,
      title: 'Solicitação de reembolso registrada',
      message: 'Recebemos sua solicitação. Nossa equipe vai analisar em até 5 dias úteis.',
      type: 'refund',
    } as any);
  };

  const processMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (refundStep === 'awaiting_reason') {
      setRefundReason(trimmed);
      setRefundStep('awaiting_email');
      pushMessage('assistant', 'Perfeito. Agora confirme seu email cadastrado para concluirmos o pedido.');
      return;
    }

    if (refundStep === 'awaiting_email') {
      if (!trimmed.includes('@')) {
        pushMessage('assistant', 'Por favor, informe um email válido para continuar a solicitação de reembolso.');
        return;
      }

      await saveRefundRequest(refundReason, trimmed);
      setRefundStep('submitted');
      pushMessage('assistant', 'Vou registrar sua solicitação. O reembolso será processado em até 5 dias úteis via Mercado Pago.');
      return;
    }

    if (isRefundIntent(trimmed)) {
      setRefundStep('awaiting_reason');
      pushMessage('assistant', 'Claro! Qual o motivo do reembolso?');
      return;
    }

    await askAI([...messages, userMessage]);
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
        content: 'Claro! Qual o motivo do reembolso?',
        createdAt: new Date().toISOString(),
      },
    ]);
    setRefundStep('awaiting_reason');
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const groupedMessages = useMemo(() => {
    return messages;
  }, [messages]);

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FC' }}>
      <div className="max-w-5xl mx-auto h-screen flex flex-col">
        <header className="h-16 bg-white border-b border-[#E8ECF4] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-[#6B7280] hover:text-[#111] flex items-center gap-1"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#111]">Suporte Markfy</h1>
              <p className="text-xs text-[#9CA3B4]">Powered by IA</p>
            </div>
          </div>
        </header>

        <div className="px-6 pt-4 pb-2 bg-white border-b border-[#E8ECF4]">
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                onClick={() => processMessage(question)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#E8ECF4] text-[#374151] hover:bg-[#F8F9FC]"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {groupedMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <p className="text-sm text-[#6B7280]">Como posso te ajudar hoje?</p>
                <p className="text-xs text-[#9CA3B4] mt-1">Faça uma pergunta sobre planos, suporte técnico ou reembolso.</p>
              </div>
            </div>
          ) : (
            groupedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap"
                  style={{
                    background: msg.role === 'user' ? '#29B2FE' : '#FFFFFF',
                    color: msg.role === 'user' ? '#FFFFFF' : '#111827',
                    border: msg.role === 'assistant' ? '1px solid #E8ECF4' : 'none',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-white border border-[#E8ECF4] flex items-center gap-2 text-[#6B7280]">
                <Loader2 size={14} className="animate-spin" />
                Digitando resposta...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 bg-white border-t border-[#E8ECF4] shrink-0">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  processMessage(input);
                  setInput('');
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 min-h-[44px] max-h-40 rounded-xl border border-[#E8ECF4] px-3 py-2 text-sm outline-none resize-none"
            />
            <button
              onClick={() => {
                processMessage(input);
                setInput('');
              }}
              disabled={!input.trim() || isLoading}
              className="h-11 w-11 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
              style={{ background: '#29B2FE' }}
            >
              <SendHorizontal size={18} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Suporte;
