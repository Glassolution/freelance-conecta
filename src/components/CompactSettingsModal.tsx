import { useEffect, useMemo, useState } from 'react';
import { X, Moon, Bell, Mail, RotateCcw, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getPlanLabel } from '@/lib/plan';

interface CompactSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const TABS = ['Perfil', 'Aparência', 'Assinatura', 'Conta'] as const;
type Tab = (typeof TABS)[number];

const CompactSettingsModal = ({ open, onClose }: CompactSettingsModalProps) => {
...
  const planLabel = getPlanLabel(plan);
...
export default CompactSettingsModal;
