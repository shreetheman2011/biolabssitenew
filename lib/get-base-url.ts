import { headers } from "next/headers";

// Only used to build an absolute, shareable join link, everything else in the app can use
// relative paths. Falls back to http in local dev where there's no reverse-proxy TLS header.
export async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  return `${proto}://${host}`;
}
