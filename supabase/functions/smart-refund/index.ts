import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth user
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, reason, email } = await req.json();
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ACTION: check — verify refund eligibility
    if (action === "check") {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("plan, plan_expires_at, plan_started_at, email")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.plan || profile.plan === "free") {
        return new Response(JSON.stringify({
          eligible: false,
          reason: "no_plan",
          message: "Você não possui um plano ativo para solicitar reembolso.",
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const planStarted = profile.plan_started_at ? new Date(profile.plan_started_at) : null;
      const today = new Date();
      const daysDiff = planStarted
        ? Math.floor((today.getTime() - planStarted.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const planLabel = profile.plan === "mensal" ? "Mensal" : profile.plan === "trimestral" ? "Trimestral" : profile.plan;
      const startedFormatted = planStarted ? planStarted.toLocaleDateString("pt-BR") : "N/A";

      if (daysDiff > 7) {
        return new Response(JSON.stringify({
          eligible: false,
          reason: "expired_window",
          daysDiff,
          plan: profile.plan,
          planLabel,
          startedFormatted,
          profileEmail: profile.email,
          message: `Seu plano foi ativado há ${daysDiff} dias. O prazo para reembolso é de 7 dias após a contratação.`,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        eligible: true,
        reason: "within_window",
        daysDiff,
        plan: profile.plan,
        planLabel,
        startedFormatted,
        profileEmail: profile.email,
        message: `Seu plano foi ativado há ${daysDiff} dias. Você está dentro do prazo de 7 dias para reembolso.`,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ACTION: approve — process approved refund
    if (action === "approve") {
      // Cancel plan
      await adminClient.from("profiles").update({
        plan: "free",
        plan_expires_at: null,
        plan_started_at: null,
      }).eq("id", user.id);

      // Save refund request
      await adminClient.from("refund_requests").insert({
        user_id: user.id,
        email: email || null,
        reason: reason || null,
        plan: null, // will be set from client
        days_active: null,
        status: "approved",
      });

      // Notify user
      await adminClient.from("notifications").insert({
        user_id: user.id,
        title: "✅ Reembolso aprovado",
        message: "Seu reembolso foi aprovado e será processado em até 5 dias úteis via Mercado Pago.",
        type: "refund",
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: cancel_only — cancel subscription without refund
    if (action === "cancel_only") {
      await adminClient.from("profiles").update({
        plan: "free",
        plan_expires_at: null,
      }).eq("id", user.id);

      await adminClient.from("refund_requests").insert({
        user_id: user.id,
        email: email || null,
        reason: reason || "outside_7_day_window",
        status: "denied_cancelled",
      });

      await adminClient.from("notifications").insert({
        user_id: user.id,
        title: "Assinatura cancelada",
        message: "Sua assinatura foi cancelada.",
        type: "plan",
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("smart-refund error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
