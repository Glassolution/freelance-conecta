import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
    }

    const { payment_id } = await req.json();

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment_id}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    const data = await response.json();

    return new Response(
      JSON.stringify({
        status: data.status,
        status_detail: data.status_detail,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error checking payment:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
