const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 50, offset = 0 } = await req.json().catch(() => ({}));

    const jobIds = [3, 9, 7, 2, 17, 59, 671, 119, 162, 104, 582, 153];
    const jobsParam = jobIds.map(id => `jobs[]=${id}`).join('&');

    const url = `https://www.freelancer.com/api/projects/0.1/projects/active?job_details=true&limit=${limit}&offset=${offset}&${jobsParam}`;

    console.log('Fetching Freelancer jobs:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Ikas-App/1.0',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Freelancer API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: `Freelancer API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetched ${data?.result?.projects?.length || 0} jobs`);

    return new Response(
      JSON.stringify({ success: true, data: data.result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching freelancer jobs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
