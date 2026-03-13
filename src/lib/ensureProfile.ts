import { supabase } from '@/integrations/supabase/client';

let profileEnsured = false;

export async function ensureProfile() {
  if (profileEnsured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (!data) {
    await supabase.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || null,
      email: user.email || null,
    } as any);
  }
  profileEnsured = true;
}
