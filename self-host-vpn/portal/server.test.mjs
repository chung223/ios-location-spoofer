import assert from "node:assert/strict";
import test from "node:test";
import { makeCode, mintInvite, checkInvite, markUsed } from "./server.mjs";

test("makeCode 產生 URL-safe 邀請碼", () => {
  const c = makeCode();
  assert.ok(c.length >= 10 && /^[A-Za-z0-9_-]+$/.test(c), c);
});

test("mintInvite 建立未使用的邀請碼（可帶效期）", () => {
  const now = 1_000_000;
  const { code, invites } = mintInvite({}, { code: "ABC", ttlMs: 1000, now });
  assert.equal(code, "ABC");
  assert.equal(invites.ABC.used, false);
  assert.equal(invites.ABC.expires, now + 1000);
});

test("checkInvite：有效 / 無效 / 已用 / 過期", () => {
  const now = 1_000_000;
  let inv = mintInvite({}, { code: "ok", now }).invites;
  assert.deepEqual(checkInvite(inv, "ok", now), { ok: true });

  assert.equal(checkInvite(inv, "nope", now).ok, false);

  inv = mintInvite({}, { code: "exp", ttlMs: 100, now }).invites;
  assert.equal(checkInvite(inv, "exp", now + 200).ok, false, "過期應擋");

  inv = markUsed(mintInvite({}, { code: "u", now }).invites, "u", "alice", now);
  const r = checkInvite(inv, "u", now);
  assert.equal(r.ok, false);
  assert.match(r.reason, /已被使用/);
});

test("markUsed 記錄使用者", () => {
  const inv = markUsed(mintInvite({}, { code: "x", now: 1 }).invites, "x", "bob", 5);
  assert.equal(inv.x.used, true);
  assert.equal(inv.x.usedBy, "bob");
  assert.equal(inv.x.usedAt, 5);
});
