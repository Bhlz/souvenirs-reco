const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const ADMIN_COOKIE = 'admin_token';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const MIN_PASSWORD_LENGTH = 8;
const MIN_SECRET_LENGTH = 16;

type AdminAuthConfig = {
  password: string;
  secret: string;
  issues: string[];
  blockingIssue?: string;
};

const base64UrlEncode = (bytes: Uint8Array) => {
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlDecode = (value: string) => {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary =
    typeof atob === 'function'
      ? atob(b64)
      : Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export const getAdminAuthConfig = (): AdminAuthConfig => {
  const password = (process.env.ADMIN_PASSWORD || '').trim();
  const secret = (process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '').trim();
  const issues: string[] = [];
  let blockingIssue: string | undefined;

  if (!password) {
    blockingIssue = 'ADMIN_PASSWORD no está configurado';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push(`Usa una contraseña de al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  if (!process.env.ADMIN_SECRET) {
    issues.push('Define ADMIN_SECRET distinto a ADMIN_PASSWORD para firmar tokens');
  } else if (secret.length < MIN_SECRET_LENGTH) {
    issues.push(`ADMIN_SECRET debe tener mínimo ${MIN_SECRET_LENGTH} caracteres`);
  }

  return { password, secret, issues, blockingIssue };
};

const getSecret = () => getAdminAuthConfig().secret;

let keyPromise: Promise<CryptoKey> | null = null;
const getKey = () => {
  if (keyPromise) return keyPromise;
  const secret = getSecret();
  if (!secret) throw new Error('Missing ADMIN_SECRET or ADMIN_PASSWORD for admin auth');
  keyPromise = crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return keyPromise;
};

type TokenPayload = { exp: number; iat: number };

const sign = async (data: string) => {
  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return new Uint8Array(signature);
};

const toArrayBuffer = (bytes: Uint8Array) =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

const verifySignature = async (data: string, signature: Uint8Array) => {
  const key = await getKey();
  const signatureBuffer = toArrayBuffer(signature);
  return crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(data));
};

export const createAdminToken = async (ttlMs = DEFAULT_TTL_MS) => {
  const now = Date.now();
  const payload: TokenPayload = { iat: now, exp: now + ttlMs };
  const data = JSON.stringify(payload);
  const signature = await sign(data);
  return `${base64UrlEncode(encoder.encode(data))}.${base64UrlEncode(signature)}`;
};

export const verifyAdminToken = async (token?: string | null) => {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  const [dataPart, sigPart] = token.split('.');
  if (!dataPart || !sigPart) return false;

  try {
    const dataBytes = base64UrlDecode(dataPart);
    const signatureBytes = base64UrlDecode(sigPart);
    const data = decoder.decode(dataBytes);
    const payload: TokenPayload = JSON.parse(data);

    if (!payload?.exp || payload.exp < Date.now()) return false;
    const isValid = await verifySignature(data, signatureBytes);
    return isValid;
  } catch {
    return false;
  }
};

export const isAdminAuthConfigured = () => {
  const cfg = getAdminAuthConfig();
  return !cfg.blockingIssue && !!cfg.secret;
};
