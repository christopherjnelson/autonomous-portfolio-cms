import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const webhookUrl = import.meta.env.N8N_CHAT_WEBHOOK;

  if (!webhookUrl) {
    return new Response(
      JSON.stringify({ status: 'offline' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(webhookUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // n8n webhooks typically return 200 or 405 for GET requests
    // Either way, the endpoint is reachable
    if (res.status === 200 || res.status === 405 || res.status === 404) {
      return new Response(
        JSON.stringify({ status: 'online' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ status: 'offline' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ status: 'offline' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};