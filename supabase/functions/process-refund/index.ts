import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function ok(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });
}

async function verifyPayment(paymentId: string, token: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  console.log("Payment lookup status:", res.status, "data:", JSON.stringify(data));
  return { ok: res.ok, data };
}

async function requestRefund(paymentId: string, amount: number | null, token: string, userId: string) {
  const body: Record<string, unknown> = {};
  if (amount) body.amount = amount;

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `markfy-refund-${userId}-${paymentId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log("Refund API status:", res.status, "response:", JSON.stringify(data));
  return { ok: res.ok, data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return ok({ success: false, error: "Missing auth header" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return ok({ success: false, error: "Unauthorized" });

    const { userId, reason } = await req.json();
    const targetUserId = userId || user.id;
    console.log("Refund request for userId:", targetUserId);

    if (userId && userId !== user.id) {
      return ok({ success: false, error: "Unauthorized refund target" });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch profile
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("plan, plan_started_at, plan_expires_at, email, full_name, mp_payment_id")
      .eq("id", targetUserId)
      .maybeSingle();

    console.log("Profile:", JSON.stringify(profile));
    if (profileError || !profile) {
      return ok({ success: false, error: `Perfil não encontrado: ${profileError?.message || "null"}` });
    }

    if (!profile.plan || profile.plan === "free") {
      return ok({ success: false, error: "Nenhum plano ativo encontrado" });
    }

    // Calculate days since plan activation
    const planStarted = profile.plan_started_at
      ? new Date(profile.plan_started_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const daysDiff = !Number.isNaN(planStarted.getTime())
      ? Math.floor((Date.now() - planStarted.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    console.log("Days diff:", daysDiff, "mp_payment_id:", profile.mp_payment_id);

    // Outside 7-day window — cancel only
    if (daysDiff > 7) {
      await admin.from("profiles").update({
        plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null,
      }).eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId, email: profile.email, plan: profile.plan,
        days_active: daysDiff, status: "denied_cancelled", reason: reason || "outside_7_day_window",
      });

      await admin.from("notifications").insert({
        user_id: targetUserId, title: "Assinatura cancelada",
        message: `Sua assinatura foi cancelada. Como seu plano estava ativo há ${daysDiff} dias, o reembolso não foi possível (prazo máximo: 7 dias).`,
        type: "cancelled",
      });

      return ok({ success: false, cancelled: true, daysDiff, error: "Fora do prazo de 7 dias" });
    }

    // No mp_payment_id → manual refund
    if (!profile.mp_payment_id) {
      await admin.from("profiles").update({
        plan: "free", plan_expires_at: null, plan_started_at: null,
      }).eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId, email: profile.email, plan: profile.plan,
        days_active: daysDiff, status: "pending_manual", reason: reason || "mp_payment_id_missing",
      });

      await admin.from("notifications").insert({
        user_id: targetUserId, title: "Reembolso em análise",
        message: "Não encontramos o ID do pagamento automaticamente. Nossa equipe processará seu reembolso manualmente em até 2 dias úteis.",
        type: "refund",
      });

      return ok({ success: true, manual: true, message: "Reembolso será processado manualmente" });
    }

    // Check MP access token
    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    console.log("MP token exists:", !!mpAccessToken, "prefix:", mpAccessToken?.substring(0, 10));

    if (!mpAccessToken) {
      await admin.from("profiles").update({
        plan: "free", plan_expires_at: null, plan_started_at: null,
      }).eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId, email: profile.email, plan: profile.plan,
        days_active: daysDiff, status: "pending_manual", reason: "mp_token_not_configured",
      });

      await admin.from("notifications").insert({
        user_id: targetUserId, title: "Reembolso em análise",
        message: "Seu plano foi cancelado. O reembolso será processado manualmente pela equipe.",
        type: "refund",
      });

      return ok({ success: true, manual: true, message: "Reembolso será processado manualmente" });
    }

    // Verify the payment exists and is refundable
    const paymentCheck = await verifyPayment(profile.mp_payment_id, mpAccessToken);
    
    if (!paymentCheck.ok) {
      console.error("Payment not found in MP, falling back to manual refund");
      await admin.from("profiles").update({
        plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null,
      }).eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId, email: profile.email, plan: profile.plan,
        days_active: daysDiff, status: "pending_manual", reason: "payment_not_found_in_mp",
      });

      await admin.from("notifications").insert({
        user_id: targetUserId, title: "Reembolso em análise",
        message: "O pagamento não foi localizado no Mercado Pago. Nossa equipe processará manualmente.",
        type: "refund",
      });

      return ok({ success: true, manual: true, message: "Reembolso será processado manualmente" });
    }

    const paymentStatus = paymentCheck.data?.status;
    const paymentAmount = paymentCheck.data?.transaction_amount;
    console.log("Payment status:", paymentStatus, "amount:", paymentAmount);

    // If payment already refunded
    if (paymentStatus === "refunded") {
      await admin.from("profiles").update({
        plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null,
      }).eq("id", targetUserId);

      return ok({ success: true, message: "Pagamento já foi reembolsado anteriormente" });
    }

    // If payment not in refundable state
    if (paymentStatus !== "approved") {
      await admin.from("profiles").update({
        plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null,
      }).eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId, email: profile.email, plan: profile.plan,
        days_active: daysDiff, status: "pending_manual",
        reason: `payment_status_${paymentStatus}`,
      });

      await admin.from("notifications").insert({
        user_id: targetUserId, title: "Reembolso em análise",
        message: `Seu plano foi cancelado. O status do pagamento (${paymentStatus}) não permite reembolso automático. Nossa equipe processará manualmente.`,
        type: "refund",
      });

      return ok({ success: true, manual: true, message: "Reembolso será processado manualmente" });
    }

    // Process refund via Mercado Pago
    try {
      const refundResult = await requestRefund(
        profile.mp_payment_id, paymentAmount, mpAccessToken, targetUserId
      );

      if (!refundResult.ok || !refundResult.data?.id) {
        const errMsg = refundResult.data?.message || refundResult.data?.error || "Erro MP desconhecido";
        console.error("MP refund failed:", errMsg);

        // Fallback: cancel plan, flag for manual refund
        await admin.from("profiles").update({
          plan: "free", plan_expires_at: null, plan_started_at: null,
        }).eq("id", targetUserId);

        await admin.from("refund_requests").insert({
          user_id: targetUserId, email: profile.email, plan: profile.plan,
          days_active: daysDiff, status: "pending_manual", reason: `mp_error: ${errMsg}`,
        });

        await admin.from("notifications").insert({
          user_id: targetUserId, title: "Reembolso em análise",
          message: "Não foi possível processar automaticamente. Nossa equipe processará seu reembolso manualmente em até 2 dias úteis.",
          type: "refund",
        });

        return ok({ success: true, manual: true, message: "Reembolso será processado manualmente" });
      }

      const mpRefundId = String(refundResult.data.id);

      await admin.from("profiles").update({
        plan: "free", plan_expires_at: null, plan_started_at: null, mp_payment_id: null,
      }).eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId, email: profile.email, plan: profile.plan,
        days_active: daysDiff, status: "approved", reason: reason || "Solicitado pelo usuário",
        mp_refund_id: mpRefundId,
      });

      await admin.from("notifications").insert({
        user_id: targetUserId, title: "Reembolso aprovado",
        message: `Seu reembolso foi processado. O valor será estornado em até 5 dias úteis via Mercado Pago. ID: ${mpRefundId}`,
        type: "refund",
      });

      return ok({ success: true, refundId: mpRefundId, daysDiff });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar reembolso";
      const errorStack = error instanceof Error ? error.stack : "";
      console.error("MP refund exception:", errorMessage);
      console.error("Stack:", errorStack);

      // Still cancel plan, flag for manual
      await admin.from("profiles").update({
        plan: "free", plan_expires_at: null, plan_started_at: null,
      }).eq("id", targetUserId);

      await admin.from("refund_requests").insert({
        user_id: targetUserId, email: profile.email, plan: profile.plan,
        days_active: daysDiff, status: "pending_manual", reason: errorMessage,
      });

      await admin.from("notifications").insert({
        user_id: targetUserId, title: "Reembolso em análise",
        message: "Não foi possível processar automaticamente. Nossa equipe processará seu reembolso manualmente. Contato: suporte@markfy.com.br",
        type: "refund",
      });

      return ok({ success: true, manual: true, error: errorMessage });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    const stack = error instanceof Error ? error.stack : "";
    console.error("process-refund top-level error:", msg);
    console.error("Stack:", stack);
    return ok({ success: false, error: msg });
  }
});
