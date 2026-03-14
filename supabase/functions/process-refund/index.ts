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
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing auth header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    // Verify user
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { reason } = await req.json();
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Get profile
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("plan, plan_started_at, plan_expires_at, email, full_name, mp_payment_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: "Perfil não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.plan || profile.plan === "free") {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum plano ativo encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Calculate days since activation
    const planStarted = profile.plan_started_at ? new Date(profile.plan_started_at) : null;
    const today = new Date();
    const daysDiff = planStarted
      ? Math.floor((today.getTime() - planStarted.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const planLabel =
      profile.plan === "mensal" ? "Mensal (R$99,90)" : profile.plan === "trimestral" ? "Trimestral (R$149,90)" : profile.plan;
    const startedFormatted = planStarted ? planStarted.toLocaleDateString("pt-BR") : "N/A";

    // 3. Outside 7-day window → cancel only
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
        message: `Sua assinatura ${planLabel} foi cancelada. Reembolso indisponível (ativado há ${daysDiff} dias, prazo: 7 dias).`,
        type: "refund",
      });

      return new Response(
        JSON.stringify({
          success: false,
          cancelled: true,
          daysDiff,
          planLabel,
          startedFormatted,
          error: `Fora do prazo de 7 dias (${daysDiff} dias). Assinatura cancelada sem reembolso.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Within window — process refund via Mercado Pago
    const mpPaymentId = profile.mp_payment_id;
    let mpRefundId: string | null = null;

    if (mpPaymentId && mpAccessToken) {
      try {
        const mpRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${mpPaymentId}/refunds`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${mpAccessToken}`,
              "Content-Type": "application/json",
              "X-Idempotency-Key": `refund-${user.id}-${Date.now()}`,
            },
            body: JSON.stringify({}),
          }
        );

        const mpRefund = await mpRes.json();

        if (mpRes.ok) {
          mpRefundId = String(mpRefund.id);
          console.log("Mercado Pago refund created:", mpRefundId);
        } else {
          console.error("MP refund error:", JSON.stringify(mpRefund));
          // Continue with cancellation even if MP refund fails — record for manual processing
        }
      } catch (mpError) {
        console.error("MP refund network error:", mpError);
      }
    } else {
      console.warn("No mp_payment_id or MP token — skipping MP API refund, marking for manual processing");
    }

    // 5. Cancel subscription
    await admin
      .from("profiles")
      .update({ plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null })
      .eq("id", user.id);

    // 6. Save refund request
    await admin.from("refund_requests").insert({
      user_id: user.id,
      email: profile.email,
      plan: profile.plan,
      days_active: daysDiff,
      status: mpRefundId ? "approved" : "pending_manual",
      reason: reason || "Solicitado pelo usuário",
      mp_refund_id: mpRefundId,
    });

    // 7. Notification
    await admin.from("notifications").insert({
      user_id: user.id,
      title: "✅ Reembolso processado",
      message: mpRefundId
        ? `Seu reembolso foi aprovado (ID: ${mpRefundId}). Estorno em até 5 dias úteis via Mercado Pago.`
        : "Seu reembolso foi registrado e será processado manualmente em até 5 dias úteis.",
      type: "refund",
    });

    return new Response(
      JSON.stringify({
        success: true,
        refundId: mpRefundId,
        daysDiff,
        planLabel,
        startedFormatted,
        manualProcessing: !mpRefundId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-refund error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
