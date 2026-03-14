import { FormEvent, useEffect, useState } from 'react';
import SupportSidebarLayout from '@/components/support/SupportSidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const subjectOptions = ['Dúvida', 'Problema Técnico', 'Reembolso', 'Sugestão', 'Outro'];

const SuporteContato = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Dúvida');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setName(user?.user_metadata?.full_name || '');
    setEmail(user?.email || '');
  }, [user?.email, user?.user_metadata?.full_name]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;

    setSending(true);

    const db = supabase as any;
    const { error } = await db.from('support_tickets').insert({
      user_id: user.id,
      name,
      email,
      subject,
      message,
    });

    setSending(false);

    if (error) {
      toast({ title: 'Erro ao enviar mensagem', description: error.message, variant: 'destructive' });
      return;
    }

    setMessage('');
    toast({ title: 'Mensagem enviada! Retornaremos em até 24h.' });
  };

  return (
    <SupportSidebarLayout active="contato">
      <div className="h-screen overflow-y-auto px-6 py-8" style={{ background: '#f8fafc' }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-[#111827]">Fale Conosco</h1>
            <p className="text-sm text-[#6B7280] mt-1">Envie sua mensagem e nosso time responde em até 24h.</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Nome</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Assunto</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none bg-white"
              >
                {subjectOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Mensagem</label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: '#29B2FE' }}
            >
              {sending ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </form>
        </div>
      </div>
    </SupportSidebarLayout>
  );
};

export default SuporteContato;
