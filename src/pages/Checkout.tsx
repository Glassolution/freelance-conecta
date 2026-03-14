import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, QrCode, Landmark, Copy, Check, Loader2, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import MarkfyLogo from '@/components/MarkfyLogo';

const PLANS: Record<string, { name: string; price: number; priceDisplay: string; period: string; description: string }> = {
  mensal: { name: 'Pro', price: 99.90, priceDisplay: 'R$ 99,90', period: '/mês', description: 'Acesso completo à plataforma' },
  trimestral: { name: 'Trimestral', price: 149.90, priceDisplay: 'R$ 149,90', period: '/trimestre', description: 'Economize 50% comparado ao mensal' },
};

type PaymentTab = 'pix' | 'card' | 'boleto';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const planId = searchParams.get('plan') || 'mensal';
  const plan = PLANS[planId] || PLANS.mensal;

  const [activeTab, setActiveTab] = useState<PaymentTab>('pix');
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [pixQrBase64, setPixQrBase64] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(30 * 60); // 30 min
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Auth check
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Countdown
  useEffect(() => {
    if (pixCode && !paymentSuccess) {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [pixCode, paymentSuccess]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const generatePix = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mp-create-pix', {
        body: { planId, planName: plan.name, price: plan.price, userId: user.id, userEmail: user.email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPixCode(data.qr_code || '');
      setPixQrBase64(data.qr_code_base64 || '');
      setPaymentId(data.payment_id);

      // Start polling
      if (data.payment_id) {
        pollingRef.current = setInterval(async () => {
          try {
            const { data: checkData } = await supabase.functions.invoke('mp-check-payment', {
              body: { payment_id: data.payment_id },
            });
            if (checkData?.status === 'approved') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              if (countdownRef.current) clearInterval(countdownRef.current);
              setPaymentSuccess(true);
              setTimeout(() => navigate('/dashboard?welcome=true'), 3000);
            }
          } catch (e) {
            console.error('Poll error', e);
          }
        }, 5000);
      }
    } catch (err: any) {
      console.error('PIX error:', err);
      toast({ title: 'Erro ao gerar PIX', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({ title: 'Código PIX copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  // Success screen
  if (paymentSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', background: 'white', borderRadius: '24px', padding: '64px 48px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', maxWidth: '480px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            animation: 'scaleIn 0.5s ease'
          }}>
            <CheckCircle2 size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>Pagamento confirmado!</h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
            Seu plano <strong>{plan.name}</strong> foi ativado com sucesso.
          </p>
          <button
            onClick={() => navigate('/dashboard?welcome=true')}
            style={{
              padding: '14px 32px', borderRadius: '12px', background: '#29B2FE', color: 'white',
              border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Ir para o Dashboard →
          </button>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '16px' }}>Redirecionando automaticamente...</p>
        </div>
        <style>{`@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
      </div>
    );
  }

  const tabs: { id: PaymentTab; icon: typeof QrCode; label: string }[] = [
    { id: 'pix', icon: QrCode, label: 'PIX' },
    { id: 'card', icon: CreditCard, label: 'Cartão' },
    { id: 'boleto', icon: Landmark, label: 'Boleto' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MarkfyLogo size={32} />
            <span style={{ fontWeight: '800', fontSize: '18px', color: '#111827' }}>Markfy</span>
          </div>
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 16px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Order Summary */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Resumo do Pedido
            </h2>
            <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '16px', marginBottom: '16px' }}>
              <p style={{ fontWeight: '600', color: '#111827', fontSize: '16px' }}>Plano {plan.name} Markfy</p>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{plan.description}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Subtotal</span>
              <span style={{ color: '#111827', fontSize: '14px' }}>{plan.priceDisplay}</span>
            </div>
            <div style={{ borderTop: '2px solid #111827', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700', color: '#111827', fontSize: '18px' }}>Total</span>
              <span style={{ fontWeight: '800', color: '#111827', fontSize: '24px' }}>{plan.priceDisplay}</span>
            </div>
          </div>

          {/* Security badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={14} /> Pagamento seguro
            </span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>· SSL</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>· Mercado Pago</span>
          </div>
        </div>

        {/* Payment methods */}
        <div style={{ flex: '1.2', minWidth: '340px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>Método de pagamento</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '12px', border: activeTab === tab.id ? '2px solid #29B2FE' : '1px solid #e5e7eb',
                    background: activeTab === tab.id ? 'rgba(41,178,254,0.05)' : 'white',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  <tab.icon size={20} color={activeTab === tab.id ? '#29B2FE' : '#9ca3af'} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: activeTab === tab.id ? '#29B2FE' : '#6b7280' }}>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* PIX Tab */}
            {activeTab === 'pix' && (
              <div>
                {!pixCode ? (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                      Gere um QR Code PIX para pagamento instantâneo. Após o pagamento, seu plano será ativado automaticamente.
                    </p>
                    <button
                      onClick={generatePix}
                      disabled={loading}
                      style={{
                        width: '100%', padding: '16px', borderRadius: '12px', background: '#29B2FE', color: 'white',
                        border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Gerando PIX...</> : <><QrCode size={18} /> Gerar QR Code PIX</>}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    {pixQrBase64 && (
                      <div style={{ marginBottom: '24px' }}>
                        <img
                          src={`data:image/png;base64,${pixQrBase64}`}
                          alt="QR Code PIX"
                          style={{ width: '200px', height: '200px', margin: '0 auto', borderRadius: '12px' }}
                        />
                      </div>
                    )}
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>Ou copie o código PIX:</p>
                    <div style={{
                      background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px',
                      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
                    }}>
                      <input
                        readOnly
                        value={pixCode}
                        style={{ flex: 1, background: 'none', border: 'none', fontSize: '12px', color: '#374151', outline: 'none', fontFamily: 'monospace' }}
                      />
                      <button onClick={copyPixCode} style={{ background: '#29B2FE', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '13px', fontWeight: '600' }}>
                        {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                      </button>
                    </div>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                      <p style={{ fontSize: '13px', color: '#92400e' }}>
                        Código válido por <strong>{formatCountdown(countdown)}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#29B2FE' }}>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>Aguardando pagamento...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Card Tab */}
            {activeTab === 'card' && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Número do cartão</label>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Nome no cartão</label>
                  <input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Como impresso no cartão"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Validade</label>
                    <input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/AA"
                      maxLength={5}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>CVV</label>
                    <input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="000"
                      maxLength={4}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => toast({ title: 'Em breve', description: 'Pagamento com cartão em breve. Use PIX por enquanto.' })}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '12px', background: '#29B2FE', color: 'white',
                    border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <CreditCard size={18} /> Pagar {plan.priceDisplay}
                </button>
              </div>
            )}

            {/* Boleto Tab */}
            {activeTab === 'boleto' && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Landmark size={40} color="#d1d5db" style={{ marginBottom: '16px' }} />
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Pagamento com boleto estará disponível em breve.</p>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>Use PIX para pagamento instantâneo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Checkout;
