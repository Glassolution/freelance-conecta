import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Check, Search, ArrowLeft, CreditCard, Loader2, Lock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 1.00,
    priceDisplay: 'R$ 1,00',
    period: '/mês',
    description: 'Acesso completo à plataforma',
    testPrice: true,
    features: [
      'Vagas ilimitadas de 4 plataformas',
      'Alertas instantâneos de vagas',
      'Filtros avançados',
      'Compare oportunidades side-by-side',
      'Vagas nacionais e internacionais',
      'Suporte por email',
    ],
    popular: false,
  },
  {
    id: 'trimestral',
    name: 'Trimestral',
    price: 149.90,
    priceDisplay: 'R$ 149,90',
    period: '/trimestre',
    description: 'Economize 50% comparado ao mensal',
    savings: 'Economize R$ 149,80',
    features: [
      'Tudo do plano Mensal',
      'Perfil único em todas as plataformas',
      'Prioridade nos alertas',
      'Relatório mensal de mercado',
      'Suporte prioritário',
      'Acesso antecipado a novos recursos',
    ],
    popular: true,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkSession();
  }, [user]);

  // Handle payment callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast({
        title: 'Pagamento aprovado!',
        description: 'Bem-vindo ao seu novo plano. Você será redirecionado em breve.',
      });
      
      // Update user plan in Supabase
      if (user?.id) {
        supabase
          .from('profiles')
          .update({ plan: 'mensal' })
          .eq('id', user.id)
          .then(() => {
            setTimeout(() => navigate('/dashboard'), 2000);
          });
      }
    }
    
    if (paymentStatus === 'failure') {
      toast({
        title: 'Pagamento não aprovado',
        description: 'Tente novamente ou use outro método de pagamento.',
        variant: 'destructive',
      });
    }
  }, [searchParams, user?.id, navigate, toast]);

  const handleSubscribe = async (planType: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Save intended destination
      localStorage.setItem('markfy_redirect_after_login', '/pricing');
      // Show toast then redirect
      toast({
        title: 'Faça login para assinar um plano',
        description: 'Você será redirecionado para a página de login.',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/auth'), 1500);
      return;
    }

    // User is logged in — proceed with payment
    const plan = plans.find(p => p.id === planType);
    if (plan) {
      handleSelectPlan(plan);
    }
  };

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    navigate(`/checkout?plan=${plan.id}`);
  };

  const handleBack = () => {
    navigate('/', { replace: true });
  };

  const reason = searchParams.get('reason');

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'Inter, sans-serif' }}>
      {/* Reason Banner */}
      {reason === 'no_plan' && (
        <div style={{
          background: '#fffbeb',
          borderBottom: '1px solid #f59e0b',
          padding: '12px 16px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500',
          color: '#92400e',
        }}>
          Assine um plano para acessar o dashboard
        </div>
      )}
      {reason === 'expired' && (
        <div style={{
          background: '#fef2f2',
          borderBottom: '1px solid #ef4444',
          padding: '12px 16px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500',
          color: '#991b1b',
        }}>
          Seu plano expirou. Renove para continuar acessando o dashboard.
        </div>
      )}

      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        <button
          onClick={() => void handleBack()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b7280',
            background: 'transparent',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '48px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      {/* Title Section */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#29B2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Search size={16} color="white" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#111827' }}>Markfy</span>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '800', color: '#111827', marginBottom: '16px', lineHeight: '1.2' }}>
          Escolha seu Plano
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '448px', margin: '0 auto' }}>
          Desbloqueie acesso completo às melhores vagas de freelancer do Brasil e do mundo.
        </p>
      </div>

      {/* Plans Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 80px' }}>
        <div style={{ display: 'flex', gap: '24px', maxWidth: '896px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                flex: '1',
                minWidth: '320px',
                maxWidth: '400px',
                borderRadius: '16px',
                background: 'white',
                padding: '32px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                border: plan.popular ? '2px solid #29B2FE' : '1px solid #e5e7eb',
                position: 'relative',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Blue glow for popular card */}
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '16px',
                    background: 'rgba(41,178,254,0.15)',
                    pointerEvents: 'none',
                    zIndex: -1,
                  }}
                />
              )}

              {/* Popular Badge */}
              {plan.popular && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: '#29B2FE',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '16px',
                  }}
                >
                  Mais popular
                </div>
              )}

              {/* Plan Name */}
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                {plan.name}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                {plan.description}
              </p>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: '40px', fontWeight: '800', color: '#111827' }}>
                  {plan.priceDisplay}
                </span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>{plan.period}</span>
              </div>

              {/* Test Price Note */}
              {(plan as any).testPrice && (
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '24px', textAlign: 'center' }}>
                  (Preço de teste)
                </p>
              )}

              {/* Savings Badge */}
              {plan.savings && (
                <div
                  style={{
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '24px',
                    textAlign: 'center',
                    background: 'rgba(41,178,254,0.1)',
                    border: '1px solid rgba(41,178,254,0.2)',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#29B2FE' }}>
                    {plan.savings}
                  </span>
                </div>
              )}

              {/* Features List */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1 }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <Check size={16} color="#29B2FE" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingPlan === plan.id}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: plan.popular ? 'none' : '2px solid #29B2FE',
                  background: plan.popular ? '#29B2FE' : 'white',
                  color: plan.popular ? 'white' : '#29B2FE',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  opacity: loadingPlan === plan.id ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (plan.popular) {
                    e.currentTarget.style.background = '#1a9ee8';
                  } else {
                    e.currentTarget.style.background = '#f0f9ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (plan.popular) {
                    e.currentTarget.style.background = '#29B2FE';
                  } else {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Processando...
                  </>
                ) : isLoggedIn ? (
                  <>
                    <CreditCard size={16} />
                    Assinar Agora
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Faça login primeiro
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '48px',
            padding: '24px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Pagamento seguro via Mercado Pago
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Cancele quando quiser
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Acesso imediato
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Pricing;
