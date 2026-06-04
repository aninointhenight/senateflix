// ── Simple in-memory cache ────────────────────────────────────
// Persists across page navigations (SPA module-level state).
// Prevents re-fetching Supabase on every route change.

const TTL_MS = 5 * 60 * 1000 // 5 minutes
const store  = {}

export function cacheGet(key) {
  const entry = store[key]
  if (!entry) return null
  if (Date.now() - entry.ts > TTL_MS) { delete store[key]; return null }
  return entry.data
}

export function cacheSet(key, data) {
  store[key] = { data, ts: Date.now() }
}

export function cacheClear(key) {
  if (key) delete store[key]
  else Object.keys(store).forEach(k => delete store[k])
}
