import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

type RefundContext = {
  admin: ReturnType<typeof createClient>;
  userId: string;
  profile: {
    plan: string | null;
    plan_started_at: string | null;
    plan_expires_at: string | null;
    email: string | null;
    full_name: string | null;
    mp_payment_id: string | null;
  };
  daysDiff: number;
  reason: string | null;
};

function respond(payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), { status: 200, headers: jsonHeaders });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro desconhecido";
}

function getErrorStack(error: unknown) {
  return error instanceof Error ? error.stack ?? "" : "";
}

async function cancelPlan(admin: ReturnType<typeof createClient>, userId: string, clearPaymentId = false) {
  const updates: Record<string, unknown> = {
    plan: "free",
    plan_expires_at: null,
    plan_started_at: null,
  };

  if (clearPaymentId) {
    updates.mp_payment_id = null;
  }

  const { error } = await admin.from("profiles").update(updates).eq("id", userId);
  if (error) {
    console.error("Failed to cancel plan:", error);
  }
}

async function createNotification(
  admin: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  message: string,
  type: string,
) {
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  });

  if (error) {
    console.error("Failed to insert notification:", error);
  }
}

async function insertRefundRequest(
  admin: ReturnType<typeof createClient>,
  payload: {
    user_id: string;
    email: string | null;
    plan?: string | null;
    days_active?: number | null;
    status: string;
    reason?: string | null;
    mp_refund_id?: string | null;
  },
) {
  const { error } = await admin.from("refund_requests").insert(payload);
  if (error) {
    console.error("Failed to insert refund request:", error);
  }
}

async function markManualRefund(context: RefundContext, reason: string, message: string) {
  await cancelPlan(context.admin, context.userId);

  await insertRefundRequest(context.admin, {
    user_id: context.userId,
    email: context.profile.email,
    plan: context.profile.plan,
    days_active: context.daysDiff,
    status: "pending_manual",
    reason,
  });

  await createNotification(
    context.admin,
    context.userId,
    "Reembolso em análise",
    message,
    "refund",
  );

  return respond({
    success: true,
    manual: true,
    message: "Plano cancelado. Reembolso manual em até 2 dias úteis.",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return respond({ success: false, error: "Missing auth header" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return respond({ success: false, error: "Unauthorized" });
    }

    const body = await req.json();
    const requestedUserId = body?.userId;
    const reason = body?.reason ?? null;
    const userId = requestedUserId || user.id;

    console.log("Refund request for userId:", userId);

    if (requestedUserId && requestedUserId !== user.id) {
      return respond({ success: false, error: "Unauthorized refund target" });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("plan, plan_started_at, plan_expires_at, email, full_name, mp_payment_id")
      .eq("id", userId)
      .single();

    console.log("Profile:", profile);
    console.log("Profile error:", profileError);

    if (profileError || !profile) {
      return respond({
        success: false,
        error: `Perfil não encontrado: ${profileError?.message ?? "desconhecido"}`,
      });
    }

    if (!profile.plan || profile.plan === "free") {
      return respond({ success: false, error: "Nenhum plano ativo encontrado" });
    }

    const planStarted = profile.plan_started_at
      ? new Date(profile.plan_started_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const daysDiff = Math.floor((Date.now() - planStarted.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 7) {
      await cancelPlan(admin, userId, true);

      await insertRefundRequest(admin, {
        user_id: userId,
        email: profile.email,
        plan: profile.plan,
        days_active: daysDiff,
        status: "denied_cancelled",
        reason: reason || `outside_7_day_window_${daysDiff}`,
      });

      await createNotification(
        admin,
        userId,
        "Assinatura cancelada",
        `Plano cancelado. Reembolso indisponível após 7 dias (${daysDiff} dias de uso).`,
        "cancelled",
      );

      return respond({ success: false, cancelled: true, daysDiff });
    }

    const context: RefundContext = {
      admin,
      userId,
      profile,
      daysDiff,
      reason,
    };

    if (!profile.mp_payment_id) {
      return await markManualRefund(
        context,
        "mp_payment_id_missing",
        "Não encontramos o ID do pagamento automaticamente. Nossa equipe processará seu reembolso manualmente em até 2 dias úteis.",
      );
    }

    const paymentId = String(profile.mp_payment_id).trim();
    if (!/^\d+$/.test(paymentId)) {
      return await markManualRefund(
        context,
        `invalid_mp_payment_id_format:${paymentId}`,
        "Não foi possível validar o ID do pagamento. Nossa equipe processará seu reembolso manualmente.",
      );
    }

    const mpToken = Deno.env.get("MP_ACCESS_TOKEN") ?? Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    console.log("MP Token exists:", !!mpToken);
    console.log("MP Token prefix:", mpToken?.substring(0, 10));

    if (!mpToken) {
      return await markManualRefund(
        context,
        "mp_token_missing",
        "Token de pagamento não configurado. Nossa equipe processará seu reembolso manualmente.",
      );
    }

    const tokenLooksProduction = mpToken.startsWith("APP_USR-");
    console.log("MP token looks production:", tokenLooksProduction);

    const testRes = await fetch("https://api.mercadopago.com/v1/payments/search?limit=1", {
      headers: {
        Authorization: `Bearer ${mpToken}`,
      },
    });

    const testData = await testRes.json();
    console.log("MP API test status:", testRes.status);
    console.log("MP API test response:", JSON.stringify(testData));

    if (!testRes.ok) {
      return await markManualRefund(
        context,
        `mp_token_invalid_or_unreachable:${testRes.status}`,
        "Não foi possível validar a conexão com o processador de pagamentos. Reembolso seguirá manualmente.",
      );
    }

    try {
      const refundRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `markfy-refund-${paymentId}-${Date.now()}`,
        },
      });

      const refundData = await refundRes.json();
      console.log("MP refund response:", refundRes.status, JSON.stringify(refundData));

      if (refundRes.ok || refundData?.id) {
        await cancelPlan(admin, userId, true);

        await insertRefundRequest(admin, {
          user_id: userId,
          email: profile.email,
          plan: profile.plan,
          days_active: daysDiff,
          status: "approved",
          reason,
          mp_refund_id: refundData?.id ? String(refundData.id) : null,
        });

        await createNotification(
          admin,
          userId,
          "Reembolso aprovado",
          "Reembolso processado com sucesso. Valor estornado em até 5 dias úteis via Mercado Pago.",
          "refund",
        );

        return respond({ success: true, refundId: refundData?.id ? String(refundData.id) : null });
      }

      throw new Error(refundData?.message || refundData?.error || `MP Error: ${refundRes.status}`);
    } catch (error) {
      console.error("Full error:", error);
      console.error("Stack:", getErrorStack(error));

      return await markManualRefund(
        context,
        getErrorMessage(error),
        "Plano cancelado. Reembolso será processado manualmente em até 2 dias úteis.",
      );
    }
  } catch (error) {
    console.error("Full error:", error);
    console.error("Stack:", getErrorStack(error));

    return respond({
      success: false,
      error: getErrorMessage(error),
    });
  }
});
