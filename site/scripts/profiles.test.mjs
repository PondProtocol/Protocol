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
  handleProfiles,
  markLastSignIn,
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

function mockRes() {
  const res = {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(payload) {
      this.body = payload || "";
    },
  };
  return res;
}

async function profileApi(url, { session } = {}) {
  const res = mockRes();
  const handled = await handleProfiles({ method: "GET", headers: {}, socket: {} }, res, url, {
    readSession: () => session || null,
  });
  return { handled, res, data: res.body ? JSON.parse(res.body) : {} };
}

test("profile API hides accounts without an active Xaman session", () =>
  withStore(async () => {
    await ensureProfile(ADMIN_ADDRESS);
    const loggedOut = await profileApi("/api/profile/tadpole01");
    assert.equal(loggedOut.res.statusCode, 401);
    assert.equal(loggedOut.data.handle, undefined);
    assert.equal(loggedOut.data.address, undefined);
    assert.equal(loggedOut.data.displayName, undefined);

    const wallet = await profileApi("/api/profile/tadpole01", {
      session: { address: ADMIN_ADDRESS, method: "walletconnect" },
    });
    assert.equal(wallet.res.statusCode, 403);
    assert.equal(wallet.data.handle, undefined);
    assert.equal(wallet.data.address, undefined);
    assert.match(wallet.data.message, /WalletConnect/);

    const other = await profileApi("/api/profile/tadpole02", {
      session: { address: ADMIN_ADDRESS, method: "xaman" },
    });
    assert.equal(other.res.statusCode, 404);
    assert.equal(other.data.handle, undefined);
    assert.equal(other.data.address, undefined);

    const own = await profileApi("/api/profile/tadpole01", {
      session: { address: ADMIN_ADDRESS, method: "xaman" },
    });
    assert.equal(own.res.statusCode, 200);
    assert.equal(own.data.handle, "tadpole01");
    assert.equal(own.data.address, ADMIN_ADDRESS);
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

test("accepted disclaimer is stored on the profile", () =>
  withStore(async () => {
    await ensureProfile(ADMIN_ADDRESS);
    assert.equal((await updateOwnProfile(ADMIN_ADDRESS, {})).disclaimerAccepted, false);
    const saved = await updateOwnProfile(ADMIN_ADDRESS, { disclaimerAccepted: true });
    assert.equal(saved.disclaimerAccepted, true);
    const stored = JSON.parse(readFileSync(process.env.POND_PROFILE_STORE, "utf8"));
    const row = stored.profiles.find((item) => item.handle === "tadpole01");
    assert.equal(row.disclaimerAccepted, true);
    assert.ok(row.disclaimerAcceptedAt);
    const renamed = await updateOwnProfile(ADMIN_ADDRESS, { displayName: "Greenhead" });
    assert.equal(renamed.disclaimerAccepted, true);
    assert.equal(renamed.displayName, "Greenhead");
  }));

function mockReq({ method = "GET", body } = {}) {
  const req = {
    method,
    headers: {},
    socket: {},
    on(event, fn) {
      if (event === "data" && body !== undefined) {
        queueMicrotask(() => fn(Buffer.from(typeof body === "string" ? body : JSON.stringify(body))));
      }
      if (event === "end") queueMicrotask(() => fn());
      return req;
    },
  };
  return req;
}

test("profile API persists disclaimerAccepted for the signed-in Xaman account", () =>
  withStore(async () => {
    await ensureProfile(ADMIN_ADDRESS);
    const res = mockRes();
    const handled = await handleProfiles(mockReq({ method: "POST", body: { disclaimerAccepted: true } }), res, "/api/profile", {
      readSession: () => ({ address: ADMIN_ADDRESS, method: "xaman" }),
    });
    assert.equal(handled, true);
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.equal(data.handle, "tadpole01");
    assert.equal(data.disclaimerAccepted, true);
    assert.equal(getProfileByHandle("tadpole01").disclaimerAccepted, true);
  }));

test("balance API stays behind an active Xaman session", () =>
  withStore(async () => {
    const loggedOut = mockRes();
    await handleProfiles({ method: "GET", headers: {}, socket: {} }, loggedOut, "/api/profile/balances", {
      readSession: () => null,
    });
    assert.equal(loggedOut.statusCode, 401);
    const wallet = mockRes();
    await handleProfiles({ method: "GET", headers: {}, socket: {} }, wallet, "/api/profile/balances", {
      readSession: () => ({ address: ADMIN_ADDRESS, method: "walletconnect" }),
    });
    assert.equal(wallet.statusCode, 403);
  }));

test("optional public card is handle and icon only", () =>
  withStore(async () => {
    await ensureProfile(ADMIN_ADDRESS);
    const hidden = await profileApi("/api/card/tadpole01");
    assert.equal(hidden.res.statusCode, 404);
    assert.equal(hidden.data.handle, undefined);
    assert.equal(hidden.data.address, undefined);
    assert.equal(hidden.data.displayName, undefined);
    await updateOwnProfile(ADMIN_ADDRESS, { publicCard: true, icon: "/greenhead-duck.png" });
    const open = await profileApi("/api/card/tadpole01");
    assert.equal(open.res.statusCode, 200);
    assert.equal(open.data.handle, "tadpole01");
    assert.equal(open.data.icon, "/greenhead-duck.png");
    assert.equal(open.data.address, undefined);
    assert.equal(open.data.displayName, undefined);
    assert.equal(Object.keys(open.data).sort().join(","), "handle,icon");
  }));

test("profile activity timestamps stay honest", () =>
  withStore(async () => {
    const row = await ensureProfile(ADMIN_ADDRESS);
    assert.equal(row.lastSignedInAt, 0);
    assert.equal(row.lastSavedAt, 0);
    const signed = await markLastSignIn(ADMIN_ADDRESS);
    assert.ok(signed.lastSignedInAt > 0);
    const saved = await updateOwnProfile(ADMIN_ADDRESS, { displayName: "Greenhead" });
    assert.ok(saved.lastSavedAt > 0);
    assert.equal(saved.displayName, "Greenhead");
    assert.equal(saved.publicCard, false);
  }));

test("profile icon is stored on the JSON profile and rejects secrets", () =>
  withStore(async () => {
    await ensureProfile(ADMIN_ADDRESS);
    const blank = await updateOwnProfile(ADMIN_ADDRESS, {});
    assert.equal(blank.icon, "");
    const saved = await updateOwnProfile(ADMIN_ADDRESS, { icon: "/greenhead-duck.png" });
    assert.equal(saved.icon, "/greenhead-duck.png");
    const remote = await updateOwnProfile(ADMIN_ADDRESS, {
      icon: "https://pond.greenhead.io/greenhead-duck.png",
    });
    assert.equal(remote.icon, "https://pond.greenhead.io/greenhead-duck.png");
    const tiny = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const uploaded = await updateOwnProfile(ADMIN_ADDRESS, { icon: tiny });
    assert.equal(uploaded.icon, tiny);
    const cleared = await updateOwnProfile(ADMIN_ADDRESS, { icon: "" });
    assert.equal(cleared.icon, "");
    const bad = await updateOwnProfile(ADMIN_ADDRESS, { icon: "javascript:alert(1)" });
    assert.equal(bad.error, "bad_profile");
    const seed = await updateOwnProfile(ADMIN_ADDRESS, {
      icon: "sEdVabcdeFGHIJKLmnopqrstuvwxy1",
    });
    assert.equal(seed.error, "bad_profile");
  }));
