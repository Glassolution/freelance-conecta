import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export const useUserPlan = () => {
  const { user } = useAuth()
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const active =
          data?.plan &&
          data.plan !== 'free' &&
          ['mensal', 'trimestral', 'anual'].includes(data.plan) &&
          data.plan_expires_at &&
          new Date(data.plan_expires_at) > new Date()
        setIsPro(!!active)
        setLoading(false)
      })
  }, [user])

  return { isPro, loading }
}
