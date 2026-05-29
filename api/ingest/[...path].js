export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/ingest', '');
  const search = url.search;
  const target = `https://us.i.posthog.com${path}${search}`;

  const headers = new Headers(req.headers);
  headers.set('host', 'us.i.posthog.com');

  const response = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' 
      ? req.body 
      : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
