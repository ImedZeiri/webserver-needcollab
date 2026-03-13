import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// ─── URL-safe base64 ─────────────────────────────────────────────────────────
function toBase64(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64(str: string): string {
  const standard = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '=='.slice(0, (4 - standard.length % 4) % 4);
  return atob(padded);
}

// ─── Crypto helpers ──────────────────────────────────────────────────────────
function getTimeSlot(): number {
  return Math.floor(Date.now() / 60000);
}

function getRandomSalt(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateKey(timeSlot: number, salt: string): string {
  return btoa(`${timeSlot}-${salt}-secret-key`);
}

function xorCipher(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function encrypt(data: string): string {
  const timeSlot = getTimeSlot();
  const salt = getRandomSalt();
  const key = generateKey(timeSlot, salt);
  const encrypted = xorCipher(data, key);
  const payload = salt + '|' + encrypted;
  return toBase64(payload);
}

function decrypt(encrypted: string): string {
  let decoded: string;
  try {
    decoded = fromBase64(encrypted);
  } catch {
    throw new Error('Encrypted endpoint is not valid base64');
  }

  const currentSlot = getTimeSlot();
  const slots = [currentSlot, currentSlot - 1];

  for (const timeSlot of slots) {
    try {
      if (decoded.includes('|')) {
        const pipeIndex = decoded.indexOf('|');
        const salt = decoded.slice(0, pipeIndex);
        const data = decoded.slice(pipeIndex + 1);
        const key = generateKey(timeSlot, salt);
        return xorCipher(data, key);
      }
      const key = generateKey(timeSlot, '');
      return xorCipher(decoded, key);
    } catch {
      // try previous slot
    }
  }

  throw new Error('Failed to decrypt endpoint for all time slots');
}

// ─── Response helpers ────────────────────────────────────────────────────────
function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const encryptedEndpoint = url.pathname.split('/').pop();

  if (!encryptedEndpoint) {
    return jsonError('Endpoint required', 400);
  }

  let targetFunction: string;
  try {
    targetFunction = decrypt(encryptedEndpoint);
  } catch (error) {
    return jsonError(`Decryption failed: ${(error as Error).message}`, 400);
  }

  if (!/^[\w-]+$/.test(targetFunction)) {
    return jsonError('Decrypted endpoint contains invalid characters', 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) {
    return jsonError('SUPABASE_URL is not configured', 500);
  }

  const targetUrl = `${supabaseUrl}/functions/v1/${targetFunction}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    const data = await response.text();

    if (data.trimStart().startsWith('<')) {
      return jsonError(
        `Upstream function "${targetFunction}" returned HTML (status ${response.status}). ` +
        `Verify it is deployed and accessible.`,
        502
      );
    }

    const encryptedData = encrypt(data);
    const payload = JSON.stringify({data: encryptedData });

    return new Response(payload, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return jsonError(`Failed to reach upstream function: ${(error as Error).message}`, 502);
  }
});