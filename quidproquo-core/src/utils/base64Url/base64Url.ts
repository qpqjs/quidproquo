// Base64url (RFC 4648 §5, unpadded) over UTF-8 text, on web globals
// (TextEncoder/TextDecoder/btoa/atob) rather than Node's Buffer so it works in
// browser bundles of quidproquo-core too. This is the JOSE encoding: JWT
// headers and payloads are base64url, never plain base64.

export const base64UrlEncodeUtf8 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);

  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const isBase64Url = (value: string): boolean => /^[A-Za-z0-9_-]+$/.test(value);

// Returns null rather than throwing for anything that is not base64url, so
// callers validating untrusted input (a bearer token) can branch without a
// try/catch.
export const base64UrlDecodeUtf8 = (value: string): string | null => {
  if (!isBase64Url(value)) {
    return null;
  }

  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return null;
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
};
