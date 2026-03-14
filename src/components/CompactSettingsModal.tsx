import { useEffect, useMemo, useState } from 'react';
import { X, Moon, Bell, Mail, RotateCcw, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CompactSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const TABS = ['Perfil', 'Aparência', 'Assinatura', 'Conta'] as const;
type Tab = (typeof TABS)[number];

const CompactSettingsModal = ({ open, onClose }: CompactSettingsModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('Perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('free');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [updatesByEmail, setUpdatesByEmail] = useState(true);

  useEffect(() => {
    if (!open) return;
    setTab('Perfil');
    setDarkMode(localStorage.getItem('markfy_dark_mode') === 'true');
    setNotificationsEnabled(localStorage.getItem('markfy_notifications') !== 'false');
    setUpdatesByEmail(localStorage.getItem('markfy_update_emails') !== 'false');

    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, plan, plan_expires_at')
        .eq('id', user.id)
        .single();
      setFullName(profile?.full_name || user.user_metadata?.full_name || '');
      setEmail(profile?.email || user.email || '');
      setPlan(profile?.plan || 'free');
      setPlanExpiresAt(profile?.plan_expires_at || null);
      setLoading(false);
    };
    load();
  }, [open, user?.id, user?.email, user?.user_metadata?.full_name]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const hasActivePlan = useMemo(() => {
    if (!planExpiresAt || plan === 'free') return false;
    return new Date(planExpiresAt) > new Date();
  }, [plan, planExpiresAt]);

  const planLabel = plan === 'mensal' ? 'Mensal' : plan === 'trimestral' ? 'Trimestral' : 'Gratuito';

  const daysRemaining = useMemo(() => {
    if (!hasActivePlan || !planExpiresAt) return 0;
    return Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / 86400000));
  }, [hasActivePlan, planExpiresAt]);

  const progress = useMemo(() => {
    if (!hasActivePlan) return 0;
    const cycle = plan === 'trimestral' ? 90 : 30;
    return Math.min(100, Math.max(6, Math.round((daysRemaining / cycle) * 100)));
  }, [hasActivePlan, plan, daysRemaining]);

  const formattedExpiry = planExpiresAt ? new Date(planExpiresAt).toLocaleDateString('pt-BR') : null;

  const handleToggle = (key: string, setter: (v: boolean) => void, current: boolean) => {
    const next = !current;
    setter(next);
    localStorage.setItem(key, String(next));
    if (key === 'markfy_dark_mode') document.body.classList.toggle('dark', next);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    setSaving(false);
    if (error) { toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Alterações salvas' });
  };

  const handleResetOnboarding = async () => {
    if (!user?.id) return;
    const { error } = await supabase.from('profiles').update({
      onboarding_completed: false, onboarding_profile: null,
      onboarding_tools: null, onboarding_goal: null, onboarding_budget: null,
    }).eq('id', user.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Questionário resetado' });
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('Tem certeza que deseja excluir sua conta?')) return;
    toast({ title: 'Solicitação registrada', description: 'Nosso time processará sua solicitação.' });
  };

  const toggleRow = (label: string, icon: React.ReactNode, value: boolean, onChange: () => void) => (
    <div key={label} className="flex items-center justify-between rounded-xl border border-[#E8ECF4] px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm text-[#111]">{icon}<span>{label}</span></div>
      <button
        type="button"
        onClick={onChange}
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
        style={{ background: value ? '#29B2FE' : '#d1d5db' }}
      >
        <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[400px] rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8ECF4]">
          <h2 className="text-base font-bold text-[#111]">Configurações</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-[#E8ECF4] text-[#6B7280] hover:text-[#111] hover:bg-[#f8f9fc] flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-[#E8ECF4]">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === t ? 'text-[#29B2FE] border-b-2 border-[#29B2FE]' : 'text-[#9ca3af] hover:text-[#6B7280]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          {loading && tab === 'Perfil' ? (
            <div className="h-20 rounded-xl animate-pulse bg-[#F3F4F6]" />
          ) : tab === 'Perfil' ? (
            <>
              <div>
                <label className="text-xs text-[#6B7280]">Nome completo</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E8ECF4] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#29B2FE]/30"
                />
              </div>
              <div>
                <label className="text-xs text-[#6B7280]">Email</label>
                <input value={email} readOnly className="mt-1 w-full rounded-xl border border-[#E8ECF4] px-3 py-2 text-sm bg-[#f8f9fc] text-[#6B7280]" />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ background: '#29B2FE' }}
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </>
          ) : tab === 'Aparência' ? (
            <div className="space-y-3">
              {toggleRow('Modo Noturno', <Moon size={15} />, darkMode, () => handleToggle('markfy_dark_mode', setDarkMode, darkMode))}
              {toggleRow('Notificações', <Bell size={15} />, notificationsEnabled, () => handleToggle('markfy_notifications', setNotificationsEnabled, notificationsEnabled))}
              {toggleRow('Emails', <Mail size={15} />, updatesByEmail, () => handleToggle('markfy_update_emails', setUpdatesByEmail, updatesByEmail))}
            </div>
          ) : tab === 'Assinatura' ? (
            hasActivePlan ? (
              <div className="rounded-xl border border-green-400 bg-green-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-[#111] flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" /> Plano {planLabel} — Ativo
                </p>
                <p className="text-sm text-[#374151]">Válido até: {formattedExpiry}</p>
                <div className="h-2 rounded-full bg-white/70 border overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-[#374151]">{daysRemaining} dias restantes</p>
              </div>
            ) : (
              <div className="rounded-xl border border-yellow-400 bg-yellow-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-[#111] flex items-center gap-2">
                  <AlertTriangle size={16} className="text-yellow-500" /> Sem plano ativo
                </p>
                <p className="text-sm text-[#6B7280]">Assine para acessar todos os recursos</p>
                <button onClick={() => { onClose(); navigate('/pricing'); }} className="text-sm font-semibold text-[#29B2FE]">Ver Planos →</button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleResetOnboarding}
                className="w-full rounded-xl border border-[#E8ECF4] px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 text-[#374151] hover:bg-[#f3f4f6]"
              >
                <RotateCcw size={15} /> Refazer questionário
              </button>
              <button
                onClick={handleDeleteAccount}
                className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={15} /> Excluir minha conta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactSettingsModal;
