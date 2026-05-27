const BACKEND_URL = process.env.BACKEND_TARGET_URL || 'https://backend-beta-mocha-88.vercel.app';
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade'
]);

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname.startsWith('/api') ? url.pathname : `/api${url.pathname}`;
  const targetUrl = new URL(`${BACKEND_URL}${pathname}${url.search}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    if (key.toLowerCase() === 'host') continue;
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
      continue;
    }
    headers.set(key, value);
  }

  if (bypassSecret) {
    headers.set('x-vercel-protection-bypass', bypassSecret);
  }

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text();

  let backendResponse;
  try {
    backendResponse = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body
    });
  } catch (error) {
    res.status(502).json({ message: 'Failed to reach backend', error: error.message });
    return;
  }

  const responseBody = await backendResponse.text();
  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    res.setHeader(key, value);
  });

  res.status(backendResponse.status);
  if (responseBody) {
    res.send(responseBody);
    return;
  }

  res.end();
}
