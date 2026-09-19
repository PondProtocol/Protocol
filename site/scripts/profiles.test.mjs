import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  ADMIN_ADDRESS,
  ADMIN_HANDLE,
  assignHandle,
  ensureProfile,
  getProfileByHandle,
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

test("next handles append one 0 each account", () => {
  const used = new Set([ADMIN_HANDLE]);
  const expected = ["tadpole010", "tadpole0100", "tadpole01000", "tadpole010000", "tadpole0100000", "tadpole01000000"];
  for (const handle of expected) {
    assert.equal(nextHandle(used), handle);
    used.add(handle);
  }
});

test("admin address is always tadpole01", () => {
  assert.equal(assignHandle(ADMIN_ADDRESS, new Set(["tadpole01", "tadpole010"])), ADMIN_HANDLE);
  assert.equal(assignHandle("rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpADk", new Set([ADMIN_HANDLE])), "tadpole010");
});

test("login assigns reserved admin then tadpole010", () =>
  withStore(async () => {
    const admin = await ensureProfile(ADMIN_ADDRESS);
    const second = await ensureProfile("rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpADk");
    const third = await ensureProfile("rN7n7otQDd6FczFgLdqtyMVrn3HMsmEaNz");
    assert.equal(admin.handle, "tadpole01");
    assert.equal(admin.admin, true);
    assert.equal(second.handle, "tadpole010");
    assert.equal(second.admin, false);
    assert.equal(third.handle, "tadpole0100");
    assert.equal((await ensureProfile(ADMIN_ADDRESS)).handle, "tadpole01");
    assert.equal((await ensureProfile("rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpADk")).handle, "tadpole010");
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
