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
  DEFAULT_AMM_PND,
  TF_AMM_SINGLE_ASSET,
  TF_AMM_TWO_ASSET,
  XUMM_INSTRUCTION_MAX,
  allowedOrigin,
  handleApi,
  readBoundPayload,
} from "./xaman.mjs";

process.env.POND_SESSION_SECRET ??= "pond-test-session-secret";
process.env.XUMM_API_KEY ??= "test-xumm-key";
process.env.XUMM_API_SECRET ??= "test-xumm-secret";

const SIGNIN_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TRUST_UUID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const AMM_UUID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const DEPOSIT_UUID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const TREASURY = "rPNDcL2UrGtSoGwruWx6ocMQ6ey8uPZm2b";

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

function installXummMock({
  signed = true,
  account = ADMIN_ADDRESS,
  txType = "SignIn",
  createStatus = 200,
  createError = null,
} = {}) {
  const previous = globalThis.fetch;
  const created = [];
  globalThis.fetch = async (url, opts = {}) => {
    const path = String(url);
    if (path.endsWith("/payload") && opts.method === "POST") {
      const body = JSON.parse(opts.body);
      created.push(body);
      if (createStatus >= 400) {
        return {
          ok: false,
          status: createStatus,
          json: async () => createError || { error: { code: 600, reference: "test-ref" } },
        };
      }
      const uuid =
        body.txjson.TransactionType === "TrustSet"
          ? TRUST_UUID
          : body.txjson.TransactionType === "AMMCreate"
            ? AMM_UUID
            : body.txjson.TransactionType === "AMMDeposit"
              ? DEPOSIT_UUID
              : SIGNIN_UUID;
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
      assert.equal(created.data.submit, false);
      assert.equal(created.data.network, "testnet");
      const signInBody = xumm.created.find((item) => item.txjson.TransactionType === "SignIn");
      assert.equal(signInBody.options.submit, false);
      assert.equal(signInBody.options.force_network, "TESTNET");
      assert.notEqual(signInBody.options.force_network, "MAINNET");
      assert.ok(String(signInBody.custom_meta.instruction).includes("XRPL Testnet"));
      assert.ok(signInBody.custom_meta.instruction.length <= XUMM_INSTRUCTION_MAX);
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

      const guestAmm = await xamanApi("/api/xaman/ammcreate", { method: "POST", body: { returnTo: "/trade/" } });
      assert.equal(guestAmm.res.statusCode, 401);

      const wcSession = signSession({
        address: ADMIN_ADDRESS,
        method: "walletconnect",
        t: now,
        active: now,
      });
      const wcAmm = await xamanApi("/api/xaman/ammcreate", {
        method: "POST",
        body: { returnTo: "/trade/" },
        cookie: wcSession,
      });
      assert.equal(wcAmm.res.statusCode, 401);

      const mainnetAmm = await xamanApi("/api/xaman/ammcreate", {
        method: "POST",
        body: { network: "mainnet", pnd: DEFAULT_AMM_PND, xrp: "5000" },
        cookie: sessionCookie,
      });
      assert.equal(mainnetAmm.res.statusCode, 400);
      assert.equal(mainnetAmm.data.error, "testnet_only");

      const treasurySession = signSession({
        address: TREASURY,
        method: "xaman",
        t: now,
        active: now,
      });
      const amm = await xamanApi("/api/xaman/ammcreate", {
        method: "POST",
        body: { pnd: "500000000000", xrp: "5000", tradingFee: 500, returnTo: "/trade/" },
        cookie: treasurySession,
      });
      assert.equal(amm.res.statusCode, 200);
      assert.equal(amm.data.submit, true);
      assert.equal(amm.data.network, "testnet");
      assert.equal(amm.data.uuid, AMM_UUID);
      const ammCookies = cookieMap(amm.res.headers["Set-Cookie"]);
      const ammBound = readBoundPayload({
        headers: { cookie: `${PAYLOAD_COOKIE}=${encodeURIComponent(ammCookies[PAYLOAD_COOKIE])}` },
      });
      assert.equal(ammBound.uuid, AMM_UUID);
      assert.equal(ammBound.kind, "ammcreate");
      const ammBody = xumm.created.find((item) => item.txjson.TransactionType === "AMMCreate");
      assert.equal(ammBody.options.submit, true);
      assert.equal(ammBody.options.force_network, "TESTNET");
      assert.notEqual(ammBody.options.force_network, "MAINNET");
      assert.equal(ammBody.txjson.Account, TREASURY);
      assert.equal(ammBody.txjson.Amount.currency, "PND");
      assert.equal(ammBody.txjson.Amount.value, "500000000000");
      assert.equal(ammBody.txjson.Amount2, "5000000000");
      assert.equal(ammBody.txjson.TradingFee, 500);
      assert.equal(ammBody.txjson.TransactionType, "AMMCreate");
      assert.ok(ammBody.custom_meta.instruction.length <= XUMM_INSTRUCTION_MAX);
      assert.ok(!/[^\x09\x0a\x0d\x20-\x7e]/.test(ammBody.custom_meta.instruction));
      assert.ok(!JSON.stringify(ammBody).includes("AMMDeposit"));
      assert.ok(!JSON.stringify(ammBody).includes("mnemonic"));
      assert.ok(!JSON.stringify(ammBody).includes("family seed"));

      const edited = await xamanApi("/api/xaman/ammcreate", {
        method: "POST",
        body: { pnd: "100000000000", xrp: "200", tradingFee: 250 },
        cookie: sessionCookie,
      });
      assert.equal(edited.res.statusCode, 200);
      const editedBody = xumm.created.filter((item) => item.txjson.TransactionType === "AMMCreate").at(-1);
      assert.equal(editedBody.txjson.Account, ADMIN_ADDRESS);
      assert.equal(editedBody.txjson.Amount.value, "100000000000");
      assert.equal(editedBody.txjson.Amount2, "200000000");
      assert.equal(editedBody.txjson.TradingFee, 250);
      assert.equal(editedBody.options.force_network, "TESTNET");

      const guestDeposit = await xamanApi("/api/xaman/ammdeposit", { method: "POST", body: { returnTo: "/trade/" } });
      assert.equal(guestDeposit.res.statusCode, 401);

      const wcDeposit = await xamanApi("/api/xaman/ammdeposit", {
        method: "POST",
        body: { side: "two", pnd: "10", xrp: "10" },
        cookie: wcSession,
      });
      assert.equal(wcDeposit.res.statusCode, 401);

      const mainnetDeposit = await xamanApi("/api/xaman/ammdeposit", {
        method: "POST",
        body: { network: "mainnet", side: "two", pnd: "10", xrp: "10" },
        cookie: treasurySession,
      });
      assert.equal(mainnetDeposit.res.statusCode, 400);
      assert.equal(mainnetDeposit.data.error, "testnet_only");

      const two = await xamanApi("/api/xaman/ammdeposit", {
        method: "POST",
        body: { side: "two", pnd: "25", xrp: "10", returnTo: "/trade/" },
        cookie: treasurySession,
      });
      assert.equal(two.res.statusCode, 200);
      assert.equal(two.data.kind, "AMMDeposit");
      assert.equal(two.data.submit, true);
      assert.equal(two.data.uuid, DEPOSIT_UUID);
      const twoBound = readBoundPayload({
        headers: { cookie: `${PAYLOAD_COOKIE}=${encodeURIComponent(cookieMap(two.res.headers["Set-Cookie"])[PAYLOAD_COOKIE])}` },
      });
      assert.equal(twoBound.kind, "ammdeposit");
      const twoBody = xumm.created.filter((item) => item.txjson.TransactionType === "AMMDeposit").at(-1);
      assert.equal(twoBody.options.submit, true);
      assert.equal(twoBody.options.force_network, "TESTNET");
      assert.equal(twoBody.txjson.Flags, TF_AMM_TWO_ASSET);
      assert.equal(twoBody.txjson.Asset.currency, "XRP");
      assert.equal(twoBody.txjson.Asset2.currency, "PND");
      assert.equal(twoBody.txjson.Amount.value, "25");
      assert.equal(twoBody.txjson.Amount2, "10000000");
      assert.equal(twoBody.txjson.TradingFee, undefined);
      assert.ok(!Object.hasOwn(twoBody.txjson, "TradingFee"));
      assert.ok(twoBody.custom_meta.instruction.length <= XUMM_INSTRUCTION_MAX);

      const singleXrp = await xamanApi("/api/xaman/ammdeposit", {
        method: "POST",
        body: { side: "single", asset: "XRP", xrp: "3" },
        cookie: treasurySession,
      });
      assert.equal(singleXrp.res.statusCode, 200);
      const singleXrpBody = xumm.created.filter((item) => item.txjson.TransactionType === "AMMDeposit").at(-1);
      assert.equal(singleXrpBody.txjson.Flags, TF_AMM_SINGLE_ASSET);
      assert.equal(singleXrpBody.txjson.Amount, "3000000");
      assert.equal(singleXrpBody.txjson.Amount2, undefined);

      const singlePnd = await xamanApi("/api/xaman/ammdeposit", {
        method: "POST",
        body: { side: "single", asset: "PND", pnd: "7" },
        cookie: treasurySession,
      });
      assert.equal(singlePnd.res.statusCode, 200);
      const singlePndBody = xumm.created.filter((item) => item.txjson.TransactionType === "AMMDeposit").at(-1);
      assert.equal(singlePndBody.txjson.Flags, TF_AMM_SINGLE_ASSET);
      assert.equal(singlePndBody.txjson.Amount.currency, "PND");
      assert.equal(singlePndBody.txjson.Amount.value, "7");

      const zeroTwo = await xamanApi("/api/xaman/ammdeposit", {
        method: "POST",
        body: { side: "two", pnd: "0", xrp: "0" },
        cookie: treasurySession,
      });
      assert.equal(zeroTwo.res.statusCode, 400);
    } finally {
      xumm.restore();
    }
  }));

