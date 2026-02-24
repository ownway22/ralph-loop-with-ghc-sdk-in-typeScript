import {
  pbkdf2Sync,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

export type HashAlgorithm = 'sha512';

export interface PasswordHash {
  salt: string;
  digest: string;
  iterations: number;
  keyLength: number;
  algorithm: HashAlgorithm;
}

export interface UserRecord {
  id: string;
  email: string;
  password: PasswordHash;
  createdAt: string;
}

export interface SessionToken {
  token: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

export const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_HASH_ALGORITHM: HashAlgorithm = 'sha512';
const DEFAULT_HASH_ITERATIONS = 120_000;
const DEFAULT_HASH_KEY_LENGTH = 64;

export function hashPassword(
  password: string,
  salt?: string,
): PasswordHash {
  const actualSalt = salt ?? randomBytes(16).toString('hex');
  const digest = pbkdf2Sync(
    password,
    actualSalt,
    DEFAULT_HASH_ITERATIONS,
    DEFAULT_HASH_KEY_LENGTH,
    DEFAULT_HASH_ALGORITHM,
  ).toString('hex');

  return {
    salt: actualSalt,
    digest,
    algorithm: DEFAULT_HASH_ALGORITHM,
    iterations: DEFAULT_HASH_ITERATIONS,
    keyLength: DEFAULT_HASH_KEY_LENGTH,
  };
}

export function verifyPassword(
  password: string,
  hashed: PasswordHash,
): boolean {
  const candidate = pbkdf2Sync(
    password,
    hashed.salt,
    hashed.iterations,
    hashed.keyLength,
    hashed.algorithm,
  );
  const stored = Buffer.from(hashed.digest, 'hex');
  if (candidate.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(candidate, stored);
}

export function createUserRecord(email: string, password: string): UserRecord {
  return {
    id: randomUUID(),
    email,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
}

export function createSessionToken(
  userId: string,
  options?: { durationMs?: number },
): SessionToken {
  const issuedAt = Date.now();
  const durationMs = options?.durationMs ?? DEFAULT_SESSION_DURATION;

  return {
    token: randomBytes(24).toString('hex'),
    userId,
    issuedAt,
    expiresAt: issuedAt + durationMs,
  };
}

export function isSessionTokenValid(
  session: SessionToken,
  now: number = Date.now(),
): boolean {
  return now >= session.issuedAt && now <= session.expiresAt;
}
