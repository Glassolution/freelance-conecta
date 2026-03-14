export type PlanCode = 'mensal' | 'trimestral' | 'anual' | 'free' | null | undefined | string;

type PlanBadgeVariant = 'pro' | 'max' | 'free';

export const getPlanLabel = (plan: PlanCode): string => {
  if (plan === 'mensal') return 'Pro';
  if (plan === 'trimestral' || plan === 'anual') return 'Max';
  return 'Gratuito';
};

export const getPlanBadgeVariant = (plan: PlanCode, isActive: boolean): PlanBadgeVariant => {
  if (!isActive || !plan || plan === 'free') return 'free';
  if (plan === 'mensal') return 'pro';
  return 'max';
};

export const getPlanAccentColor = (plan: PlanCode, isActive: boolean): string => {
  const variant = getPlanBadgeVariant(plan, isActive);

  if (variant === 'pro') return 'hsl(var(--markfy-plan-pro))';
  if (variant === 'max') return 'hsl(var(--markfy-plan-max))';
  return 'hsl(var(--markfy-plan-free))';
};

export const getPlanBadgeStyle = (plan: PlanCode, isActive: boolean): { background: string; color: string } => {
  const variant = getPlanBadgeVariant(plan, isActive);

  if (variant === 'pro') {
    return {
      background: 'hsl(var(--markfy-plan-pro))',
      color: 'hsl(var(--markfy-plan-badge-foreground))',
    };
  }

  if (variant === 'max') {
    return {
      background: 'hsl(var(--markfy-plan-max))',
      color: 'hsl(var(--markfy-plan-badge-foreground))',
    };
  }

  return {
    background: 'hsl(var(--markfy-plan-free))',
    color: 'hsl(var(--markfy-plan-badge-foreground))',
  };
};
