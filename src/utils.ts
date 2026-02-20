/**
 * Decode a JWT payload without verifying the signature.
 * Trusts the token as it comes from the parent page via postMessage.
 */
export function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("Invalid JWT format")

  const payload = parts[1]
  // base64url → base64
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const decoded = atob(padded)
  return JSON.parse(decoded)
}
