import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Missing auth header" }), {
        status: 200, headers: jsonHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 200, headers: jsonHeaders,
      });
    }

    const { userId, reason } = await req.json();
    console.log("Refund request for userId:", userId || user.id);

    if (userId && userId !== user.id) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized refund target" }), {
        status: 200, headers: jsonHeaders,
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const targetUserId = userId || user.id;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("plan, plan_started_at, plan_expires_at, email, full_name, mp_payment_id")
      .eq("id", targetUserId)
      .maybeSingle();

    console.log("Profile:", JSON.stringify(profile));
    console.log("Profile error:", profileError);

    if (profileError || !profile) {
      return new Response(JSON.stringify({ success: false, error: `Perfil não encontrado: ${profileError?.message || "null"}` }), {
        status: 200, headers: jsonHeaders,
      });
    }

    if (!profile.plan || profile.plan === "free") {
      return new Response(JSON.stringify({ success: false, error: "Nenhum plano ativo encontrado" }), {
        status: 200, headers: jsonHeaders,
      });
    }

    // Handle missing plan_started_at — assume eligible (1 day ago)
    const planStarted = profile.plan_started_at
      ? new Date(profile.plan_started_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const daysDiff = !Number.isNaN(planStarted.getTime())
      ? Math.floor((Date.now() - planStarted.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    console.log("Days diff:", daysDiff, "mp_payment_id:", profile.mp_payment_id);

    // Outside 7-day window — cancel only, no refund
    if (daysDiff > 7) {
      await admin
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null })
        .eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId,
        email: profile.email,
        plan: profile.plan,
        days_active: daysDiff,
        status: "denied_cancelled",
        reason: reason || "outside_7_day_window",
      });

      await admin.from("notifications").insert({
        user_id: targetUserId,
        title: "Assinatura cancelada",
        message: `Sua assinatura foi cancelada. Como seu plano estava ativo há ${daysDiff} dias, o reembolso não foi possível (prazo máximo: 7 dias).`,
        type: "cancelled",
      });

      return new Response(
        JSON.stringify({ success: false, cancelled: true, daysDiff, error: "Fora do prazo de 7 dias" }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // Handle missing mp_payment_id — cancel plan, flag for manual refund
    if (!profile.mp_payment_id) {
      await admin
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null, plan_started_at: null })
        .eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId,
        email: profile.email,
        plan: profile.plan,
        days_active: daysDiff,
        status: "pending_manual",
        reason: reason || "mp_payment_id_missing",
      });

      await admin.from("notifications").insert({
        user_id: targetUserId,
        title: "Reembolso em análise",
        message: "Não encontramos o ID do pagamento automaticamente. Nossa equipe processará seu reembolso manualmente em até 2 dias úteis.",
        type: "refund",
      });

      return new Response(
        JSON.stringify({ success: true, manual: true, message: "Reembolso será processado manualmente" }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // Check MP access token
    if (!mpAccessToken) {
      await admin
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null, plan_started_at: null })
        .eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId,
        email: profile.email,
        plan: profile.plan,
        days_active: daysDiff,
        status: "pending_manual",
        reason: "mp_token_not_configured",
      });

      await admin.from("notifications").insert({
        user_id: targetUserId,
        title: "Reembolso em análise",
        message: "Seu plano foi cancelado. O reembolso será processado manualmente pela equipe.",
        type: "refund",
      });

      return new Response(
        JSON.stringify({ success: true, manual: true, message: "Reembolso será processado manualmente" }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // Process refund via Mercado Pago
    try {
      const mpRefundRes = await fetch(`https://api.mercadopago.com/v1/payments/${profile.mp_payment_id}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `refund-${targetUserId}-${Date.now()}`,
        },
        body: JSON.stringify({}),
      });

      const mpRefund = await mpRefundRes.json();
      console.log("MP refund response:", JSON.stringify(mpRefund));

      if (!mpRefundRes.ok || !mpRefund?.id) {
        throw new Error(mpRefund?.message || "Erro ao processar reembolso no Mercado Pago");
      }

      const mpRefundId = String(mpRefund.id);

      await admin
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null })
        .eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId,
        email: profile.email,
        plan: profile.plan,
        days_active: daysDiff,
        status: "approved",
        reason: reason || "Solicitado pelo usuário",
        mp_refund_id: mpRefundId,
      });

      await admin.from("notifications").insert({
        user_id: targetUserId,
        title: "Reembolso aprovado",
        message: `Seu reembolso foi processado. O valor será estornado em até 5 dias úteis via Mercado Pago. ID: ${mpRefundId}`,
        type: "refund",
      });

      return new Response(
        JSON.stringify({ success: true, refundId: mpRefundId, daysDiff }),
        { status: 200, headers: jsonHeaders },
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar reembolso";
      console.error("MP refund error:", errorMessage);

      // Still cancel the plan even if MP refund fails
      await admin
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null, plan_started_at: null })
        .eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId,
        email: profile.email,
        plan: profile.plan,
        days_active: daysDiff,
        status: "failed",
        reason: errorMessage,
      });

      await admin.from("notifications").insert({
        user_id: targetUserId,
        title: "Erro no reembolso",
        message: "Não foi possível processar seu reembolso automaticamente. Nossa equipe será notificada e processará manualmente. Contato: suporte@markfy.com.br",
        type: "error",
      });

      return new Response(JSON.stringify({ success: false, error: errorMessage }), {
        status: 200, headers: jsonHeaders,
      });
    }
  } catch (error) {
    console.error("process-refund error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 200, headers: jsonHeaders },
    );
  }
});
