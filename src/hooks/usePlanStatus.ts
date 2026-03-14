import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PlanStatus {
  plan: string | null;
  planExpiresAt: string | null;
  isActive: boolean;
  loading: boolean;
  planLabel: string;
}

export const usePlanStatus = (): PlanStatus => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .single();

      setPlan(profile?.plan ?? 'free');
      setPlanExpiresAt(profile?.plan_expires_at ?? null);
      setLoading(false);

      // Auto-expire plan if past date
      if (
        profile?.plan &&
        profile.plan !== 'free' &&
        profile.plan_expires_at &&
        new Date(profile.plan_expires_at) < new Date()
      ) {
        await supabase
          .from('profiles')
          .update({ plan: 'free', plan_expires_at: null })
          .eq('id', user.id);
        setPlan('free');
        setPlanExpiresAt(null);
      }
    };

    fetchPlan();
  }, [user?.id]);

  const isActive = !!(plan && plan !== 'free' && planExpiresAt && new Date(planExpiresAt) > new Date());

  const planLabel = isActive
    ? (plan === 'mensal' ? 'Plano Mensal' : plan === 'trimestral' ? 'Plano Trimestral' : 'Gratuito')
    : 'Gratuito';

  return { plan, planExpiresAt, isActive, loading, planLabel };
};
