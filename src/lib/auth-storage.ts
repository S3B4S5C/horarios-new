export const STORAGE_KEYS = {
  TOKENS: 'auth:tokens',
  USER: 'auth:user',
} as const;

export type Tokens = { access: string; refresh: string };

export function saveSession(tokens: Tokens, user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function readTokens(): Tokens | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.TOKENS);
  return raw ? JSON.parse(raw) as Tokens : null;
}

export function readUser<T = any>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) as T : null;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.TOKENS);
  localStorage.removeItem(STORAGE_KEYS.USER);
}