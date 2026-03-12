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

    const { planId, planName, price, userEmail } = await req.json();

    if (!planId || !planName || !price) {
      throw new Error('Missing required fields: planId, planName, price');
    }

    const preference = {
      items: [
        {
          id: planId,
          title: `Markfy - Plano ${planName}`,
          description: `Assinatura ${planName} da plataforma Markfy`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(price),
        },
      ],
      payer: {
        email: userEmail || undefined,
      },
      back_urls: {
        success: `${req.headers.get('origin') || 'https://ikas.com'}/dashboard?payment=success`,
        failure: `${req.headers.get('origin') || 'https://ikas.com'}/pricing?payment=failure`,
        pending: `${req.headers.get('origin') || 'https://ikas.com'}/pricing?payment=pending`,
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
      statement_descriptor: 'IKAS',
      external_reference: `ikas_${planId}_${Date.now()}`,
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MercadoPago API error:', JSON.stringify(data));
      throw new Error(`MercadoPago API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        id: data.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error creating checkout:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
