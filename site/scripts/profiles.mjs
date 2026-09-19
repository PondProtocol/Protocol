/**
 * Public Pond Protocol profiles. JSON file store, no database.
 *
 * After official Xaman SignIn, serve.mjs assigns a handle and writes it
 * here. Account pages and profile JSON are visible only to that Xaman
 * session. WalletConnect does not unlock them. Logged-out visitors do
 * not see handles or profile fields.
 *
 * Handle rules: sequential integer 1 through 99999999999, always with a
 * leading 0 in front of that number.
 *   1 → tadpole01 (reserved for the owner classic address)
 *   2 → tadpole02
 *   9 → tadpole09
 *   10 → tadpole010
 *   11 → tadpole011
 *   100 → tadpole0100
 *   max → tadpole099999999999
 *
 * Autoscale disk can be ephemeral. This file is the whole registry. Do not
 * invent an external database connection from this process.
 *
 * Never stores seeds or private keys.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { readBalances } from "./balances.mjs";
import { SITE_ROOT } from "./lib.mjs";

export const ADMIN_ADDRESS = "r3E25CzRmwMRNmT15mD3s8tLP9fZHbmN7B";
export const ADMIN_HANDLE = "tadpole01";
export const MAX_HANDLE_N = 99_999_999_999;
export const HANDLE_RE = /^tadpole0[1-9]\d{0,10}$/;
const ADDR_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const STEP_IDS = [
  "begin",
  "what-is-pnd",
  "what-is-rpnd",
  "verify-issuer",
  "connect-wallet",
  "set-trust-lines",
  "ready-dex",
];
const NAME_MAX = 40;
const BIO_MAX = 160;
const ICON_MAX = 48 * 1024;
const MAX_BODY = 64 * 1024;

export function storePath() {
  return process.env.POND_PROFILE_STORE?.trim() || join(SITE_ROOT, "data", "profiles.json");
}

function emptyStore() {
  return { v: 1, profiles: [] };
}

export function handleForN(n) {
  if (!Number.isInteger(n) || n < 1 || n > MAX_HANDLE_N) return "";
  return `tadpole0${n}`;
}

export function nextHandle(used) {
  const taken = used instanceof Set ? used : new Set(used);
  for (let n = 1; n <= MAX_HANDLE_N; n += 1) {
    const handle = handleForN(n);
    if (!taken.has(handle)) return handle;
  }
  throw new Error("No tadpole handles left.");
}

export function isAdminAddress(address) {
  return String(address || "") === ADMIN_ADDRESS;
}

function now() {
  return Date.now();
}

function publicFields(row) {
  return {
    handle: row.handle,
    address: row.address,
    displayName: row.displayName || "",
    bio: row.bio || "",
    progress: { ...(row.progress || {}) },
    disclaimerAccepted: Boolean(row.disclaimerAccepted),
    disclaimerAcceptedAt: row.disclaimerAcceptedAt || 0,
    icon: row.icon || "",
    publicCard: Boolean(row.publicCard),
    lastSignedInAt: row.lastSignedInAt || 0,
    lastSavedAt: row.lastSavedAt || 0,
    admin: row.handle === ADMIN_HANDLE || isAdminAddress(row.address),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function seedAdmin(store) {
  if (store.profiles.some((row) => row.handle === ADMIN_HANDLE || row.address === ADMIN_ADDRESS)) {
    return store;
  }
  const t = now();
  store.profiles.push({
    handle: ADMIN_HANDLE,
    address: ADMIN_ADDRESS,
    displayName: "",
    bio: "",
    progress: {},
    createdAt: t,
    updatedAt: t,
  });
  return store;
}

function readStore() {
  const file = storePath();
  if (!existsSync(file)) return seedAdmin(emptyStore());
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.profiles)) return seedAdmin(emptyStore());
    return seedAdmin({ v: 1, profiles: parsed.profiles });
  } catch {
    return seedAdmin(emptyStore());
  }
}

function writeStore(store) {
  const file = storePath();
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify({ v: 1, profiles: store.profiles }, null, 2)}\n`);
  renameSync(tmp, file);
}

let queue = Promise.resolve();

function withStore(fn) {
  const run = queue.then(async () => {
    const store = readStore();
    const result = await fn(store);
    writeStore(store);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function assignHandle(address, used) {
  if (isAdminAddress(address)) return ADMIN_HANDLE;
  return nextHandle(used);
}

function usedHandles(store, exceptAddress = "") {
  return new Set(
    store.profiles.filter((row) => row.address !== exceptAddress).map((row) => row.handle),
  );
}

export function ensureProfile(address) {
  if (!ADDR_RE.test(address || "")) return null;
  let assigned;
  const wait = withStore((store) => {
    let row = store.profiles.find((item) => item.address === address);
    if (isAdminAddress(address)) {
      const reserved = store.profiles.find((item) => item.handle === ADMIN_HANDLE);
      if (reserved && reserved.address !== ADMIN_ADDRESS) {
        reserved.handle = nextHandle(usedHandles(store, reserved.address));
        reserved.updatedAt = now();
      }
      if (!row) {
        row = store.profiles.find((item) => item.handle === ADMIN_HANDLE);
      }
      if (!row) {
        const t = now();
        row = {
          handle: ADMIN_HANDLE,
          address: ADMIN_ADDRESS,
          displayName: "",
          bio: "",
          progress: {},
          createdAt: t,
          updatedAt: t,
        };
        store.profiles.push(row);
      } else {
        row.handle = ADMIN_HANDLE;
        row.address = ADMIN_ADDRESS;
      }
      assigned = publicFields(row);
      return assigned;
    }
    if (row) {
      if (row.handle === ADMIN_HANDLE) {
        row.handle = nextHandle(usedHandles(store, row.address));
        row.updatedAt = now();
      }
      assigned = publicFields(row);
      return assigned;
    }
    const t = now();
    row = {
      handle: nextHandle(usedHandles(store)),
      address,
      displayName: "",
      bio: "",
      progress: {},
      createdAt: t,
      updatedAt: t,
    };
    store.profiles.push(row);
    assigned = publicFields(row);
    return assigned;
  });
  // withStore is async; callers that already have the address from a session
  // need the assigned row. Use the sync path for tests via ensureProfileSync.
  return wait;
}

export function getProfileByHandle(handle) {
  const store = readStore();
  writeStore(store);
  const row = store.profiles.find((item) => item.handle === handle);
  return row ? publicFields(row) : null;
}

export function getProfileByAddress(address) {
  const store = readStore();
  writeStore(store);
  const row = store.profiles.find((item) => item.address === address);
  return row ? publicFields(row) : null;
}

function stripText(value, max) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function looksLikeSecret(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (/^s[A-Za-z0-9]{20,}$/.test(text)) return true;
  if (/^[0-9a-fA-F]{64}$/.test(text)) return true;
  const words = text.split(/\s+/);
  return words.length >= 12 && words.every((word) => /^[a-z]+$/.test(word));
}

function asProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  for (const id of STEP_IDS) {
    if (value[id]) out[id] = true;
  }
  return out;
}

function asIcon(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (looksLikeSecret(text)) {
    return { error: "bad_profile", message: "Do not paste a seed, mnemonic, or private key." };
  }
  if (text.length > ICON_MAX) {
    return { error: "bad_profile", message: "That icon is too large. Use a small image." };
  }
  if (/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(text)) {
    return text.replace(/\s+/g, "");
  }
  if (/^https:\/\/[^\s<>"']+$/i.test(text) && text.length <= 500) return text;
  if (/^\/(?!\/)[A-Za-z0-9._/-]+$/.test(text) && !text.includes("..") && text.length <= 200) {
    return text;
  }
  return {
    error: "bad_profile",
    message: "Use an https image URL, a small image upload, or leave the icon blank.",
  };
}

export function publicProfile(row) {
  if (!row) return { handle: null, admin: false, displayName: "" };
  return {
    handle: row.handle,
    admin: Boolean(row.admin),
    disclaimerAccepted: Boolean(row.disclaimerAccepted),
    icon: row.icon || "",
    displayName: row.displayName || "",
  };
}

export function getPublicCard(handle) {
  const store = readStore();
  const row = store.profiles.find((item) => item.handle === handle);
  if (!row || !row.publicCard) return null;
  return { handle: row.handle, icon: row.icon || "" };
}

export function markLastSignIn(address) {
  if (!ADDR_RE.test(address || "")) return Promise.resolve(null);
  return withStore((store) => {
    const row = store.profiles.find((item) => item.address === address);
    if (!row) return null;
    row.lastSignedInAt = now();
    return publicFields(row);
  });
}

export async function updateOwnProfile(address, patch = {}) {
  if (!ADDR_RE.test(address || "")) {
    return { error: "bad_address", message: "That is not a classic XRPL address." };
  }
  if (looksLikeSecret(patch.displayName) || looksLikeSecret(patch.bio) || looksLikeSecret(patch.icon)) {
    return { error: "bad_profile", message: "Do not paste a seed, mnemonic, or private key." };
  }
  const displayName =
    patch.displayName === undefined ? undefined : stripText(patch.displayName, NAME_MAX);
  const bio = patch.bio === undefined ? undefined : stripText(patch.bio, BIO_MAX);
  const progress = patch.progress === undefined ? undefined : asProgress(patch.progress);
  const icon = patch.icon === undefined ? undefined : asIcon(patch.icon);
  if (icon && icon.error) return icon;
  return withStore((store) => {
    const row = store.profiles.find((item) => item.address === address);
    if (!row) return { error: "not_found", message: "Sign in first to create a profile." };
    if (displayName !== undefined) row.displayName = displayName;
    if (bio !== undefined) row.bio = bio;
    if (progress !== undefined) row.progress = { ...(row.progress || {}), ...progress };
    if (icon !== undefined) row.icon = icon;
    if (patch.disclaimerAccepted === true) {
      row.disclaimerAccepted = true;
      row.disclaimerAcceptedAt = now();
    }
    if (patch.publicCard !== undefined) row.publicCard = Boolean(patch.publicCard);
    const t = now();
    row.lastSavedAt = t;
    row.updatedAt = t;
    return publicFields(row);
  });
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
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

export function isProfilePage(url) {
  return url === "/profile" || url === "/profile/" || /^\/profile\/[A-Za-z0-9_-]+\/?$/.test(url);
}

export function isCardPage(url) {
  return url === "/card" || url === "/card/" || /^\/card\/[A-Za-z0-9_-]+\/?$/.test(url);
}

function denyProfile(res, status, error, message) {
  json(res, status, { error, message });
  return false;
}

function requireXaman(req, res, loadSession) {
  const session = loadSession.length > 1 ? loadSession(req, res) : loadSession(req);
  if (!session?.address) {
    return denyProfile(res, 401, "signed_out", "Sign in with official Xaman.");
  }
  if (session.method !== "xaman") {
    return denyProfile(
      res,
      403,
      "xaman_required",
      "Account pages need official Xaman SignIn. WalletConnect on Trade does not open a profile.",
    );
  }
  return session;
}

/**
 * @returns {Promise<boolean>} whether the request was a profile API route
 */
