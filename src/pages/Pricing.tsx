import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type BillingCycle = 'mensal' | 'anual';
type PaidPlan = 'mensal' | 'trimestral';

const freeFeatures = [
  'Acesso ao marketplace geral',
  'Veja vagas de 4 plataformas',
  'Filtros básicos',
  'Perfil de freelancer',
  'Suporte por chat',
];

const proFeatures = [
  'Tudo do Free e:',
  'Marketplace Markfy completo',
  'Meus Anúncios ilimitados',
  'Envio de propostas ilimitado',
  'Meus Clientes',
  'Mensagens com clientes',
  'Suporte prioritário com IA',
  'Relatório mensal de vagas',
];

const maxFeatures = [
  'Tudo do Pro, mais:',
  '3x mais visibilidade nos anúncios',
  'Badge "Verificado" no perfil',
  'Acesso antecipado a novos recursos',
  'Suporte prioritário com resposta em 2h',
  'Relatórios avançados de mercado',
  'Destaque no marketplace Markfy',
];

const PlantIcon = ({ level = 1 }: { level?: 1 | 2 | 3 }) => {
  const bloom = level === 1 ? 'h-3 w-3' : level === 2 ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[hsl(var(--pricing-border))] text-[hsl(var(--pricing-text))]">
      <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
        <path d="M24 40V23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 28c-6 0-11-4-11-10 6 0 11 4 11 10Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 28c6 0 11-4 11-10-6 0-11 4-11 10Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="24" cy="14" r="2" className={bloom} fill="currentColor" />
      </svg>
    </div>
  );
};

