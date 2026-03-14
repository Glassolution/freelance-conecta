import { useEffect, useMemo, useState } from 'react';
import { X, Moon, Bell, Mail, MessageCircle, RotateCcw, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const hslBlue = 'hsl(200 99% 58%)';
const hslBlueHover = 'hsl(200 80% 52%)';
const hslGreenBorder = 'hsl(142 71% 45%)';
const hslGreenBg = 'hsl(138 76% 97%)';
const hslYellowBorder = 'hsl(38 92% 50%)';
const hslYellowBg = 'hsl(48 100% 96%)';

const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<string>('free');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [updatesByEmail, setUpdatesByEmail] = useState(true);

  useEffect(() => {
    if (!open) return;

    setDarkMode(localStorage.getItem('markfy_dark_mode') === 'true');
    setNotificationsEnabled(localStorage.getItem('markfy_notifications') !== 'false');
    setUpdatesByEmail(localStorage.getItem('markfy_update_emails') !== 'false');

    const loadProfile = async () => {
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

    loadProfile();
  }, [open, user?.id, user?.email, user?.user_metadata?.full_name]);

  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  const hasActivePlan = useMemo(() => {
    if (!planExpiresAt || plan === 'free') return false;
    return new Date(planExpiresAt) > new Date();
  }, [plan, planExpiresAt]);

  const planLabel = plan === 'mensal' ? 'Mensal' : plan === 'trimestral' ? 'Trimestral' : 'Gratuito';

  const daysRemaining = useMemo(() => {
    if (!hasActivePlan || !planExpiresAt) return 0;
    const diff = new Date(planExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [hasActivePlan, planExpiresAt]);

  const progress = useMemo(() => {
    if (!hasActivePlan) return 0;
    const cycleDays = plan === 'trimestral' ? 90 : 30;
    return Math.min(100, Math.max(6, Math.round((daysRemaining / cycleDays) * 100)));
  }, [hasActivePlan, plan, daysRemaining]);

  const formattedExpiry = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString('pt-BR')
    : null;

  const handleToggleDarkMode = (nextValue: boolean) => {
    setDarkMode(nextValue);
    localStorage.setItem('markfy_dark_mode', String(nextValue));
    document.body.classList.toggle('dark', nextValue);
  };

  const handleToggleNotifications = (nextValue: boolean) => {
    setNotificationsEnabled(nextValue);
    localStorage.setItem('markfy_notifications', String(nextValue));
  };

  const handleToggleUpdatesByEmail = (nextValue: boolean) => {
    setUpdatesByEmail(nextValue);
    localStorage.setItem('markfy_update_emails', String(nextValue));
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      toast({ title: 'Erro ao salvar perfil', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Alterações salvas com sucesso' });
  };

  const handleResetOnboarding = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: false,
        onboarding_profile: null,
        onboarding_tools: null,
        onboarding_goal: null,
        onboarding_budget: null,
      })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Erro ao resetar questionário', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Questionário inicial resetado com sucesso' });
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    toast({
      title: 'Solicitação de exclusão registrada',
      description: 'Nosso time de suporte vai processar sua solicitação de exclusão.',
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxWidth: '680px', maxHeight: '85vh' }}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#E8ECF4] sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-[#111]">Configurações</h2>
            <p className="text-sm text-[#6B7280] mt-1">Gerencie sua conta e preferências</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-[#E8ECF4] text-[#6B7280] hover:text-[#111] hover:bg-[#F8F9FC] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 space-y-8" style={{ maxHeight: 'calc(85vh - 88px)' }}>
          {/* SECTION 1 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-[#111] uppercase">Perfil</h3>

            {loading ? (
              <div className="h-24 rounded-xl animate-pulse bg-[#F3F4F6]" />
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold" style={{ background: hslBlue }}>
                    {(fullName || email || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-xs text-[#6B7280]">Nome completo</label>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#E8ECF4] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#29B2FE]/30"
                        placeholder="Seu nome"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-[#6B7280]">Email</label>
                      <input
                        value={email}
                        readOnly
                        className="mt-1 w-full rounded-xl border border-[#E8ECF4] px-3 py-2 text-sm bg-[#F8F9FC] text-[#6B7280]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: saving ? hslBlueHover : hslBlue }}
                >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </>
            )}
          </section>

          {/* SECTION 2 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-[#111] uppercase">Aparência</h3>

            {[
              {
                icon: <Moon size={16} />, title: 'Modo Noturno',
                description: 'Ativar tema escuro na plataforma',
                value: darkMode,
                onChange: handleToggleDarkMode,
              },
              {
                icon: <Bell size={16} />, title: '🔔 Notificações',
                description: 'Receber alertas de novas vagas e propostas',
                value: notificationsEnabled,
                onChange: handleToggleNotifications,
              },
              {
                icon: <Mail size={16} />, title: '📧 Emails de atualização',
                description: 'Receber novidades da Markfy por email',
                value: updatesByEmail,
                onChange: handleToggleUpdatesByEmail,
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center justify-between rounded-xl border border-[#E8ECF4] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111] flex items-center gap-2">{item.icon}{item.title}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{item.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => item.onChange(!item.value)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ background: item.value ? hslBlue : 'hsl(220 13% 85%)' }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                    style={{ transform: item.value ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            ))}
          </section>

          {/* SECTION 3 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-[#111] uppercase">Minha Assinatura</h3>

            {hasActivePlan ? (
              <div style={{ border: `1px solid ${hslGreenBorder}`, background: hslGreenBg, borderRadius: '12px', padding: '20px' }}>
                <p className="text-sm font-semibold text-[#111] flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: hslGreenBorder }} />
                  ✅ Plano {planLabel} — Ativo
                </p>
                <p className="text-sm text-[#374151] mt-2">Válido até: {formattedExpiry}</p>
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-white/70 border border-white/80 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: hslGreenBorder }} />
                  </div>
                  <p className="text-xs text-[#374151] mt-2">{`${'█'.repeat(12)}░░ ${daysRemaining} dias restantes`}</p>
                </div>
              </div>
            ) : (
              <div style={{ border: `1px solid ${hslYellowBorder}`, background: hslYellowBg, borderRadius: '12px', padding: '20px' }}>
                <p className="text-sm font-semibold text-[#111] flex items-center gap-2">
                  <AlertTriangle size={16} style={{ color: hslYellowBorder }} />
                  ⚠️ Sem plano ativo
                </p>
                <p className="text-sm text-[#6B7280] mt-2">Assine para acessar todos os recursos da Markfy</p>
                <button
                  onClick={() => { onClose(); navigate('/pricing'); }}
                  className="mt-3 text-sm font-semibold"
                  style={{ color: hslBlue }}
                >
                  Ver Planos →
                </button>
              </div>
            )}
          </section>

          {/* SECTION 4 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-[#111] uppercase">Suporte</h3>

            <div className="rounded-xl border border-[#E8ECF4] p-4">
              <p className="text-sm font-semibold text-[#111]">💬 Suporte IA</p>
              <p className="text-xs text-[#6B7280] mt-1">Tire suas dúvidas com nossa IA</p>
              <button
                onClick={() => { onClose(); navigate('/suporte'); }}
                className="mt-3 text-sm font-semibold"
                style={{ color: hslBlue }}
              >
                Abrir Chat →
              </button>
            </div>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-[#111] uppercase">Conta</h3>

            <button
              onClick={handleResetOnboarding}
              className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              style={{ borderColor: 'hsl(0 84% 60%)', color: 'hsl(0 84% 60%)' }}
            >
              <RotateCcw size={16} /> Refazer questionário inicial
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full rounded-xl border border-[#FECACA] px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              style={{ color: 'hsl(0 84% 60%)' }}
            >
              <Trash2 size={16} /> Excluir minha conta
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