test("SignIn force_network is TESTNET even if the client asks for Mainnet", () =>
  withStore(async () => {
    const xumm = installXummMock();
    try {
      const tradeDefault = await xamanApi("/api/xaman/signin", {
        method: "POST",
        body: { returnTo: "/trade/" },
      });
      assert.equal(tradeDefault.res.statusCode, 200);
      assert.equal(tradeDefault.data.network, "testnet");
      assert.equal(xumm.created.at(-1).options.force_network, "TESTNET");
      assert.equal(xumm.created.at(-1).options.submit, false);

      const tradeExplicit = await xamanApi("/api/xaman/signin", {
        method: "POST",
        body: { returnTo: "/trade/", network: "testnet" },
      });
      assert.equal(tradeExplicit.res.statusCode, 200);
      assert.equal(tradeExplicit.data.network, "testnet");
      assert.equal(xumm.created.at(-1).options.force_network, "TESTNET");

      const unpublished = await xamanApi("/api/xaman/signin", {
        method: "POST",
        body: { returnTo: "/connect/" },
      });
      assert.equal(unpublished.res.statusCode, 200);
      assert.equal(unpublished.data.network, "testnet");
      assert.equal(xumm.created.at(-1).options.force_network, "TESTNET");
      assert.equal(xumm.created.at(-1).options.submit, false);
      assert.match(xumm.created.at(-1).options.return_url.web, /\/trade\/\?payload=/);
      assert.doesNotMatch(xumm.created.at(-1).options.return_url.web, /\/connect\//);

      const ignoredMainnet = await xamanApi("/api/xaman/signin", {
        method: "POST",
        body: { returnTo: "/trade/", network: "mainnet" },
      });
      assert.equal(ignoredMainnet.res.statusCode, 200);
      assert.equal(ignoredMainnet.data.network, "testnet");
      assert.equal(xumm.created.at(-1).options.force_network, "TESTNET");
      assert.notEqual(xumm.created.at(-1).options.force_network, "MAINNET");
    } finally {
      xumm.restore();
    }
  }));

test("AMMCreate instruction stays within Xaman's 280-character limit and Xaman errors are not hidden", () =>
  withStore(async () => {
    const now = Date.now();
    const sessionCookie = signSession({
      address: TREASURY,
      method: "xaman",
      t: now,
      active: now,
    });
    const okMock = installXummMock();
    try {
      const amm = await xamanApi("/api/xaman/ammcreate", {
        method: "POST",
        body: { pnd: DEFAULT_AMM_PND, xrp: "5000", tradingFee: 500, returnTo: "/trade/" },
        cookie: sessionCookie,
      });
      assert.equal(amm.res.statusCode, 200);
      const instruction = okMock.created.at(-1).custom_meta.instruction;
      assert.ok(instruction.length <= 280);
      assert.equal(instruction.length <= XUMM_INSTRUCTION_MAX, true);
      assert.ok(!instruction.includes("tecUNFUNDED"));
    } finally {
      okMock.restore();
    }

    const failMock = installXummMock({
      createStatus: 400,
      createError: { error: { code: 600, reference: "amm-instr", message: "instruction too long" } },
    });
    try {
      const failed = await xamanApi("/api/xaman/ammcreate", {
        method: "POST",
        body: { pnd: DEFAULT_AMM_PND, xrp: "5000", tradingFee: 500 },
        cookie: sessionCookie,
      });
      assert.equal(failed.res.statusCode, 400);
      assert.equal(failed.data.error, "xaman_create_failed");
      assert.equal(failed.data.xamanCode, 600);
      assert.match(failed.data.message, /instruction too long|Xaman error 600/);
      assert.ok(!String(failed.data.message).includes("Check the app keys"));
    } finally {
      failMock.restore();
    }
  }));
