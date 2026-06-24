import { randomUUID } from "node:crypto";

export interface Session {
  userId: string;
  refreshToken: string;
  issuedAt: number;
}

/**
 * In-memory session store with refresh-token rotation.
 *
 * This is the demo app for the one-day intensive. It carries a deliberate
 * bug that threads the whole course: when a refresh token is rotated, the
 * PREVIOUS token is left in the store, so the old token still validates after
 * rotation. Recovering that intent, planning the fix, and verifying it is the
 * running example across Modules 2-5.
 */
export class SessionStore {
  private sessionsByToken = new Map<string, Session>();

  /** Issue a brand-new session and its first refresh token. */
  issue(userId: string): Session {
    const session: Session = {
      userId,
      refreshToken: randomUUID(),
      issuedAt: Date.now(),
    };
    this.sessionsByToken.set(session.refreshToken, session);
    return session;
  }

  /**
   * Rotate a refresh token: validate the presented token and issue a new one.
   *
   * BUG: the previous refresh token is not removed from the store, so it still
   * validates after rotation. The fix is to invalidate it here (see the course
   * Implementation Plan: "refresh token rotation").
   */
  rotate(refreshToken: string): Session {
    const existing = this.sessionsByToken.get(refreshToken);
    if (!existing) {
      throw new Error("invalid refresh token");
    }
    const rotated: Session = {
      userId: existing.userId,
      refreshToken: randomUUID(),
      issuedAt: Date.now(),
    };
    this.sessionsByToken.set(rotated.refreshToken, rotated);
    // Invalidate the previous refresh token so it no longer validates.
    this.sessionsByToken.delete(refreshToken);
    return rotated;
  }

  /** Whether a refresh token currently validates. */
  validate(refreshToken: string): boolean {
    return this.sessionsByToken.has(refreshToken);
  }
}
