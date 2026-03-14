import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings, HelpCircle, Globe, ArrowUpCircle, CreditCard, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CompactSettingsModal from './CompactSettingsModal';

interface ProfileDropdownProps {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

const ProfileDropdown = ({ open, onClose, anchorRef }: ProfileDropdownProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [plan, setPlan] = useState<string>('free');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const email = user?.email || 'sem-email';
  const hasActivePlan = plan !== 'free' && plan !== '';

  useEffect(() => {
    if (!open || !user?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle();
      setPlan(data?.plan || 'free');
    };
    load();
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        anchorRef?.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSignOut = async () => {
    onClose();
    await signOut();
    navigate('/');
  };

  const menuItem = (icon: React.ReactNode, label: string, onClick: () => void, rightLabel?: string, variant?: 'default' | 'destructive' | 'accent') => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        variant === 'destructive'
          ? 'text-red-500 hover:bg-red-500/10'
          : variant === 'accent'
            ? 'text-[#29B2FE] hover:bg-[#29B2FE]/10'
            : 'text-[#374151] hover:bg-[#f3f4f6]'
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {rightLabel && <span className="text-[11px] text-[#9ca3af]">{rightLabel}</span>}
    </button>
  );

  if (!open && !settingsOpen) return null;

  return (
    <>
      {open && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border border-[#e5e7eb] bg-white p-1.5 shadow-lg"
          style={{ width: 260 }}
        >
          <div className="px-3 py-2 text-xs text-[#9ca3af] truncate">{email}</div>
          <div className="my-1 h-px bg-[#e5e7eb]" />

          {menuItem(<Settings size={15} />, 'Configurações', () => { onClose(); setSettingsOpen(true); }, 'Ctrl+,')}
          {menuItem(<Globe size={15} />, 'Idioma', () => {}, '›')}
          {menuItem(<HelpCircle size={15} />, 'Receber ajuda', () => { onClose(); navigate('/suporte/faq'); })}

          <div className="my-1 h-px bg-[#e5e7eb]" />

          {!hasActivePlan
            ? menuItem(<ArrowUpCircle size={15} />, 'Fazer upgrade do plano', () => { onClose(); navigate('/pricing'); }, undefined, 'accent')
            : menuItem(<CreditCard size={15} />, 'Gerenciar assinatura', () => { onClose(); setSettingsOpen(true); })
          }
          {menuItem(<MessageSquare size={15} />, 'Suporte', () => { onClose(); navigate('/suporte'); })}

          <div className="my-1 h-px bg-[#e5e7eb]" />

          {menuItem(<LogOut size={15} />, 'Sair', handleSignOut, undefined, 'destructive')}
        </div>
      )}

      <CompactSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default ProfileDropdown;
