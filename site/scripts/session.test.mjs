import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  ADMIN_ADDRESS,
  ensureProfile,
  updateOwnProfile,
} from "./profiles.mjs";
import {
  IDLE_MS,
  SESSION_COOKIE,
  activityFresh,
  handleSession,
  signSession,
} from "./session.mjs";

function withStore(run) {
  const dir = mkdtempSync(join(tmpdir(), "pond-session-"));
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

function mockReq({ method = "GET", cookie, body } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.headers = cookie ? { cookie: `${SESSION_COOKIE}=${encodeURIComponent(cookie)}` } : {};
  req.socket = {};
  queueMicrotask(() => {
    if (body !== undefined) req.emit("data", Buffer.from(typeof body === "string" ? body : JSON.stringify(body)));
    req.emit("end");
  });
  return req;
}

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

async function sessionApi(options) {
  const req = mockReq(options);
  const res = mockRes();
  const handled = await handleSession(req, res, "/api/session");
  return { handled, res, data: res.body ? JSON.parse(res.body) : {} };
}

test("idle timeout is 24 hours from last activity, not login", () => {
  const now = 1_700_000_000_000;
  assert.equal(IDLE_MS, 60 * 60 * 24 * 1000);
  assert.equal(
    activityFresh({ address: ADMIN_ADDRESS, t: now - IDLE_MS * 3, active: now - 60_000 }, now),
    true,
  );
  assert.equal(
    activityFresh({ address: ADMIN_ADDRESS, t: now - 60_000, active: now - IDLE_MS - 1 }, now),
    false,
  );
  assert.equal(activityFresh({ address: ADMIN_ADDRESS, t: now - IDLE_MS - 1 }, now), false);
});

test("GET /api/session clears an idle cookie and hides the account", async () => {
  const now = Date.now();
  const cookie = signSession({
    address: ADMIN_ADDRESS,
    method: "xaman",
    t: now - IDLE_MS - 5000,
    active: now - IDLE_MS - 5000,
  });
  const { data, res } = await sessionApi({ cookie });
  assert.equal(data.address, null);
  assert.equal(data.handle, null);
  assert.match(String(res.headers["Set-Cookie"] || ""), /Max-Age=0/);
});

test("GET /api/session refreshes a live Xaman session", () =>
  withStore(async () => {
    await ensureProfile(ADMIN_ADDRESS);
    const now = Date.now();
    const cookie = signSession({
      address: ADMIN_ADDRESS,
      method: "xaman",
      t: now - 60_000,
      active: now - 60_000,
    });
    const { data, res } = await sessionApi({ cookie });
    assert.equal(data.address, ADMIN_ADDRESS);
    assert.equal(data.handle, "tadpole01");
    assert.equal(data.disclaimerAccepted, false);
    assert.equal(data.icon, "");
    assert.match(String(res.headers["Set-Cookie"] || ""), /pond_session=/);
    assert.doesNotMatch(String(res.headers["Set-Cookie"] || ""), /Max-Age=0/);
  }));

test("Xaman session reports persisted disclaimer acceptance", () =>
  withStore(async () => {
    await ensureProfile(ADMIN_ADDRESS);
    const now = Date.now();
    const cookie = signSession({
      address: ADMIN_ADDRESS,
      method: "xaman",
      t: now,
      active: now,
    });
    const first = await sessionApi({ cookie });
    assert.equal(first.data.disclaimerAccepted, false);
    await updateOwnProfile(ADMIN_ADDRESS, { disclaimerAccepted: true });
    const second = await sessionApi({ cookie });
    assert.equal(second.data.disclaimerAccepted, true);
    assert.equal(second.data.handle, "tadpole01");
    await updateOwnProfile(ADMIN_ADDRESS, { icon: "/greenhead-duck.png" });
    const third = await sessionApi({ cookie });
    assert.equal(third.data.icon, "/greenhead-duck.png");
  }));

test("WalletConnect session does not return a handle", async () => {
  const { data } = await sessionApi({
    method: "POST",
    body: { method: "walletconnect", address: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpADk" },
  });
  assert.equal(data.method, "walletconnect");
  assert.equal(data.address, "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpADk");
  assert.equal(data.handle, null);
  assert.equal(data.admin, false);
  assert.equal(data.signedInWith, "WalletConnect");
  assert.equal(data.displayName, "");
  assert.ok(data.expiresAt > Date.now());
});

test("Xaman session includes display name and idle expiry", () =>
  withStore(async () => {
    await ensureProfile(ADMIN_ADDRESS);
    await updateOwnProfile(ADMIN_ADDRESS, { displayName: "Greenhead" });
    const now = Date.now();
    const cookie = signSession({
      address: ADMIN_ADDRESS,
      method: "xaman",
      t: now,
      active: now,
    });
    const { data } = await sessionApi({ cookie });
    assert.equal(data.handle, "tadpole01");
    assert.equal(data.displayName, "Greenhead");
    assert.equal(data.signedInWith, "Xaman");
    assert.equal(data.idleMs, IDLE_MS);
    assert.ok(data.expiresAt > now);
  }));
