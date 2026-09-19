/**
 * Signed login session cookie. No database.
 *
 * After official WalletConnect or Xaman SignIn, the browser POSTs here and
 * we set an httpOnly SameSite cookie with the XRPL address + method.
 * Xaman logins are checked against the Platform payload. WalletConnect
 * logins send the address the wallet already returned on /trade/.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { ensureProfile, publicProfile } from "./profiles.mjs";
import { signedXamanAccount } from "./xaman.mjs";

const COOKIE = "pond_session";
const MAX_AGE = 60 * 60 * 24 * 30;
const MAX_BODY = 16 * 1024;
const ADDR_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

function secret() {
  return (
    process.env.POND_SESSION_SECRET?.trim() ||
    process.env.XUMM_API_SECRET?.trim() ||
    "pond-docs-session-v1"
  );
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
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function verify(token) {
  const [body, mac] = String(token || "").split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  if (!safeEqual(mac, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!ADDR_RE.test(payload.address || "")) return null;
    if (payload.method !== "walletconnect" && payload.method !== "xaman") return null;
    return { address: payload.address, method: payload.method };
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
    `${COOKIE}=${clear ? "" : encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${clear ? 0 : MAX_AGE}`,
  ];
  if (isSecure(req)) parts.push("Secure");
  return parts.join("; ");
}

function publicSession(session, profile = null) {
  if (!session) return { address: null, method: null, handle: null, admin: false };
  return {
    address: session.address,
    method: session.method,
    ...publicProfile(profile),
  };
}

export function readSession(req) {
  return verify(parseCookies(req)[COOKIE]);
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
    const session = readSession(req);
    const profile = session ? await ensureProfile(session.address) : null;
    json(res, 200, publicSession(session, profile));
    return true;
  }

  if (req.method === "DELETE") {
    json(res, 200, publicSession(null), { "Set-Cookie": cookieHeader("", req, { clear: true }) });
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

  const method = body.method === "xaman" ? "xaman" : body.method === "walletconnect" ? "walletconnect" : "";
  if (!method) {
    json(res, 400, { error: "bad_request", message: "method must be walletconnect or xaman." });
    return true;
  }

  let address = "";
  if (method === "xaman") {
    const looked = await signedXamanAccount(body.uuid);
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

  const session = { address, method, t: Date.now() };
  const profile = await ensureProfile(address);
  json(res, 200, publicSession(session, profile), { "Set-Cookie": cookieHeader(sign(session), req) });
  return true;
}