const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('mensal');

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');

    if (paymentStatus === 'success') {
      toast({
        title: 'Pagamento aprovado!',
        description: 'Bem-vindo ao seu novo plano. Você será redirecionado em breve.',
      });

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

  const handleSubscribe = async (planType: PaidPlan) => {
    setLoadingPlan(planType);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      localStorage.setItem('markfy_redirect_after_login', '/pricing');
      toast({
        title: 'Faça login para assinar um plano',
        description: 'Você será redirecionado para a página de login.',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/auth'), 1000);
      setLoadingPlan(null);
      return;
    }

    navigate(`/checkout?plan=${planType}`);
    setLoadingPlan(null);
  };

  const handleFreeStart = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard');
      return;
    }
    navigate('/auth');
  };

  const reason = searchParams.get('reason');

  const proPrice = useMemo(() => {
    if (billingCycle === 'anual') {
      return {
        value: 'R$ 83,25 BRL/mês',
        detail: 'cobrado anualmente',
      };
    }

    return {
      value: 'R$ 99,90 BRL/mês',
      detail: '',
    };
  }, [billingCycle]);

  const billingToggle = (
    <div className="inline-flex rounded-full border border-[hsl(var(--pricing-border))] bg-[hsl(var(--pricing-card))] p-1">
      <button
        type="button"
        onClick={() => setBillingCycle('mensal')}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
          billingCycle === 'mensal'
            ? 'bg-[hsl(var(--pricing-text))] text-[hsl(var(--pricing-button-text))]'
            : 'text-[hsl(var(--pricing-muted))]'
        }`}
      >
        Mensal
      </button>
      <button
        type="button"
        onClick={() => setBillingCycle('anual')}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
          billingCycle === 'anual'
            ? 'bg-[hsl(var(--pricing-text))] text-[hsl(var(--pricing-button-text))]'
            : 'text-[hsl(var(--pricing-muted))]'
        }`}
      >
        Anual — Economize 17%
      </button>
    </div>
  );

  const subscribeButtonContent = (plan: PaidPlan) => {
    if (loadingPlan === plan) {
      return (
        <>
          <Loader2 size={16} className="animate-spin" />
          Processando...
        </>
      );
    }

    if (user) {
      return (
        <>
          <CreditCard size={16} />
          {plan === 'mensal' ? 'Obter plano Pro' : 'Obter plano Max'}
        </>
      );
    }

    return (
      <>
        <Lock size={16} />
        {plan === 'mensal' ? 'Obter plano Pro' : 'Obter plano Max'}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--pricing-bg))] text-[hsl(var(--pricing-text))]">
      {(reason === 'no_plan' || reason === 'expired') && (
        <div className="border-b border-[hsl(var(--pricing-border))] bg-[hsl(var(--pricing-card))] px-4 py-3 text-center text-sm text-[hsl(var(--pricing-muted))]">
          {reason === 'no_plan'
            ? 'Assine um plano para acessar o dashboard'
            : 'Seu plano expirou. Renove para continuar acessando o dashboard.'}
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Planos que crescem com você</h1>
          <div className="mt-6">{billingToggle}</div>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="flex flex-col rounded-2xl border border-[hsl(var(--pricing-border))] bg-[hsl(var(--pricing-card))] p-8">
            <PlantIcon level={1} />
            <h2 className="mt-6 text-2xl font-semibold">Free</h2>
            <p className="mt-1 text-sm text-[hsl(var(--pricing-muted))]">Conheça a Markfy</p>
            <p className="mt-6 text-4xl font-bold">R$ 0</p>

            <button
              type="button"
              onClick={handleFreeStart}
              className="mt-6 rounded-xl border border-[hsl(var(--pricing-text))] bg-transparent px-4 py-3 text-sm font-semibold text-[hsl(var(--pricing-text))] transition-opacity hover:opacity-90"
            >
              Use a Markfy gratuitamente
            </button>

            <ul className="mt-7 space-y-3 text-sm text-[hsl(var(--pricing-soft))]">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 text-[hsl(var(--pricing-text))]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="flex flex-col rounded-2xl border border-[hsl(var(--pricing-border-strong))] bg-[hsl(var(--pricing-card))] p-8">
            <PlantIcon level={2} />
            <div className="mt-4">{billingToggle}</div>
            <h2 className="mt-4 text-2xl font-semibold">Pro</h2>
            <p className="mt-1 text-sm text-[hsl(var(--pricing-muted))]">Trabalhe e cresça como freelancer</p>
            <p className="mt-6 text-4xl font-bold">{proPrice.value}</p>
            {proPrice.detail && <p className="mt-1 text-xs text-[hsl(var(--pricing-muted))]">{proPrice.detail}</p>}

            <button
              type="button"
              onClick={() => handleSubscribe('mensal')}
              disabled={loadingPlan === 'mensal'}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--pricing-text))] px-4 py-3 text-sm font-semibold text-[hsl(var(--pricing-button-text))] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {subscribeButtonContent('mensal')}
            </button>

            <ul className="mt-7 space-y-3 text-sm text-[hsl(var(--pricing-soft))]">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 text-[hsl(var(--pricing-text))]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="flex flex-col rounded-2xl border border-[hsl(var(--pricing-border))] bg-[hsl(var(--pricing-card))] p-8">
            <PlantIcon level={3} />
            <h2 className="mt-6 text-2xl font-semibold">Max</h2>
            <p className="mt-1 text-sm text-[hsl(var(--pricing-muted))]">Limites maiores, acesso prioritário</p>
            <p className="mt-6 text-4xl font-bold">A partir de R$ 149,90</p>
            <p className="mt-1 text-xs text-[hsl(var(--pricing-muted))]">BRL/mês cobrado trimestralmente</p>

            <button
              type="button"
              onClick={() => handleSubscribe('trimestral')}
              disabled={loadingPlan === 'trimestral'}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--pricing-text))] px-4 py-3 text-sm font-semibold text-[hsl(var(--pricing-button-text))] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {subscribeButtonContent('trimestral')}
            </button>

            <ul className="mt-7 space-y-3 text-sm text-[hsl(var(--pricing-soft))]">
              {maxFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 text-[hsl(var(--pricing-text))]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <p className="mt-8 text-center text-xs text-[hsl(var(--pricing-muted))]">
          *Limites de uso se aplicam. Os preços exibidos não incluem impostos aplicáveis.
        </p>
      </main>
    </div>
  );
};

export default Pricing;
