const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_LENGTH = 6000;
const MAX_FIELD_LENGTH = 120;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s().-]{10,20}$/;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = buildCorsHeaders(origin, env.ALLOWED_ORIGIN);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      if (request.method === 'POST' && url.pathname === '/chat') {
        return withCors(await handleChat(request, env), corsHeaders);
      }

      if (request.method === 'POST' && url.pathname === '/lead') {
        return withCors(await handleLead(request, env), corsHeaders);
      }

      return withCors(jsonResponse({ error: 'Not found' }, 404), corsHeaders);
    } catch (error) {
      console.error(error);
      return withCors(jsonResponse({ error: 'Internal error' }, 500), corsHeaders);
    }
  }
};

async function handleChat(request, env) {
  requireEnv(env.GEMINI_API_KEY, 'GEMINI_API_KEY');

  const body = await readJson(request);
  const message = safeText(body.message, MAX_MESSAGE_LENGTH);
  const history = safeText(body.history, MAX_HISTORY_LENGTH);

  if (!message) {
    return jsonResponse({ error: 'Message is required' }, 400);
  }

  const prompt = [
    'Você é um assistente virtual útil e objetivo da empresa ValeDrone.',
    'A ValeDrone trabalha com filmagens aéreas usando drones, tours panorâmicos 360 graus e cobertura de eventos, imóveis e obras.',
    'Responda de forma curta, prestativa e em português do Brasil.',
    '',
    'Histórico:',
    history,
    `Usuário: ${message}`,
    'Assistente:'
  ].join('\n');

  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!geminiResponse.ok) {
    return jsonResponse({ error: 'AI provider error' }, 502);
  }

  const data = await geminiResponse.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof reply !== 'string' || !reply.trim()) {
    return jsonResponse({ error: 'AI provider returned an invalid response' }, 502);
  }

  return jsonResponse({ reply: reply.slice(0, MAX_MESSAGE_LENGTH) });
}

async function handleLead(request, env) {
  requireEnv(env.CALLMEBOT_API_KEY, 'CALLMEBOT_API_KEY');
  requireEnv(env.WHATSAPP_PHONE, 'WHATSAPP_PHONE');

  const body = await readJson(request);
  const user = body.user || {};
  const name = safeText(user.name, 80);
  const email = safeText(user.email, MAX_FIELD_LENGTH);
  const phone = safeText(user.phone, 20);
  const history = safeText(body.history, MAX_HISTORY_LENGTH);

  if (!name || !EMAIL_RE.test(email) || !PHONE_RE.test(phone)) {
    return jsonResponse({ error: 'Invalid lead data' }, 400);
  }

  const text = [
    '*Novo Contato via Site*',
    `Nome: ${name}`,
    `E-mail: ${email}`,
    `Telefone: ${phone}`,
    '',
    '*Histórico da Conversa:*',
    history
  ].join('\n');

  const callMeBotUrl = new URL('https://api.callmebot.com/whatsapp.php');
  callMeBotUrl.searchParams.set('phone', env.WHATSAPP_PHONE);
  callMeBotUrl.searchParams.set('text', text.slice(0, MAX_HISTORY_LENGTH));
  callMeBotUrl.searchParams.set('apikey', env.CALLMEBOT_API_KEY);

  const response = await fetch(callMeBotUrl.toString(), { method: 'GET' });
  if (!response.ok) {
    return jsonResponse({ error: 'Lead provider error' }, 502);
  }

  return jsonResponse({ ok: true });
}

async function readJson(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Invalid content type');
  }

  return request.json();
}

function safeText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function buildCorsHeaders(origin, allowedOrigin) {
  const allowed = allowedOrigin && origin === allowedOrigin ? origin : allowedOrigin || '';

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function withCors(response, corsHeaders) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (value) headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
