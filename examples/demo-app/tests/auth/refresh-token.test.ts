import { describe, it, expect } from "vitest";
import { SessionStore } from "../../src/auth/session-store";

describe("refresh token rotation", () => {
  it("issues a new refresh token on rotation", () => {
    const store = new SessionStore();
    const first = store.issue("alice");
    const rotated = store.rotate(first.refreshToken);

    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    expect(store.validate(rotated.refreshToken)).toBe(true);
  });

  it("rejects an unknown refresh token", () => {
    const store = new SessionStore();
    expect(() => store.rotate("not-a-real-token")).toThrow(/invalid refresh token/);
  });

  it("rejects the old refresh token after rotation", () => {
    const store = new SessionStore();
    const first = store.issue("alice");
    store.rotate(first.refreshToken);

    // The previous token must no longer validate once rotated, otherwise a
    // leaked old token could be replayed. Guards the fix in SessionStore.rotate.
    expect(store.validate(first.refreshToken)).toBe(false);
    expect(() => store.rotate(first.refreshToken)).toThrow(/invalid refresh token/);
  });
});
