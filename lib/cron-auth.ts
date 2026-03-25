export function isCronAuthorized(request: Request, secret: string | undefined) {
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cronHeader = request.headers.get("x-cron-secret");

  return bearerToken === secret || cronHeader === secret;
}
