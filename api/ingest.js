export default async function handler(req, res) {
  const path = req.url.replace('/api/ingest', '') || '/';
  const target = `https://us.i.posthog.com${path}`;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'host': 'us.i.posthog.com',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body)
        : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
