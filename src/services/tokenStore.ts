// Token and session storage for the admin console.
// Persists the session, access/refresh tokens and expiry in localStorage (when
// "remember me" is set) or sessionStorage (per-tab), with a session marker that
// wins over a stale persistent session. All storage access is guarded so private
// mode degrades to in-memory only; cachedSession mirrors storage for sync reads.

import type { AuthSession } from "../types/models";

const SESSION_KEY = "raut_admin_session";
const ACCESS_TOKEN_KEY = "raut_admin_access_token";
const REFRESH_TOKEN_KEY = "raut_admin_refresh_token";
const EXPIRES_AT_KEY = "raut_admin_access_expires_at";
const PERSIST_KEY = "raut_admin_persist";

const STORAGE_KEYS = [
  SESSION_KEY,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  EXPIRES_AT_KEY,
  PERSIST_KEY,
];

const listeners = new Set<() => void>();

type Persistence = "local" | "session";

const getStorage = (persistence: Persistence) => {
  if (typeof window === "undefined") return null;

  try {
    return persistence === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
};

const readFrom = (storage: Storage | null, key: string) => {
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const writeTo = (storage: Storage | null, key: string, value: string) => {
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode). The session then lives in memory only.
  }
};

const removeFrom = (storage: Storage | null, key: string) => {
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures, the in-memory state is cleared either way.
  }
};

// "Remember me" chooses which storage keeps the session. A session marker in
// sessionStorage wins over localStorage so an unchecked sign-in in one tab is
// never resurrected from a persistent session in another.
const getPersistence = (): Persistence => {
  if (readFrom(getStorage("session"), PERSIST_KEY) === "session") {
    return "session";
  }

  return "local";
};

const activeStorage = () => getStorage(getPersistence());

const read = (key: string) => readFrom(activeStorage(), key);

const write = (key: string, value: string) =>
  writeTo(activeStorage(), key, value);

const readSession = (): AuthSession | null => {
  const raw = read(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

let cachedSession: AuthSession | null = readSession();

export const getSessionSnapshot = (): AuthSession | null => cachedSession;

export const subscribeSession = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => {
  cachedSession = readSession();
  listeners.forEach((listener) => listener());
};

const computeExpiresAt = (expiresIn) => {
  const seconds = Number(expiresIn);
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Date.now() + seconds * 1000;
};

export const saveSession = ({
  session,
  accessToken,
  refreshToken,
  expiresIn,
  remember = true,
}: {
  session: AuthSession;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresIn?: number | string | null;
  remember?: boolean;
}) => {
  const persistence: Persistence = remember ? "local" : "session";
  const target = getStorage(persistence);
  const stale = getStorage(persistence === "local" ? "session" : "local");

  STORAGE_KEYS.forEach((key) => removeFrom(stale, key));

  writeTo(target, PERSIST_KEY, persistence);
  writeTo(target, SESSION_KEY, JSON.stringify(session));
  writeTo(target, ACCESS_TOKEN_KEY, accessToken ?? "");
  writeTo(target, REFRESH_TOKEN_KEY, refreshToken ?? "");
  writeTo(target, EXPIRES_AT_KEY, String(computeExpiresAt(expiresIn)));
  emit();
};

export const updateTokens = ({
  accessToken,
  refreshToken,
  expiresIn,
}: {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresIn?: number | string | null;
} = {}) => {
  if (accessToken !== undefined && accessToken !== null) {
    write(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken !== undefined && refreshToken !== null) {
    write(REFRESH_TOKEN_KEY, refreshToken);
  }

  const expiresAt = computeExpiresAt(expiresIn);
  if (expiresAt) write(EXPIRES_AT_KEY, String(expiresAt));

  emit();
};

export const updateSession = (patch: Partial<AuthSession>) => {
  const current = readSession();
  if (!current) return;

  write(SESSION_KEY, JSON.stringify({ ...current, ...patch }));
  emit();
};

export const clearSession = () => {
  const storages = [getStorage("local"), getStorage("session")];

  storages.forEach((storage) => {
    STORAGE_KEYS.forEach((key) => removeFrom(storage, key));
  });

  emit();
};

export const getAccessToken = () => read(ACCESS_TOKEN_KEY) || null;

export const getRefreshToken = () => read(REFRESH_TOKEN_KEY) || null;

export const getExpiresAt = () => Number(read(EXPIRES_AT_KEY)) || 0;

export const isAccessTokenExpired = () => {
  const expiresAt = getExpiresAt();
  if (!expiresAt) return false;
  return Date.now() >= expiresAt;
};
