import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { reason, email } = await req.json();
    if (!reason || !email) {
      return new Response(JSON.stringify({ error: "reason and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: insertError } = await adminClient
      .from("refund_requests")
      .insert({
        user_id: user.id,
        reason,
        email,
      });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Notify admins if available (ADMIN_USER_ID secret or user_roles table)
    const adminUserIds = new Set<string>();

    const adminFromSecret = Deno.env.get("ADMIN_USER_ID");
    if (adminFromSecret) adminUserIds.add(adminFromSecret);

    try {
      const { data: roleAdmins } = await adminClient
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      (roleAdmins || []).forEach((row: any) => {
        if (row?.user_id) adminUserIds.add(row.user_id);
      });
    } catch (_err) {
      // user_roles might not exist; ignore safely
    }

    if (adminUserIds.size > 0) {
      const notifications = Array.from(adminUserIds).map((adminId) => ({
        user_id: adminId,
        title: "Nova solicitação de reembolso",
        message: `Usuário ${email} solicitou reembolso.`,
        type: "refund",
      }));

      await adminClient.from("notifications").insert(notifications);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
