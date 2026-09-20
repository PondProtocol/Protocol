/**
 * Persisted $PND/XRP tape. Validated AMM/DEX Payment prints only.
 *
 * The /trade/ client used to page newest-first account_tx and stop near 200
 * rows, so the first Payment and every older print never reached the chart.
 * This process pages the pool until the marker is gone, writes tesSUCCESS
 * PND↔XRP Payments to a JSON file, and serves them on GET /api/tape.
 *
 * Polling appends newer prints. It never deletes a stored hash, so genesis
 * cannot drop after a quiet refresh. AMMCreate / AMMDeposit / AMMWithdraw /
 * OfferCreate / failed txs are not prints. Empty minutes are not filled.
 *
 * Autoscale disk can be ephemeral. The file is the whole tape. No seeds.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadConfig, SITE_ROOT } from "./lib.mjs";

export const RIPPLE_EPOCH = 946684800;
export const TAPE_POLL_MS = 8000;
export const BACKFILL_PAGE = 200;
export const LIVE_PAGE = 80;
const DEFAULT_RPC = "https://s.altnet.rippletest.net:51234";

const config = loadConfig();
const issuer = config.site.issuerAddress;

let syncTimer = 0;
let syncInFlight = false;

export function storePath() {
  return process.env.POND_TAPE_STORE?.trim() || join(SITE_ROOT, "data", "pnd-tape.json");
}

export function rpcUrl() {
  return process.env.POND_XRPL_RPC?.trim() || DEFAULT_RPC;
}

export function emptyStore() {
  return {
    v: 1,
    network: "testnet",
    pool: "",
    prints: [],
    complete: false,
    marker: null,
    firstPrintHash: "",
    lastPrintHash: "",
    updatedAt: 0,
    error: "",
  };
}

export function parseLedgerAmount(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    const drops = Number(value);
    if (!Number.isFinite(drops)) return null;
    return { asset: "XRP", xrp: drops / 1_000_000 };
  }
  if (value.currency === "PND" && value.value != null) {
    const n = Number(value.value);
    if (!Number.isFinite(n)) return null;
    return { asset: "PND", value: n };
  }
  return null;
}

export function ledgerTrade(item) {
  const tx = item?.tx || item?.tx_json || {};
  const meta = item?.meta || {};
  if (meta.TransactionResult && meta.TransactionResult !== "tesSUCCESS") return null;
  if (tx.TransactionType !== "Payment") return null;
  const delivered = parseLedgerAmount(meta.delivered_amount ?? meta.DeliveredAmount ?? tx.Amount);
  const sendMax = parseLedgerAmount(tx.SendMax);
  let xrp = 0;
  let pnd = 0;
  let side = "buy";
  if (delivered?.asset === "XRP" && sendMax?.asset === "PND") {
    xrp = delivered.xrp;
    pnd = sendMax.value;
    side = "sell";
  } else if (delivered?.asset === "PND" && sendMax?.asset === "XRP") {
    pnd = delivered.value;
    xrp = sendMax.xrp;
    side = "buy";
  } else {
    return null;
  }
  if (!(xrp > 0) || !(pnd > 0)) return null;
  const date = Number(tx.date);
  return {
    type: "Payment",
    side,
    xrp,
    pnd,
    price: xrp / pnd,
    date,
    time: Number.isFinite(date) ? (date + RIPPLE_EPOCH) * 1000 : null,
    hash: tx.hash || item?.hash || "",
    ledger: item?.ledger_index || tx.ledger_index || null,
  };
}

export function ledgerTrades(items = []) {
  return items.map(ledgerTrade).filter(Boolean);
}

export function mergePrints(...lists) {
  const seen = new Set();
  const merged = [];
  for (const list of lists) {
    for (const print of list || []) {
      const key = print?.hash || `${print?.ledger || ""}:${print?.time || ""}:${print?.price || ""}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(print);
    }
  }
  return merged
    .filter((print) => print.time && print.price > 0)
    .sort((a, b) => a.time - b.time || String(a.hash).localeCompare(String(b.hash)));
}

export function publicTape(store = emptyStore()) {
  const prints = Array.isArray(store.prints) ? store.prints : [];
  return {
    v: store.v || 1,
    network: store.network || "testnet",
    pool: store.pool || "",
    complete: Boolean(store.complete),
    count: prints.length,
    firstPrint: prints[0] || null,
    lastPrint: prints[prints.length - 1] || null,
    updatedAt: store.updatedAt || 0,
    error: store.error || "",
    prints,
  };
}

export function readStore() {
  const path = storePath();
  if (!existsSync(path)) return emptyStore();
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.prints)) return emptyStore();
    const prints = mergePrints(parsed.prints);
    return {
      ...emptyStore(),
      ...parsed,
      prints,
      firstPrintHash: prints[0]?.hash || "",
      lastPrintHash: prints[prints.length - 1]?.hash || "",
    };
  } catch {
    return emptyStore();
  }
}

export function writeStore(store) {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  const prints = mergePrints(store.prints);
  const next = {
    ...emptyStore(),
    ...store,
    prints,
    firstPrintHash: prints[0]?.hash || "",
    lastPrintHash: prints[prints.length - 1]?.hash || "",
    updatedAt: Date.now(),
  };
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(next)}\n`);
  renameSync(tmp, path);
  return next;
}

async function xrplRpc(method, params = {}) {
  const response = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params: [params] }),
  });
  if (!response.ok) throw new Error(`XRPL RPC ${method} HTTP ${response.status}`);
  const body = await response.json();
  if (body.result?.status === "error" || body.error) {
    throw new Error(body.result?.error_message || body.error_message || body.error || `XRPL RPC ${method} failed`);
  }
  return body.result || body;
}

export async function discoverPoolAccount() {
  const info = await xrplRpc("amm_info", {
    asset: { currency: "XRP" },
    asset2: { currency: "PND", issuer },
    ledger_index: "validated",
  });
  const account = info?.amm?.account || "";
  if (!account) throw new Error("No PND/XRP AMM pool on Testnet.");
  return account;
}

async function pageAccountTx(account, { forward, marker, limit }) {
  const params = {
    account,
    ledger_index_min: -1,
    ledger_index_max: -1,
    limit,
    forward,
  };
  if (marker) params.marker = marker;
  const result = await xrplRpc("account_tx", params);
  return {
    transactions: result?.transactions || [],
    marker: result?.marker || null,
  };
}

export async function syncTape({ liveOnly = false, pages = liveOnly ? 1 : 16 } = {}) {
  let store = readStore();
  try {
    const pool = store.pool || (await discoverPoolAccount());
    store.pool = pool;
    store.error = "";
    if (!liveOnly && !store.complete) {
      let marker = store.marker || null;
      for (let page = 0; page < pages; page += 1) {
        const batch = await pageAccountTx(pool, { forward: true, marker, limit: BACKFILL_PAGE });
        store.prints = mergePrints(store.prints, ledgerTrades(batch.transactions));
        marker = batch.marker;
        store.marker = marker;
        store.complete = !marker;
        store = writeStore(store);
        if (!marker || !batch.transactions.length) break;
      }
    }
    const latest = await pageAccountTx(pool, { forward: false, marker: null, limit: LIVE_PAGE });
    store.prints = mergePrints(store.prints, ledgerTrades(latest.transactions));
    store = writeStore(store);
    return publicTape(store);
  } catch (error) {
    store.error = error instanceof Error ? error.message : "Tape sync failed.";
    try {
      store = writeStore(store);
    } catch {
      /* Keep serving whatever is already on disk. */
    }
    return publicTape(store);
  }
}

