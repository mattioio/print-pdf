/**
 * Password hashing helpers — matches Better Auth's scrypt format.
 * Format: `{salt}:{hash}` where salt is 16-byte hex, hash is 64-byte scrypt-derived hex.
 */
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

const SCRYPT_N = 16384; // CPU/memory cost
const SCRYPT_R = 8;     // block size
const SCRYPT_P = 1;     // parallelism
const KEY_LEN = 64;     // derived key length in bytes

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `${salt}:${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  const storedBuf = Buffer.from(hash, 'hex');
  return timingSafeEqual(derived, storedBuf);
}
