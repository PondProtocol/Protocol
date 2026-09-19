/**
 * Official Xaman (Xumm) Platform API, server-side only.
 *
 * Creates SignIn, optional TrustSet, and Testnet-only AMMCreate payloads.
 * The API secret never leaves this process. If XUMM_API_KEY / XUMM_API_SECRET
 * are unset, callers get an honest "connect unavailable" payload instead of a
 * fake success.
 *
 * SignIn and TrustSet stay unsigned / submit:false. AMMCreate stays unsigned
 * on this server (submit:true so Xaman broadcasts after the treasury signs).
 * This process never signs. Payload UUIDs are bound to an httpOnly cookie so a
 * leaked id cannot mint pond_session.
 *
 * Docs: https://xumm.readme.io/reference/post-payload
 *       https://docs.xaman.dev/concepts/special-transaction-types/signin
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { loadConfig } from "./lib.mjs";

const XUMM_API = "https://xumm.app/api/v1/platform";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADDR_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const MAX_BODY = 16 * 1024;
export const PAYLOAD_COOKIE = "pond_xaman_payload";
export const SIGNIN_EXPIRE_MIN = 10;
export const TRUSTSET_EXPIRE_MIN = 15;
export const AMMCREATE_EXPIRE_MIN = 15;
export const DEFAULT_AMM_PND = "500000000000";
export const DEFAULT_AMM_XRP = "5000";
export const DEFAULT_AMM_FEE = 500;
export const XUMM_INSTRUCTION_MAX = 280;

const config = loadConfig();
const issuer = config.site.issuerAddress;
const treasury = config.site.treasuryAddress;
const domain = config.site.domain;
const ALLOWED_RETURN = new Set(["/connect/", "/trade/"]);

function payloadReturnUrl(returnTo) {
  const path = ALLOWED_RETURN.has(returnTo) ? returnTo : "/connect/";
  return `https://${domain}${path}?payload={id}`;
}

export function xamanConfigured() {
  return Boolean(process.env.XUMM_API_KEY?.trim() && process.env.XUMM_API_SECRET?.trim());
}

export function pndIssued() {
  return config.site.launchStatus === "live";
}

export function healthBody() {
  const configured = xamanConfigured();
  return {
    ok: true,
    service: "pond-site",
    launchStatus: config.site.launchStatus,
    issuer,
    xaman: {
      configured,
      connect: configured ? "ready" : "unavailable",
      ...(configured
        ? {}
        : {
            reason:
              "Connect unavailable until Xaman app keys are set. Set XUMM_API_KEY and XUMM_API_SECRET on the Autoscale host.",
          }),
    },
  };
}

function cookieSecret() {
  return process.env.POND_SESSION_SECRET?.trim() || "";
}

export function allowedOrigin(req) {
  const origin = String(req?.headers?.origin || "").trim();
  if (!origin) return "";
  if (origin === "https://pond.greenhead.io") return origin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin)) return origin;
  return "";
}

function corsHeaders(req) {
  const origin = allowedOrigin(req);
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

function json(res, status, body, req, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const headers = { ...corsHeaders(req), ...extraHeaders };
  for (const [key, value] of Object.entries(headers)) {
    if (key === "Set-Cookie") {
      appendCookie(res, value);
      continue;
    }
    res.setHeader(key, value);
  }
  res.end(payload);
}

function appendCookie(res, value) {
  const incoming = Array.isArray(value) ? value : [value];
  const existing = res.getHeader("Set-Cookie");
  const prior = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
  const next = [...prior, ...incoming].filter(Boolean);
  res.setHeader("Set-Cookie", next.length === 1 ? next[0] : next);
}

function isSecure(req) {
  const proto = String(req?.headers?.["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return proto === "https" || Boolean(req?.socket?.encrypted);
}

function parseCookies(req) {
  const header = req?.headers?.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const at = part.indexOf("=");
    if (at < 0) continue;
    const key = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function signPayloadCookie(payload) {
  const secret = cookieSecret();
  if (!secret) return "";
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readBoundPayload(req) {
  const secret = cookieSecret();
  if (!secret) return null;
  const token = parseCookies(req)[PAYLOAD_COOKIE];
  const [body, mac] = String(token || "").split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(mac, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!UUID_RE.test(payload.uuid || "")) return null;
    if (payload.kind !== "signin" && payload.kind !== "trustset" && payload.kind !== "ammcreate") {
      return null;
    }
    if (!Number.isFinite(payload.exp) || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function payloadCookieHeader(req, { uuid, kind, expireMin }) {
  const maxAge = Math.max(60, Math.round(expireMin * 60));
  const token = signPayloadCookie({
    uuid,
    kind,
    exp: Date.now() + maxAge * 1000,
  });
  const parts = [
    `${PAYLOAD_COOKIE}=${token ? encodeURIComponent(token) : ""}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${token ? maxAge : 0}`,
  ];
  if (isSecure(req)) parts.push("Secure");
  return parts.join("; ");
}

function unavailable(res, req) {
  json(res, 503, {
    error: "xaman_unconfigured",
    message: healthBody().xaman.reason,
    xaman: healthBody().xaman,
  }, req);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

function payloadInstruction(text) {
  const clean = String(text || "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "-")
    .trim();
  return clean.slice(0, XUMM_INSTRUCTION_MAX);
}

function xummCreateFailure(kind, status, data) {
  const code = data?.error?.code;
  const reference = data?.error?.reference;
  const detail = typeof data?.error?.message === "string" ? data.error.message : "";
  const parts = [`Xaman did not create a ${kind} payload.`];
  if (detail) parts.push(detail.slice(0, 180));
  if (Number.isFinite(code)) parts.push(`Xaman error ${code}.`);
  console.error("xaman payload create failed", { kind, status, code, reference });
  return {
    error: "xaman_create_failed",
    message: parts.join(" "),
    xamanCode: Number.isFinite(code) ? code : null,
    xamanReference: typeof reference === "string" ? reference : null,
  };
}

async function xumm(path, { method = "GET", body } = {}) {
  const response = await fetch(`${XUMM_API}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": process.env.XUMM_API_KEY,
      "X-API-Secret": process.env.XUMM_API_SECRET,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function publicCreate(data, expireMin) {
  return {
    uuid: data.uuid,
    next: data.next?.always ?? null,
    qr: data.refs?.qr_png ?? null,
    websocket: data.refs?.websocket_status ?? null,
    pushed: Boolean(data.pushed),
    expiresAt: Date.now() + expireMin * 60 * 1000,
    expireMin,
  };
}

function publicPayload(data) {
  return {
    uuid: data.meta?.uuid ?? null,
    txType: data.payload?.tx_type ?? null,
    signed: Boolean(data.meta?.signed),
    cancelled: Boolean(data.meta?.cancelled),
    expired: Boolean(data.meta?.expired),
    resolved: Boolean(data.meta?.resolved),
    account: data.meta?.signed ? data.response?.account ?? null : null,
    submitted: Boolean(data.response?.dispatched_result),
    dispatchedResult: data.meta?.signed ? data.response?.dispatched_result ?? null : null,
  };
}

async function createSignIn(req, res, body = {}) {
  if (!xamanConfigured()) return unavailable(res, req);
  if (!cookieSecret()) {
    json(res, 503, {
      error: "session_unconfigured",
      message: "Sign in is unavailable until Autoscale has POND_SESSION_SECRET.",
    }, req);
    return;
  }
  const back = payloadReturnUrl(body.returnTo);
  const { ok, status, data } = await xumm("/payload", {
    method: "POST",
    body: {
      txjson: { TransactionType: "SignIn" },
      options: {
        submit: false,
        expire: SIGNIN_EXPIRE_MIN,
        force_network: "TESTNET",
        return_url: { app: back, web: back },
      },
      custom_meta: {
        instruction: payloadInstruction(
          "Sign in to pond.greenhead.io on XRPL Testnet. This is not a payment and is never submitted to the ledger. Pond never asks for your seed.",
        ),
      },
    },
  });
  if (!ok || !data?.uuid) {
    json(res, status >= 400 ? status : 502, xummCreateFailure("SignIn", status, data), req);
    return;
  }
  json(res, 200, { ...publicCreate(data, SIGNIN_EXPIRE_MIN), submit: false, network: "testnet" }, req, {
    "Set-Cookie": payloadCookieHeader(req, {
      uuid: data.uuid,
      kind: "signin",
      expireMin: SIGNIN_EXPIRE_MIN,
    }),
  });
}

async function createTrustSet(req, res, body = {}, session = null) {
  if (!xamanConfigured()) return unavailable(res, req);
  if (!cookieSecret()) {
    json(res, 503, {
      error: "session_unconfigured",
      message: "Sign in is unavailable until Autoscale has POND_SESSION_SECRET.",
    }, req);
    return;
  }
  if (session?.method !== "xaman" || !ADDR_RE.test(session.address || "")) {
    json(res, 401, {
      error: "xaman_required",
      message: "Open a $PND trust line after official Xaman SignIn.",
    }, req);
    return;
  }
  const back = payloadReturnUrl(body.returnTo);
  const { ok, status, data } = await xumm("/payload", {
    method: "POST",
    body: {
      txjson: {
        TransactionType: "TrustSet",
        Account: session.address,
        LimitAmount: {
          currency: "PND",
          issuer,
          value: "100000000000",
        },
      },
      options: {
        submit: false,
        expire: TRUSTSET_EXPIRE_MIN,
        force_network: "MAINNET",
        return_url: { app: back, web: back },
      },
      custom_meta: {
        instruction: payloadInstruction(
          "$PND has not been issued. This only opens a trust line to the Pond issuer. It does not give you tokens. This request is not submitted to the ledger.",
        ),
      },
    },
  });
  if (!ok || !data?.uuid) {
    json(res, status >= 400 ? status : 502, xummCreateFailure("TrustSet", status, data), req);
    return;
  }
  json(res, 200, { ...publicCreate(data, TRUSTSET_EXPIRE_MIN), kind: "TrustSet", issuer, currency: "PND", submit: false }, req, {
    "Set-Cookie": payloadCookieHeader(req, {
      uuid: data.uuid,
      kind: "trustset",
      expireMin: TRUSTSET_EXPIRE_MIN,
    }),
  });
}

function parseIouValue(value, fallback) {
  const text = String(value ?? fallback).trim();
  if (!/^(?:0|[1-9]\d{0,15})(?:\.\d{1,15})?$/.test(text)) return null;
  if (Number(text) <= 0) return null;
  return text;
}

function parseXrpDrops(value, fallback) {
  const text = String(value ?? fallback).trim();
  if (!/^(?:0|[1-9]\d{0,15})(?:\.\d{1,6})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const drops = BigInt(whole) * 1000000n + BigInt((fraction + "000000").slice(0, 6));
  if (drops <= 0n || drops > 100000000000000000n) return null;
  return drops.toString();
}

function parseTradingFee(value) {
  if (value === undefined || value === null || value === "") return DEFAULT_AMM_FEE;
  const fee = Number(value);
  if (!Number.isInteger(fee) || fee < 0 || fee > 1000) return null;
  return fee;
}

async function createAmmCreate(req, res, body = {}, session = null) {
  if (!xamanConfigured()) return unavailable(res, req);
  if (!cookieSecret()) {
    json(res, 503, {
      error: "session_unconfigured",
      message: "Sign in is unavailable until Autoscale has POND_SESSION_SECRET.",
    }, req);
    return;
  }
  if (session?.method !== "xaman" || !ADDR_RE.test(session.address || "")) {
    json(res, 401, {
      error: "xaman_required",
      message: "Send Testnet AMMCreate after official Xaman SignIn.",
    }, req);
    return;
  }
  if (String(body.network || "testnet").toLowerCase() === "mainnet" || String(body.network || "").toLowerCase() === "production") {
    json(res, 400, {
      error: "testnet_only",
      message: "AMMCreate is Testnet only. Mainnet has no $PND issued.",
    }, req);
    return;
  }
  const pndValue = parseIouValue(body.pnd, DEFAULT_AMM_PND);
  const xrpDrops = parseXrpDrops(body.xrp, DEFAULT_AMM_XRP);
  const tradingFee = parseTradingFee(body.tradingFee);
  if (!pndValue || !xrpDrops || tradingFee == null) {
    json(res, 400, {
      error: "bad_amount",
      message: "PND, XRP, and TradingFee must be positive ledger amounts. TradingFee is 0–1000.",
    }, req);
    return;
  }
  const account = session.address;
  const back = payloadReturnUrl("/trade/");
  const { ok, status, data } = await xumm("/payload", {
    method: "POST",
    body: {
      txjson: {
        TransactionType: "AMMCreate",
        Account: account,
        Amount: {
          currency: "PND",
          issuer,
          value: pndValue,
        },
        Amount2: xrpDrops,
        TradingFee: tradingFee,
      },
      options: {
        submit: true,
        expire: AMMCREATE_EXPIRE_MIN,
        force_network: "TESTNET",
        return_url: { app: back, web: back },
      },
      custom_meta: {
        instruction: payloadInstruction(
          `Testnet AMMCreate ${pndValue} PND + ${xrpDrops} drops XRP, fee ${tradingFee}. Xaman submits after you sign. Pond never asks for a seed.`,
        ),
      },
    },
  });
  if (!ok || !data?.uuid) {
    json(res, status >= 400 ? status : 502, xummCreateFailure("AMMCreate", status, data), req);
    return;
  }
  json(
    res,
    200,
    {
      ...publicCreate(data, AMMCREATE_EXPIRE_MIN),
      kind: "AMMCreate",
      account,
      treasury,
      issuer,
      currency: "PND",
      pnd: pndValue,
      xrpDrops,
      tradingFee,
      submit: true,
      network: "testnet",
    },
    req,
    {
      "Set-Cookie": payloadCookieHeader(req, {
        uuid: data.uuid,
        kind: "ammcreate",
        expireMin: AMMCREATE_EXPIRE_MIN,
      }),
    },
  );
}

export async function signedXamanAccount(uuid, req) {
  if (!xamanConfigured()) {
    return { error: "xaman_unconfigured", message: healthBody().xaman.reason };
  }
  if (!UUID_RE.test(String(uuid || ""))) {
    return { error: "invalid_uuid", message: "That is not a Xaman payload id." };
  }
  const bound = readBoundPayload(req);
  if (!bound || bound.kind !== "signin" || bound.uuid !== uuid) {
    return { error: "payload_unbound", message: "That sign request is not from this browser." };
  }
  const { ok, data } = await xumm(`/payload/${uuid}`);
  if (!ok) {
    return { error: "xaman_lookup_failed", message: "Xaman did not return that payload." };
  }
  const payload = publicPayload(data);
  if (payload.txType && payload.txType !== "SignIn") {
    return { error: "not_signin", message: "That Xaman request is not a completed SignIn." };
  }
  if (!payload.signed || !payload.account) {
    return { error: "not_signed", message: "That Xaman request is not a completed SignIn." };
  }
  return { account: payload.account };
}

async function getPayload(req, res, uuid) {
  if (!xamanConfigured()) return unavailable(res, req);
  if (!UUID_RE.test(uuid)) {
    json(res, 400, { error: "invalid_uuid", message: "That is not a Xaman payload id." }, req);
    return;
  }
  const bound = readBoundPayload(req);
  if (!bound || bound.uuid !== uuid) {
    json(res, 403, {
      error: "payload_unbound",
      message: "That sign request is not from this browser.",
    }, req);
    return;
  }
  const { ok, status, data } = await xumm(`/payload/${uuid}`);
  if (!ok) {
    json(res, status >= 400 ? status : 502, {
      error: "xaman_lookup_failed",
      message: "Xaman did not return that payload.",
    }, req);
    return;
  }
  const payload = publicPayload(data);
  if (
    (bound.kind === "trustset" || bound.kind === "ammcreate") &&
    payload.signed &&
    payload.account &&
    req.pondSession?.address &&
    payload.account !== req.pondSession.address
  ) {
    json(res, 403, {
      error: "account_mismatch",
      message:
        bound.kind === "ammcreate"
          ? "That AMMCreate request is for a different XRPL address."
          : "That trust line request is for a different XRPL address.",
    }, req);
    return;
  }
  json(res, 200, { ...payload, expiresAt: bound.exp }, req);
}

/**
 * @returns {boolean} whether the request was an API/health route
 */
