import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_SESSION_DURATION,
  createSessionToken,
  createUserRecord,
  isSessionTokenValid,
  verifyPassword,
} from './index.js';

describe('authentication utilities', () => {
  it('hashes passwords and verifies the original secret', () => {
    const user = createUserRecord('tester@example.com', 'super-secret');

    assert.ok(verifyPassword('super-secret', user.password));
    assert.notStrictEqual(
      user.password.digest,
      user.password.salt,
      'digest should not equal salt',
    );
    assert.strictEqual(
      verifyPassword('wrong', user.password),
      false,
    );
  });

  it('creates session tokens with 24h expiration by default', () => {
    const session = createSessionToken(userIdFrom('user-a'));

    assert.strictEqual(
      session.expiresAt - session.issuedAt,
      DEFAULT_SESSION_DURATION,
    );
    assert.ok(isSessionTokenValid(session));
  });

  it('allows overriding the expiration duration', () => {
    const duration = 1_000;
    const session = createSessionToken(userIdFrom('custom'), { durationMs: duration });

    assert.strictEqual(session.expiresAt - session.issuedAt, duration);
    assert.ok(isSessionTokenValid(session, session.issuedAt + duration / 2));
    assert.strictEqual(isSessionTokenValid(session, session.expiresAt + 1), false);
    assert.strictEqual(isSessionTokenValid(session, session.issuedAt - 1), false);
  });
});

function userIdFrom(seed: string): string {
  return `${seed}-${Date.now()}`;
}
