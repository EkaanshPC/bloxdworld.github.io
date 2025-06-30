export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response("Missing ?url= parameter", { status: 400 });
  }

  const init = {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined
  };

  const response = await fetch(target, init);
  const resHeaders = new Headers(response.headers);
  resHeaders.set("Access-Control-Allow-Origin", "*");
  resHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  resHeaders.set("Access-Control-Allow-Headers", "*");

  return new Response(await response.text(), {
    status: response.status,
    headers: resHeaders
  });
}
