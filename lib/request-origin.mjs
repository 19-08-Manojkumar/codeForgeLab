export function requestOrigin(request) {
  const url = new URL(request.url), host = request.headers.get("host");
  if (!host) return url.origin;
  // NextURL normalizes loopback hosts to localhost. Preserve the actual Host
  // for same-origin validation and redirects (including 127.0.0.1 previews).
  const origin = new URL(`${url.protocol}//${host}`);
  if (origin.host !== host.toLowerCase() || origin.username || origin.password || origin.pathname !== "/") throw new TypeError("Invalid request host");
  return origin.origin;
}
