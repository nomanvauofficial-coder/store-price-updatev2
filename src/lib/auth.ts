import crypto from 'crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'mudi_admin_session'
// Secret never lives in the repo: use ADMIN_SECRET, else derive from DATABASE_URL.
const SECRET =
  process.env.ADMIN_SECRET ||
  crypto
    .createHash('sha256')
    .update('mudi-ghor:' + (process.env.DATABASE_URL ?? 'local-dev'))
    .digest('hex')
const TTL_MS = 7 * 24 * 3600 * 1000 // 7 days

export function createToken(ttlMs = TTL_MS): string {
  const exp = Date.now() + ttlMs
  const sig = crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex')
  return `${exp}.${sig}`
}

export function verifyToken(token?: string | null): boolean {
  if (!token) return false
  const [expStr, sig] = token.split('.')
  if (!expStr || !sig) return false
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Date.now()) return false
  const expected = crypto.createHmac('sha256', SECRET).update(expStr).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

/** Check admin session from request cookies (server side) */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return verifyToken(store.get(ADMIN_COOKIE)?.value)
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: TTL_MS / 1000,
}

/** Password hashing (scrypt). Stored as "scrypt$salt$hash". */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function checkPassword(password: string, stored: string): boolean {
  if (!stored.startsWith('scrypt$')) {
    // legacy plain-text value
    const a = Buffer.from(password)
    const b = Buffer.from(stored)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  }
  const [, salt, hash] = stored.split('$')
  if (!salt || !hash) return false
  const test = crypto.scryptSync(password, salt, 64)
  const real = Buffer.from(hash, 'hex')
  return test.length === real.length && crypto.timingSafeEqual(test, real)
}

/** Current admin password: DB (hashed) if changed, else ADMIN_PASSWORD env, else "admin123". */
export function fallbackPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123'
}
