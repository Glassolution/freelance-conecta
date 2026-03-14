import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Loader2, Lock } from 'lucide-react';
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
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border text-foreground">
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
      return { value: 'R$ 83,25/mês', detail: 'cobrado anualmente' };
    }
    return { value: 'R$ 99,90/mês', detail: '' };
  }, [billingCycle]);

  const subscribeButtonContent = (plan: PaidPlan) => {
    if (loadingPlan === plan) {
      return (
        <>
          <Loader2 size={16} className="animate-spin" />
          Processando...
        </>
      );
    }

    const icon = user ? <CreditCard size={16} /> : <Lock size={16} />;
    const label = plan === 'mensal' ? 'Obter plano Pro' : 'Obter plano Max';

    return (
      <>
        {icon}
        {label}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {(reason === 'no_plan' || reason === 'expired') && (
        <div className="border-b border-border bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
          {reason === 'no_plan'
            ? 'Assine um plano para acessar o dashboard'
            : 'Seu plano expirou. Renove para continuar acessando o dashboard.'}
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Voltar para a página inicial
          </button>
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Planos que crescem com você</h1>
          <div className="mt-6">
            <div className="inline-flex rounded-full border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('mensal')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  billingCycle === 'mensal'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('anual')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  billingCycle === 'anual'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Anual — Economize 17%
              </button>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Free */}
          <article className="flex flex-col rounded-2xl border border-border bg-background p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <PlantIcon level={1} />
            <h2 className="mt-6 text-2xl font-semibold">Free</h2>
            <p className="mt-1 text-sm text-muted-foreground">Conheça a Markfy</p>
            <p className="mt-6 text-4xl font-bold">R$ 0</p>

            <button
              type="button"
              onClick={handleFreeStart}
              className="mt-6 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Use a Markfy gratuitamente
            </button>

            <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 text-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* Pro */}
          <article className="flex flex-col rounded-2xl border-2 border-primary bg-background p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <PlantIcon level={2} />
            <h2 className="mt-6 text-2xl font-semibold">Pro</h2>
            <p className="mt-1 text-sm text-muted-foreground">Trabalhe e cresça como freelancer</p>
            <p className="mt-6 text-4xl font-bold">{proPrice.value}</p>
            {proPrice.detail && <p className="mt-1 text-xs text-muted-foreground">{proPrice.detail}</p>}

            <button
              type="button"
              onClick={() => handleSubscribe('mensal')}
              disabled={loadingPlan === 'mensal'}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {subscribeButtonContent('mensal')}
            </button>

            <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 text-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* Max */}
          <article className="flex flex-col rounded-2xl border border-border bg-background p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <PlantIcon level={3} />
            <h2 className="mt-6 text-2xl font-semibold">Max</h2>
            <p className="mt-1 text-sm text-muted-foreground">Limites maiores, acesso prioritário</p>
            <p className="mt-6 text-4xl font-bold">R$ 149,90/mês</p>
            <p className="mt-1 text-xs text-muted-foreground">cobrado trimestralmente</p>

            <button
              type="button"
              onClick={() => handleSubscribe('trimestral')}
              disabled={loadingPlan === 'trimestral'}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {subscribeButtonContent('trimestral')}
            </button>

            <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
              {maxFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 text-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          *Limites de uso se aplicam. Os preços exibidos não incluem impostos aplicáveis.
        </p>
      </main>
    </div>
  );
};

export default Pricing;
