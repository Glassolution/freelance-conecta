import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Gateway de pagamento não configurado no backend." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, reason } = await req.json();
    if (userId && userId !== user.id) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized refund target" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("plan, plan_started_at, plan_expires_at, email, full_name, mp_payment_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ success: false, error: "Perfil não encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile.plan || profile.plan === "free") {
      return new Response(JSON.stringify({ success: false, error: "Nenhum plano ativo encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planStarted = profile.plan_started_at ? new Date(profile.plan_started_at) : null;
    const daysDiff = planStarted && !Number.isNaN(planStarted.getTime())
      ? Math.floor((Date.now() - planStarted.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Outside 7-day window — cancel only, no refund
    if (daysDiff > 7) {
      await admin
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null })
        .eq("id", user.id);

      await admin.from("refund_requests").insert({
        user_id: user.id,
        email: profile.email,
        plan: profile.plan,
        days_active: daysDiff,
        status: "denied_cancelled",
        reason: reason || "outside_7_day_window",
      });

      await admin.from("notifications").insert({
        user_id: user.id,
        title: "Assinatura cancelada",
        message: `Sua assinatura foi cancelada. Como seu plano estava ativo há ${daysDiff} dias, o reembolso não foi possível (prazo máximo: 7 dias).`,
        type: "cancelled",
      });

      return new Response(
        JSON.stringify({ success: false, cancelled: true, daysDiff, error: "Fora do prazo de 7 dias" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.mp_payment_id) {
      return new Response(
        JSON.stringify({ success: false, error: "ID do pagamento não encontrado. Entre em contato pelo suporte." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process refund via Mercado Pago
    try {
      const mpRefundRes = await fetch(`https://api.mercadopago.com/v1/payments/${profile.mp_payment_id}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `refund-${user.id}-${Date.now()}`,
        },
        body: JSON.stringify({}),
      });

      const mpRefund = await mpRefundRes.json();

      if (!mpRefundRes.ok || !mpRefund?.id) {
        throw new Error(mpRefund?.message || "Erro ao processar reembolso");
      }

      const mpRefundId = String(mpRefund.id);

      await admin
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null })
        .eq("id", user.id);

      await admin.from("refund_requests").insert({
        user_id: user.id,
        email: profile.email,
        plan: profile.plan,
        days_active: daysDiff,
        status: "approved",
        reason: reason || "Solicitado pelo usuário",
        mp_refund_id: mpRefundId,
      });

      await admin.from("notifications").insert({
        user_id: user.id,
        title: "Reembolso aprovado",
        message: `Seu reembolso foi processado. O valor será estornado em até 5 dias úteis via Mercado Pago.\nID: ${mpRefundId}`,
        type: "refund",
      });

      return new Response(
        JSON.stringify({ success: true, refundId: mpRefundId, daysDiff }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar reembolso";

      await admin.from("refund_requests").insert({
        user_id: user.id,
        email: profile.email,
        plan: profile.plan,
        days_active: daysDiff,
        status: "failed",
        reason: errorMessage,
      });

      await admin.from("notifications").insert({
        user_id: user.id,
        title: "❌ Erro no reembolso",
        message: "Não foi possível processar seu reembolso automaticamente. Entre em contato: suporte@markfy.com.br",
        type: "error",
      });

      return new Response(JSON.stringify({ success: false, error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("process-refund error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
