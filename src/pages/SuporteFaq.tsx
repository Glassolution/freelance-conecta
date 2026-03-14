import { useState } from 'react';
import { ShoppingBag, CreditCard, Wrench, User, ChevronDown } from 'lucide-react';
import SupportSidebarLayout from '@/components/support/SupportSidebarLayout';

const faqCategories = [
  {
    title: 'Marketplace',
    icon: ShoppingBag,
    items: [
      {
        question: 'Como funciona o marketplace?',
        answer: 'No marketplace você encontra oportunidades e serviços. Basta explorar as vagas, analisar o escopo e enviar proposta quando fizer sentido para seu perfil.',
      },
      {
        question: 'Qual a diferença entre Geral e Markfy?',
        answer: 'A aba Geral reúne oportunidades amplas, enquanto Markfy concentra recursos e fluxos personalizados da plataforma para freelancers brasileiros.',
      },
      {
        question: 'Como enviar uma proposta?',
        answer: 'Acesse Marketplace, escolha uma oportunidade e clique em Enviar Proposta. Preencha valor, prazo e descrição de forma objetiva.',
      },
    ],
  },
  {
    title: 'Planos e Pagamento',
    icon: CreditCard,
    items: [
      {
        question: 'Quais planos estão disponíveis?',
        answer: 'Atualmente há plano Mensal (R$99,90) e Trimestral (R$149,90), com acesso aos recursos premium da plataforma.',
      },
      {
        question: 'Como funciona o pagamento?',
        answer: 'Os pagamentos são processados via Mercado Pago, com confirmação automática para ativação do plano.',
      },
      {
        question: 'Como solicitar reembolso?',
        answer: 'No Suporte, informe que deseja reembolso. Você será guiado para informar motivo e email. O prazo de análise é de até 5 dias úteis.',
      },
    ],
  },
  {
    title: 'Problemas Técnicos',
    icon: Wrench,
    items: [
      {
        question: 'Não consigo acessar o dashboard',
        answer: 'Verifique se seu plano está ativo. Usuários sem plano ativo são redirecionados para a tela de planos.',
      },
      {
        question: 'Minha proposta não foi enviada',
        answer: 'Confira os campos obrigatórios e sua conexão. Se persistir, envie detalhes no Fale Conosco para análise do suporte.',
      },
      {
        question: 'Como redefinir minha senha?',
        answer: 'Na tela de login, use a opção de recuperação de senha e siga o link enviado para seu email cadastrado.',
      },
    ],
  },
  {
    title: 'Minha Conta',
    icon: User,
    items: [
      {
        question: 'Como editar meu perfil?',
        answer: 'Abra Configurações no menu lateral e atualize seus dados no bloco Perfil, depois clique em Salvar alterações.',
      },
      {
        question: 'Como alterar meu plano?',
        answer: 'Acesse a área de assinatura em Configurações e escolha o plano desejado para upgrade ou renovação.',
      },
      {
        question: 'Como excluir minha conta?',
        answer: 'Em Configurações, use a opção Excluir minha conta e confirme a solicitação.',
      },
    ],
  },
];

const AccordionItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-[#E5E7EB] first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-medium text-[#111827] hover:text-[#29B2FE] transition-colors"
      >
        <span>{question}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#9CA3AF] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '200px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className="pb-4 text-sm text-[#6b7280] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const SuporteFaq = () => {
  return (
    <SupportSidebarLayout active="faq">
      <div className="h-screen overflow-y-auto px-6 py-8" style={{ background: '#f8fafc' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#111827]">Perguntas Frequentes</h1>
            <p className="text-sm text-[#6b7280] mt-1">Encontre respostas rápidas para as dúvidas mais comuns.</p>
          </div>

          <div className="space-y-5">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <section
                  key={category.title}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    padding: '24px',
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(41,178,254,0.1)' }}
                    >
                      <Icon size={16} color="#29B2FE" />
                    </div>
                    <h2 className="text-base font-bold text-[#111827]">{category.title}</h2>
                  </div>

                  <div>
                    {category.items.map((item) => (
                      <AccordionItem key={item.question} question={item.question} answer={item.answer} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </SupportSidebarLayout>
  );
};

export default SuporteFaq;
