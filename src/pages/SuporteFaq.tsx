import SupportSidebarLayout from '@/components/support/SupportSidebarLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqCategories = [
  {
    title: '🛒 Marketplace',
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
    title: '💳 Planos e Pagamento',
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
    title: '🔧 Problemas Técnicos',
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
    title: '👤 Minha Conta',
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

const SuporteFaq = () => {
  return (
    <SupportSidebarLayout active="faq">
      <div className="h-screen overflow-y-auto px-6 py-8" style={{ background: '#f8fafc' }}>
        <div className="max-w-4xl mx-auto space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Perguntas Frequentes</h1>
            <p className="text-sm text-[#6B7280] mt-1">Encontre respostas rápidas para as dúvidas mais comuns.</p>
          </div>

          {faqCategories.map((category) => (
            <section key={category.title} className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm p-4">
              <h2 className="text-base font-semibold text-[#111827] mb-3">{category.title}</h2>

              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item) => (
                  <AccordionItem key={item.question} value={item.question}>
                    <AccordionTrigger className="text-left text-sm text-[#111827]">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-[#4B5563]">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </div>
    </SupportSidebarLayout>
  );
};

export default SuporteFaq;
