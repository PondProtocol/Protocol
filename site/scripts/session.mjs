/**
 * Signed login session cookie. No database.
 *
 * After official WalletConnect or Xaman SignIn, the browser POSTs here and
 * we set an httpOnly SameSite cookie with the XRPL address + method.
 * Xaman logins are checked against the Platform payload. WalletConnect
 * logins send the address the wallet already returned on /trade/.
 *
 * WalletConnect may stay connected for /trade/. Account / profile pages
 * need an active Xaman session. Idle timeout is 24 hours from last
 * authenticated use, not from login.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { ensureProfile, markLastSignIn, publicProfile } from "./profiles.mjs";
import { healthBody, signedXamanAccount } from "./xaman.mjs";

export const SESSION_COOKIE = "pond_session";
export const IDLE_MS = 60 * 60 * 24 * 1000;
export const XAMAN_STATUS_TTL_MS = 60 * 1000;
const MAX_AGE = 60 * 60 * 24;
const MAX_BODY = 16 * 1024;
const ADDR_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const DEFAULT_WC_PROJECT_ID = "89408e9bcaa385da1a1867c446cfb7b2";

let xamanStatusCache = { at: 0, value: null };

export function sessionSecret() {
  return process.env.POND_SESSION_SECRET?.trim() || "";
}

function secret() {
  return sessionSecret();
}

export function sessionConfigured() {
  return Boolean(sessionSecret());
}

export function walletConnectProjectId() {
  return process.env.WALLETCONNECT_PROJECT_ID?.trim() || DEFAULT_WC_PROJECT_ID;
}

export function cachedXamanStatus(now = Date.now()) {
  if (xamanStatusCache.value && now - xamanStatusCache.at < XAMAN_STATUS_TTL_MS) {
    return xamanStatusCache.value;
  }
  const value = healthBody().xaman;
  xamanStatusCache = { at: now, value };
  return value;
}

function sessionExtras() {
  return {
    xaman: cachedXamanStatus(),
    walletconnect: { projectId: walletConnectProjectId() },
  };
}

function json(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value);
  res.end(payload);
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

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const at = part.indexOf("=");
    if (at < 0) continue;
    const key = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

function sign(payload) {
  const key = secret();
  if (!key) {
    throw new Error("POND_SESSION_SECRET is not set");
  }
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function verify(token) {
  const key = secret();
  if (!key) return null;
  const [body, mac] = String(token || "").split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", key).update(body).digest("base64url");
  if (!safeEqual(mac, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!ADDR_RE.test(payload.address || "")) return null;
    if (payload.method !== "walletconnect" && payload.method !== "xaman") return null;
    return {
      address: payload.address,
      method: payload.method,
      t: payload.t,
      active: payload.active,
    };
  } catch {
    return null;
  }
}

function isSecure(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return proto === "https" || Boolean(req.socket?.encrypted);
}

function cookieHeader(value, req, { clear = false } = {}) {
  const parts = [
    `${SESSION_COOKIE}=${clear ? "" : encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${clear ? 0 : MAX_AGE}`,
  ];
  if (isSecure(req)) parts.push("Secure");
  return parts.join("; ");
}

function sessionMeta(session) {
  if (!session) {
    return { signedInWith: null, activeAt: null, idleMs: IDLE_MS, expiresAt: null };
  }
  const activeAt = Number(session.active ?? session.t ?? 0);
  return {
    signedInWith: session.method === "xaman" ? "Xaman" : session.method === "walletconnect" ? "WalletConnect" : session.method,
    activeAt,
    idleMs: IDLE_MS,
    expiresAt: Number.isFinite(activeAt) && activeAt > 0 ? activeAt + IDLE_MS : null,
  };
}

function publicSession(session, profile = null) {
  if (!session) {
    return { address: null, method: null, handle: null, admin: false, displayName: "", ...sessionMeta(null) };
  }
  if (session.method !== "xaman") {
    return {
      address: session.address,
      method: session.method,
      handle: null,
      admin: false,
      displayName: "",
      ...sessionMeta(session),
    };
  }
  return {
    address: session.address,
    method: session.method,
    ...publicProfile(profile),
    ...sessionMeta(session),
  };
}

export function activityFresh(session, now = Date.now()) {
  const at = Number(session?.active ?? session?.t ?? 0);
  return Boolean(session?.address) && Number.isFinite(at) && at > 0 && now - at < IDLE_MS;
}

export function isXamanSession(session) {
  return session?.method === "xaman" && ADDR_RE.test(session.address || "");
}

export function signSession(session) {
  return sign({
    address: session.address,
    method: session.method,
    t: session.t,
    active: session.active,
  });
}

export function readSession(req) {
  const session = verify(parseCookies(req)[SESSION_COOKIE]);
  if (!session || !activityFresh(session)) return null;
  return session;
}

export function touchSession(req, res) {
  const session = verify(parseCookies(req)[SESSION_COOKIE]);
  if (!session) return null;
  if (!activityFresh(session)) {
    res.setHeader("Set-Cookie", cookieHeader("", req, { clear: true }));
    return null;
  }
  const next = { ...session, active: Date.now() };
  res.setHeader("Set-Cookie", cookieHeader(signSession(next), req));
  return next;
}

/**
 * @returns {boolean} whether the request was a session route
 */
export async function handleSession(req, res, url) {
  if (url !== "/api/session") return false;

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return true;
  }

  if (req.method === "GET") {
    const session = sessionConfigured() ? touchSession(req, res) : null;
    const profile = isXamanSession(session) ? await ensureProfile(session.address) : null;
    json(res, 200, { ...publicSession(session, profile), ...sessionExtras() });
    return true;
  }

  if (req.method === "DELETE") {
    json(res, 200, { ...publicSession(null), ...sessionExtras() }, { "Set-Cookie": cookieHeader("", req, { clear: true }) });
    return true;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "method_not_allowed", message: "Use GET, POST, or DELETE." });
    return true;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    json(res, 400, { error: "bad_request", message: error.message });
    return true;
  }

  if (!sessionConfigured()) {
    json(res, 503, {
      error: "session_unconfigured",
      message: "Sign in is unavailable until Autoscale has POND_SESSION_SECRET.",
      ...sessionExtras(),
    });
    return true;
  }

  const method = body.method === "xaman" ? "xaman" : body.method === "walletconnect" ? "walletconnect" : "";
  if (!method) {
    json(res, 400, { error: "bad_request", message: "method must be walletconnect or xaman." });
    return true;
  }

  let address = "";
  if (method === "xaman") {
    const looked = await signedXamanAccount(body.uuid, req);
    if (looked.error) {
      json(res, looked.error === "xaman_unconfigured" ? 503 : 400, {
        error: looked.error,
        message: looked.message,
      });
      return true;
    }
    address = looked.account;
  } else {
    address = String(body.address || "").trim();
    if (!ADDR_RE.test(address)) {
      json(res, 400, { error: "bad_address", message: "That is not a classic XRPL address." });
      return true;
    }
  }

  const now = Date.now();
  const session = { address, method, t: now, active: now };
  let profile = null;
  if (method === "xaman") {
    await ensureProfile(address);
    profile = await markLastSignIn(address);
  }
  json(res, 200, { ...publicSession(session, profile), ...sessionExtras() }, {
    "Set-Cookie": cookieHeader(signSession(session), req),
  });
  return true;
}