export function startTapeSync() {
  if (syncTimer) return;
  const tick = async () => {
    if (syncInFlight) return;
    syncInFlight = true;
    try {
      const store = readStore();
      await syncTape({ liveOnly: Boolean(store.complete), pages: store.complete ? 1 : 8 });
    } catch (error) {
      process.stderr.write(`tape.mjs: ${error instanceof Error ? error.stack : error}\n`);
    } finally {
      syncInFlight = false;
    }
  };
  tick();
  syncTimer = setInterval(tick, TAPE_POLL_MS);
  if (typeof syncTimer.unref === "function") syncTimer.unref();
}

export function tapeHealth() {
  const store = readStore();
  return {
    ok: true,
    service: "pnd-tape",
    complete: Boolean(store.complete),
    count: store.prints.length,
    firstPrintHash: store.firstPrintHash || "",
    lastPrintHash: store.lastPrintHash || "",
    updatedAt: store.updatedAt || 0,
    error: store.error || "",
  };
}

export async function handleTape(req, res, url) {
  if (url !== "/api/tape" && url !== "/api/tape/health") return false;
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.end();
    return true;
  }
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return true;
  }
  if (url === "/api/tape/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(tapeHealth()));
    return true;
  }
  const body = publicTape(readStore());
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
  return true;
}
