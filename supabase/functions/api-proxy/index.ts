import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

function getTimeSlot(): number {
  return Math.floor(Date.now() / 60000);
}

function generateKey(timeSlot: number): string {
  return btoa(`${timeSlot}-secret-key`);
}

function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function decrypt(encryptedUrl: string): string {
  const timeSlot = getTimeSlot();
  const key = generateKey(timeSlot);
  const decoded = atob(encryptedUrl);
  return xorEncrypt(decoded, key);
}

function encrypt(data: string): string {
  const timeSlot = getTimeSlot();
  const key = generateKey(timeSlot);
  return btoa(xorEncrypt(data, key));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-encrypted-endpoint',
      },
    });
  }

  try {
    const encryptedEndpoint = req.headers.get('x-encrypted-endpoint');
    
    if (!encryptedEndpoint) {
      return new Response(JSON.stringify({ error: 'Missing encrypted endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const endpoint = decrypt(encryptedEndpoint);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const targetUrl = `${supabaseUrl}/functions/v1/${endpoint}`;

    const headers = new Headers(req.headers);
    headers.delete('x-encrypted-endpoint');
    headers.delete('host');

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.body,
    });

    const data = await response.text();
    const encryptedResponse = encrypt(data);

    return new Response(encryptedResponse, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
