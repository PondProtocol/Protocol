import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  ADMIN_ADDRESS,
  ADMIN_HANDLE,
  HANDLE_RE,
  MAX_HANDLE_N,
  assignHandle,
  ensureProfile,
  getProfileByHandle,
  handleForN,
  nextHandle,
  updateOwnProfile,
} from "./profiles.mjs";

function withStore(run) {
  const dir = mkdtempSync(join(tmpdir(), "pond-profiles-"));
  const prev = process.env.POND_PROFILE_STORE;
  process.env.POND_PROFILE_STORE = join(dir, "profiles.json");
  return Promise.resolve()
    .then(run)
    .finally(() => {
      if (prev === undefined) delete process.env.POND_PROFILE_STORE;
      else process.env.POND_PROFILE_STORE = prev;
      rmSync(dir, { recursive: true, force: true });
    });
}

test("handles are tadpole0 plus sequential integers", () => {
  assert.equal(handleForN(1), "tadpole01");
  assert.equal(handleForN(2), "tadpole02");
  assert.equal(handleForN(9), "tadpole09");
  assert.equal(handleForN(10), "tadpole010");
  assert.equal(handleForN(11), "tadpole011");
  assert.equal(handleForN(100), "tadpole0100");
  assert.equal(handleForN(MAX_HANDLE_N), "tadpole099999999999");
  assert.match("tadpole01", HANDLE_RE);
  assert.match("tadpole02", HANDLE_RE);
  assert.match("tadpole010", HANDLE_RE);
  assert.match("tadpole011", HANDLE_RE);
  assert.match("tadpole0100", HANDLE_RE);
  assert.match("tadpole099999999999", HANDLE_RE);
  assert.doesNotMatch("tadpole00", HANDLE_RE);
});

test("next handle is the next unused integer, not extra zeros", () => {
  const used = new Set([ADMIN_HANDLE]);
  assert.equal(nextHandle(used), "tadpole02");
  used.add("tadpole02");
  assert.equal(nextHandle(used), "tadpole03");
  for (let n = 3; n <= 9; n += 1) used.add(handleForN(n));
  assert.equal(nextHandle(used), "tadpole010");
  used.add("tadpole010");
  assert.equal(nextHandle(used), "tadpole011");
});

test("admin address is always tadpole01", () => {
  assert.equal(assignHandle(ADMIN_ADDRESS, new Set(["tadpole01", "tadpole02"])), ADMIN_HANDLE);
  assert.equal(assignHandle("rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpADk", new Set([ADMIN_HANDLE])), "tadpole02");
});

test("login assigns reserved admin then tadpole02", () =>
  withStore(async () => {
    const admin = await ensureProfile(ADMIN_ADDRESS);
    const second = await ensureProfile("rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpADk");
    const third = await ensureProfile("rN7n7otQDd6FczFgLdqtyMVrn3HMsmEaNz");
    assert.equal(admin.handle, "tadpole01");
    assert.equal(admin.admin, true);
    assert.equal(second.handle, "tadpole02");
    assert.equal(second.admin, false);
    assert.equal(third.handle, "tadpole03");
    assert.equal((await ensureProfile(ADMIN_ADDRESS)).handle, "tadpole01");
    assert.equal((await ensureProfile("rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpADk")).handle, "tadpole02");
    const stored = JSON.parse(readFileSync(process.env.POND_PROFILE_STORE, "utf8"));
    assert.equal(stored.profiles.some((row) => "seed" in row || "secret" in row || "privateKey" in row), false);
    assert.ok(getProfileByHandle("tadpole01"));
  }));

test("profile fields stay small and reject seeds", () =>
  withStore(async () => {
    await ensureProfile(ADMIN_ADDRESS);
    const saved = await updateOwnProfile(ADMIN_ADDRESS, {
      displayName: "Greenhead",
      bio: "Owner of Pond Protocol.",
      progress: { begin: true, "what-is-pnd": true, extra: true },
    });
    assert.equal(saved.displayName, "Greenhead");
    assert.equal(saved.bio, "Owner of Pond Protocol.");
    assert.deepEqual(saved.progress, { begin: true, "what-is-pnd": true });
    const secret = await updateOwnProfile(ADMIN_ADDRESS, {
      bio: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
    });
    assert.equal(secret.error, "bad_profile");
  }));
