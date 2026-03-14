import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    if (body.type === 'payment') {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return new Response('Missing payment ID', { status: 400 });
      }

      const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      if (!accessToken) {
        throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
      }

      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );
      const payment = await mpRes.json();
      console.log('Payment details:', JSON.stringify(payment));

      if (payment.status === 'approved') {
        const externalRef = payment.external_reference || '';
        // Format: markfy_planType_userId_timestamp
        const parts = externalRef.split('_');
        if (parts.length < 3) {
          console.error('Invalid external_reference:', externalRef);
          return new Response('Invalid reference', { status: 400 });
        }

        const planType = parts[1]; // 'mensal' or 'trimestral'
        const userId = parts[2];

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const expiresAt = new Date();
        if (planType === 'mensal') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 3);
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: planType,
            plan_expires_at: expiresAt.toISOString(),
            plan_started_at: new Date().toISOString(),
            mp_payment_id: String(paymentId),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }

        await supabase.from('notifications').insert({
          user_id: userId,
          title: '✅ Plano ativado!',
          message: `Seu plano ${planType} foi ativado com sucesso até ${expiresAt.toLocaleDateString('pt-BR')}.`,
          type: 'plan',
        });

        console.log(`Plan ${planType} activated for user ${userId}`);
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal error', { status: 500, headers: corsHeaders });
  }
});