export async function handleApi(req, res, url, { readSession } = {}) {
  if (req.method === "OPTIONS" && (url === "/health" || url.startsWith("/api/xaman"))) {
    json(res, 204, {}, req);
    return true;
  }

  if (req.method === "GET" && (url === "/health" || url === "/api/xaman/health")) {
    json(res, 200, healthBody(), req);
    return true;
  }

  const session = typeof readSession === "function" ? readSession(req, res) : null;
  req.pondSession = session;

  if (url === "/api/xaman/signin" && req.method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (error) {
      json(res, 400, { error: "bad_request", message: error.message }, req);
      return true;
    }
    await createSignIn(req, res, body);
    return true;
  }

  if (url === "/api/xaman/trustset" && req.method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (error) {
      json(res, 400, { error: "bad_request", message: error.message }, req);
      return true;
    }
    await createTrustSet(req, res, body, session);
    return true;
  }

  if (url === "/api/xaman/ammcreate" && req.method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (error) {
      json(res, 400, { error: "bad_request", message: error.message }, req);
      return true;
    }
    await createAmmCreate(req, res, body, session);
    return true;
  }

  const payload = url.match(/^\/api\/xaman\/payload\/([^/]+)$/);
  if (payload && req.method === "GET") {
    await getPayload(req, res, decodeURIComponent(payload[1]));
    return true;
  }

  return false;
}
