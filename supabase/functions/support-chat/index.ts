import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente de suporte da Markfy,
plataforma de marketplace para freelancers brasileiros.

Responda SEMPRE em português brasileiro.
Seja prestativo, empático e profissional.
Mantenha respostas concisas mas completas.

Você pode ajudar com:
- Como usar o marketplace (Geral e Markfy)
- Planos: Mensal R$99,90 / Trimestral R$149,90
- Problemas de acesso ao dashboard
- Envio e recebimento de propostas
- Meus Anúncios e Meus Clientes
- Sistema de mensagens entre usuários
- Pagamentos via Mercado Pago
- Reembolsos (prazo: 5 dias úteis)

FLUXO DE REEMBOLSO:
Quando usuário mencionar reembolso:
1. Pergunte o motivo
2. Confirme o email cadastrado
3. Informe: 'Solicitação registrada! Reembolso em até 5 dias úteis via Mercado Pago.'
4. Salve em Supabase tabela refund_requests

PERGUNTAS FREQUENTES:
- 'Como acesso o dashboard?' → Precisa ter plano ativo
- 'Como enviar proposta?' → Marketplace > aba Markfy > Enviar Proposta
- 'Como criar anúncio?' → Meus Anúncios > Novo Anúncio
- 'Como cancelar plano?' → Configurações > Minha Assinatura > Gerenciar`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...(Array.isArray(messages) ? messages : []),
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await aiResponse.json();
    const reply = payload?.choices?.[0]?.message?.content ?? "Não consegui responder no momento.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("support-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
