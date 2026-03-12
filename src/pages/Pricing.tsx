import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const plans = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 99.90,
    priceDisplay: 'R$ 99,90',
    period: '/mês',
    description: 'Acesso completo à plataforma',
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
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: {
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          userEmail: user.email,
        },
      });

      if (error) throw error;

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Erro ao criar checkout:', err);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#060912' }}>
      {/* Header */}
      <div className="container mx-auto px-4 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white font-body text-sm transition-colors mb-12"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      {/* Title */}
      <div className="container mx-auto px-4 text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary))' }}>
            <Search size={14} className="text-white" />
          </div>
          <span className="font-heading font-extrabold text-xl text-white">Markfy</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl md:text-5xl text-white mb-4">
          Escolha seu Plano
        </h1>
        <p className="font-body text-white/50 text-base md:text-lg max-w-md mx-auto">
          Desbloqueie acesso completo às melhores vagas de freelancer do Brasil e do mundo.
        </p>
      </div>

      {/* Plans */}
      <div className="container mx-auto px-4 pb-20">
        <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex-1 rounded-2xl p-[1px] transition-transform hover:scale-[1.02]"
              style={{
                background: plan.popular
                  ? 'linear-gradient(135deg, hsl(var(--primary)), #a78bfa)'
                  : 'rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="rounded-2xl p-8 h-full flex flex-col"
                style={{ background: '#0D1525' }}
              >
                {plan.popular && (
                  <span
                    className="inline-flex self-start items-center px-3 py-1 rounded-full text-[11px] font-body font-bold uppercase tracking-wider mb-4"
                    style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
                  >
                    Mais popular
                  </span>
                )}

                <h3 className="font-heading font-bold text-xl text-white mb-1">{plan.name}</h3>
                <p className="font-body text-sm text-white/40 mb-6">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-heading font-extrabold text-4xl text-white">{plan.priceDisplay}</span>
                  <span className="font-body text-sm text-white/40">{plan.period}</span>
                </div>

                {plan.savings && (
                  <div
                    className="rounded-lg px-3 py-2 mb-6 text-center"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    <span className="font-body text-sm font-medium text-[#22C55E]">{plan.savings}</span>
                  </div>
                )}

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check size={16} className="shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
                      <span className="font-body text-sm text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loadingPlan === plan.id}
                  className="w-full py-3.5 rounded-xl font-body font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={
                    plan.popular
                      ? { background: 'hsl(var(--primary))', color: '#060912' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }
                  }
                >
                  {loadingPlan === plan.id ? (
                    <><Loader2 size={16} className="animate-spin" /> Processando...</>
                  ) : (
                    <><CreditCard size={16} /> Assinar Agora</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-white/30 font-body text-xs">
          <span>🔒 Pagamento seguro via Mercado Pago</span>
          <span>↩️ Cancele quando quiser</span>
          <span>⚡ Acesso imediato</span>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