export async function handleProfiles(req, res, url, { readSession }) {
  const cardMatch = url.match(/^\/api\/card\/([^/]+)$/);
  const handleMatch = url.match(/^\/api\/profile\/([^/]+)$/);
  const collection = url === "/api/profile";
  const balances = url === "/api/profile/balances";

  // GET /api/card/:handle is public: handle + icon only, never the address.
  if (cardMatch) {
    if (req.method === "OPTIONS") {
      json(res, 204, {});
      return true;
    }
    if (req.method !== "GET") {
      json(res, 405, { error: "method_not_allowed", message: "Use GET." });
      return true;
    }
    const handle = decodeURIComponent(cardMatch[1]);
    const card = getPublicCard(handle);
    if (!card) {
      json(res, 404, { error: "not_found", message: "That card is not public." });
      return true;
    }
    json(res, 200, card);
    return true;
  }

  if (!collection && !handleMatch && !balances) return false;

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return true;
  }

  const session = requireXaman(req, res, readSession);
  if (session === false) return true;

  if (req.method === "GET" && balances) {
    const snapshot = await readBalances(session.address);
    json(res, 200, snapshot);
    return true;
  }

  if (req.method === "GET" && handleMatch) {
    const row = await ensureProfile(session.address);
    const handle = decodeURIComponent(handleMatch[1]);
    if (!row || row.handle !== handle) {
      json(res, 404, { error: "not_found", message: "That account page is not available." });
      return true;
    }
    json(res, 200, row);
    return true;
  }

  if (req.method === "GET" && collection) {
    const row = await ensureProfile(session.address);
    json(res, 200, row);
    return true;
  }

  if (req.method === "POST" || req.method === "PATCH") {
    if (!collection) {
      json(res, 405, { error: "method_not_allowed", message: "Update your own profile at /api/profile." });
      return true;
    }
    let body;
    try {
      body = await readBody(req);
    } catch (error) {
      json(res, 400, { error: "bad_request", message: error.message });
      return true;
    }
    await ensureProfile(session.address);
    const updated = await updateOwnProfile(session.address, body);
    if (updated.error) {
      json(res, updated.error === "not_found" ? 404 : 400, updated);
      return true;
    }
    json(res, 200, updated);
    return true;
  }

  json(res, 405, { error: "method_not_allowed", message: "Use GET, POST, or PATCH." });
  return true;
}
