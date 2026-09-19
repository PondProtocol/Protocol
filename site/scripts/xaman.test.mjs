import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ADMIN_ADDRESS } from "./profiles.mjs";
import { SESSION_COOKIE, handleSession, readSession, signSession } from "./session.mjs";
import {
  PAYLOAD_COOKIE,
  SIGNIN_EXPIRE_MIN,
  allowedOrigin,
  handleApi,
  readBoundPayload,
} from "./xaman.mjs";

process.env.POND_SESSION_SECRET ??= "pond-test-session-secret";
process.env.XUMM_API_KEY ??= "test-xumm-key";
process.env.XUMM_API_SECRET ??= "test-xumm-secret";

const SIGNIN_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TRUST_UUID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function withStore(run) {
  const dir = mkdtempSync(join(tmpdir(), "pond-xaman-"));
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

function mockReq({ method = "GET", cookie, cookies, body, origin, headers } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.headers = { ...(headers || {}) };
  if (origin) req.headers.origin = origin;
  const parts = [];
  if (cookie) parts.push(`${SESSION_COOKIE}=${encodeURIComponent(cookie)}`);
  if (cookies) {
    for (const [key, value] of Object.entries(cookies)) {
      parts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  if (parts.length) req.headers.cookie = parts.join("; ");
  req.socket = {};
  queueMicrotask(() => {
    if (body !== undefined) req.emit("data", Buffer.from(typeof body === "string" ? body : JSON.stringify(body)));
    req.emit("end");
  });
  return req;
}

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(key, value) {
      this.headers[key] = value;
    },
    getHeader(key) {
      return this.headers[key];
    },
    end(payload) {
      this.body = payload || "";
    },
  };
}

function cookieMap(header) {
  const list = header ? (Array.isArray(header) ? header : [header]) : [];
  const out = {};
  for (const line of list) {
    const pair = String(line).split(";")[0];
    const at = pair.indexOf("=");
    if (at < 0) continue;
    out[pair.slice(0, at).trim()] = decodeURIComponent(pair.slice(at + 1).trim());
  }
  return out;
}

async function xamanApi(url, options) {
  const req = mockReq(options);
  const res = mockRes();
  const handled = await handleApi(req, res, url, { readSession });
  return { handled, res, data: res.body ? JSON.parse(res.body) : {} };
}

function installXummMock({ signed = true, account = ADMIN_ADDRESS, txType = "SignIn" } = {}) {
  const previous = globalThis.fetch;
  const created = [];
  globalThis.fetch = async (url, opts = {}) => {
    const path = String(url);
    if (path.endsWith("/payload") && opts.method === "POST") {
      const body = JSON.parse(opts.body);
      created.push(body);
      const uuid = body.txjson.TransactionType === "TrustSet" ? TRUST_UUID : SIGNIN_UUID;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          uuid,
          next: { always: `https://xumm.app/sign/${uuid}` },
          refs: { qr_png: "https://xumm.app/qr.png" },
        }),
      };
    }
    if (path.includes("/payload/")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          meta: { uuid: path.split("/").pop(), signed, cancelled: false, expired: false, resolved: true },
          payload: { tx_type: txType },
          response: { account },
        }),
      };
    }
    throw new Error(`unexpected fetch ${path}`);
  };
  return {
    created,
    restore() {
      globalThis.fetch = previous;
    },
  };
}

test("allowedOrigin echoes pond.greenhead.io and local preview only", () => {
  assert.equal(allowedOrigin({ headers: { origin: "https://pond.greenhead.io" } }), "https://pond.greenhead.io");
  assert.equal(allowedOrigin({ headers: { origin: "http://127.0.0.1:8105" } }), "http://127.0.0.1:8105");
  assert.equal(allowedOrigin({ headers: { origin: "https://evil.example" } }), "");
});

test("Xaman APIs do not send Access-Control-Allow-Origin *", async () => {
  const { res } = await xamanApi("/health", { origin: "https://evil.example" });
  assert.equal(res.headers["Access-Control-Allow-Origin"], undefined);
});

test("Xaman APIs echo the live origin", async () => {
  const { res } = await xamanApi("/health", { origin: "https://pond.greenhead.io" });
  assert.equal(res.headers["Access-Control-Allow-Origin"], "https://pond.greenhead.io");
});

test("SignIn payload is bound to an httpOnly cookie and TrustSet stays unsigned", () =>
  withStore(async () => {
    const xumm = installXummMock();
    try {
      const created = await xamanApi("/api/xaman/signin", { method: "POST", body: { returnTo: "/trade/" } });
      assert.equal(created.res.statusCode, 200);
      assert.equal(created.data.uuid, SIGNIN_UUID);
      assert.equal(created.data.expireMin, SIGNIN_EXPIRE_MIN);
      const cookies = cookieMap(created.res.headers["Set-Cookie"]);
      assert.ok(cookies[PAYLOAD_COOKIE]);
      assert.match(String(created.res.headers["Set-Cookie"]), /HttpOnly/);
      const bound = readBoundPayload({
        headers: { cookie: `${PAYLOAD_COOKIE}=${encodeURIComponent(cookies[PAYLOAD_COOKIE])}` },
      });
      assert.equal(bound.uuid, SIGNIN_UUID);
      assert.equal(bound.kind, "signin");

      const leakRes = mockRes();
      await handleSession(
        mockReq({ method: "POST", body: { method: "xaman", uuid: SIGNIN_UUID } }),
        leakRes,
        "/api/session",
      );
      assert.equal(leakRes.statusCode, 400);
      assert.equal(JSON.parse(leakRes.body).error, "payload_unbound");

      const okRes = mockRes();
      await handleSession(
        mockReq({
          method: "POST",
          body: { method: "xaman", uuid: SIGNIN_UUID },
          cookies: { [PAYLOAD_COOKIE]: cookies[PAYLOAD_COOKIE] },
        }),
        okRes,
        "/api/session",
      );
      assert.equal(okRes.statusCode, 200);
      assert.equal(JSON.parse(okRes.body).address, ADMIN_ADDRESS);
      assert.equal(JSON.parse(okRes.body).method, "xaman");
      assert.equal(JSON.parse(okRes.body).handle, "tadpole01");

      const guestTrust = await xamanApi("/api/xaman/trustset", { method: "POST", body: { returnTo: "/trade/" } });
      assert.equal(guestTrust.res.statusCode, 401);

      const now = Date.now();
      const sessionCookie = signSession({
        address: ADMIN_ADDRESS,
        method: "xaman",
        t: now,
        active: now,
      });
      const trust = await xamanApi("/api/xaman/trustset", {
        method: "POST",
        body: { returnTo: "/trade/" },
        cookie: sessionCookie,
      });
      assert.equal(trust.res.statusCode, 200);
      assert.equal(trust.data.submit, false);
      const trustBody = xumm.created.find((item) => item.txjson.TransactionType === "TrustSet");
      assert.equal(trustBody.options.submit, false);
      assert.equal(trustBody.txjson.Account, ADMIN_ADDRESS);

      const open = await xamanApi(`/api/xaman/payload/${SIGNIN_UUID}`);
      assert.equal(open.res.statusCode, 403);
    } finally {
      xumm.restore();
    }
  }));
