/**
 * Official Xaman (Xumm) Platform API, server-side only.
 *
 * Creates SignIn and optional TrustSet payloads. The API secret never leaves
 * this process. If XUMM_API_KEY / XUMM_API_SECRET are unset, callers get an
 * honest "connect unavailable" payload instead of a fake success.
 *
 * Docs: https://xumm.readme.io/reference/post-payload
 *       https://docs.xaman.dev/concepts/special-transaction-types/signin
 */
import { loadConfig } from "./lib.mjs";

const XUMM_API = "https://xumm.app/api/v1/platform";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY = 16 * 1024;

const config = loadConfig();
const issuer = config.site.issuerAddress;
const domain = config.site.domain;
const returnUrl = `https://${domain}/connect/?payload={id}`;

export function xamanConfigured() {
  return Boolean(process.env.XUMM_API_KEY?.trim() && process.env.XUMM_API_SECRET?.trim());
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

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

function unavailable(res) {
  json(res, 503, {
    error: "xaman_unconfigured",
    message: healthBody().xaman.reason,
    xaman: healthBody().xaman,
  });
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

function publicCreate(data) {
  return {
    uuid: data.uuid,
    next: data.next?.always ?? null,
    qr: data.refs?.qr_png ?? null,
    websocket: data.refs?.websocket_status ?? null,
    pushed: Boolean(data.pushed),
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

async function createSignIn(res) {
  if (!xamanConfigured()) return unavailable(res);
  const { ok, status, data } = await xumm("/payload", {
    method: "POST",
    body: {
      txjson: { TransactionType: "SignIn" },
      options: {
        submit: false,
        expire: 10,
        force_network: "MAINNET",
        return_url: { app: returnUrl, web: returnUrl },
      },
      custom_meta: {
        instruction:
          "Sign in to pond.greenhead.io. This is not a payment and is never submitted to the ledger. Pond never asks for your seed.",
      },
    },
  });
  if (!ok || !data?.uuid) {
    json(res, status >= 400 ? status : 502, {
      error: "xaman_create_failed",
      message: "Xaman did not create a SignIn payload. Check the app keys and try again.",
    });
    return;
  }
  json(res, 200, publicCreate(data));
}

async function createTrustSet(res) {
  if (!xamanConfigured()) return unavailable(res);
  const { ok, status, data } = await xumm("/payload", {
    method: "POST",
    body: {
      txjson: {
        TransactionType: "TrustSet",
        LimitAmount: {
          currency: "PND",
          issuer,
          value: "100000000000",
        },
      },
      options: {
        submit: true,
        expire: 15,
        force_network: "MAINNET",
        return_url: { app: returnUrl, web: returnUrl },
      },
      custom_meta: {
        instruction:
          "$PND has not been issued. This only opens a trust line to the Pond issuer rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc. It does not give you tokens.",
      },
    },
  });
  if (!ok || !data?.uuid) {
    json(res, status >= 400 ? status : 502, {
      error: "xaman_create_failed",
      message: "Xaman did not create a TrustSet payload. Check the app keys and try again.",
    });
    return;
  }
  json(res, 200, { ...publicCreate(data), kind: "TrustSet", issuer, currency: "PND" });
}

async function getPayload(res, uuid) {
  if (!xamanConfigured()) return unavailable(res);
  if (!UUID_RE.test(uuid)) {
    json(res, 400, { error: "invalid_uuid", message: "That is not a Xaman payload id." });
    return;
  }
  const { ok, status, data } = await xumm(`/payload/${uuid}`);
  if (!ok) {
    json(res, status >= 400 ? status : 502, {
      error: "xaman_lookup_failed",
      message: "Xaman did not return that payload.",
    });
    return;
  }
  json(res, 200, publicPayload(data));
}

/**
 * @returns {boolean} whether the request was an API/health route
 */
export async function handleApi(req, res, url) {
  if (req.method === "OPTIONS" && (url === "/health" || url.startsWith("/api/xaman"))) {
    json(res, 204, {});
    return true;
  }

  if (req.method === "GET" && (url === "/health" || url === "/api/xaman/health")) {
    json(res, 200, healthBody());
    return true;
  }

  if (url === "/api/xaman/signin" && req.method === "POST") {
    try {
      await readBody(req);
    } catch (error) {
      json(res, 400, { error: "bad_request", message: error.message });
      return true;
    }
    await createSignIn(res);
    return true;
  }

  if (url === "/api/xaman/trustset" && req.method === "POST") {
    try {
      await readBody(req);
    } catch (error) {
      json(res, 400, { error: "bad_request", message: error.message });
      return true;
    }
    await createTrustSet(res);
    return true;
  }

  const payload = url.match(/^\/api\/xaman\/payload\/([^/]+)$/);
  if (payload && req.method === "GET") {
    await getPayload(res, decodeURIComponent(payload[1]));
    return true;
  }

  return false;
}
