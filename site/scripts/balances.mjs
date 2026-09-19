/**
 * Public XRPL balances for a signed-in profile. No database.
 *
 * Reads the validated ledger over HTTPS JSON-RPC. Never asks for a seed.
 * $PND and $rPND stay "not issued" until a real non-zero holding exists
 * on this project's issuer. The RLUSD issuer is kept in this server file
 * so it does not leak into site/dist.
 */
import { loadConfig } from "./lib.mjs";

const XRPL_RPC = "https://xrplcluster.com/";
const RLUSD_ISSUER = "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De";
const RLUSD_CODE = "RLUSD";

function currencyText(code) {
  const raw = String(code || "");
  if (!raw) return "";
  if (/^[A-Za-z0-9]{1,3}$/.test(raw)) return raw;
  if (/^[0-9A-Fa-f]{40}$/.test(raw)) {
    const bytes = Buffer.from(raw, "hex");
    const end = bytes.indexOf(0);
    return bytes.subarray(0, end === -1 ? bytes.length : end).toString("utf8");
  }
  return raw;
}

function formatDrops(drops) {
  try {
    const value = BigInt(String(drops || "0"));
    const whole = value / 1000000n;
    const fraction = (value % 1000000n).toString().padStart(6, "0").replace(/0+$/, "");
    return fraction ? `${whole}.${fraction}` : whole.toString();
  } catch {
    return "0";
  }
}

function lineAmount(lines, issuer, code) {
  const match = (lines || []).find((line) => {
    const peer = line.account || line.peer || "";
    return peer === issuer && currencyText(line.currency) === code;
  });
  if (!match) return "0";
  const value = Number(match.balance || 0);
  if (!Number.isFinite(value)) return "0";
  return String(Math.abs(value));
}

export function summarizeBalances({ accountFound, balanceDrops, lines }, { pndIssuer }) {
  const pnd = lineAmount(lines, pndIssuer, "PND");
  const rlusd = lineAmount(lines, RLUSD_ISSUER, RLUSD_CODE);
  const pndIssued = Number(pnd) > 0;
  return {
    source: "xrpl-validated-ledger",
    accountFound: Boolean(accountFound),
    assets: [
      {
        id: "pnd",
        label: "$PND",
        value: pndIssued ? pnd : "0",
        state: pndIssued ? "held" : "not_issued",
        note: pndIssued ? "Validated issuer holding" : "Not issued",
      },
      {
        id: "rpnd",
        label: "$rPND",
        value: "0",
        state: "not_issued",
        note: "Not issued",
      },
      {
        id: "xrp",
        label: "$XRP",
        value: accountFound ? formatDrops(balanceDrops) : "0",
        state: accountFound ? "held" : "no_account",
        note: accountFound ? "Validated XRP balance" : "No XRPL account yet",
      },
      {
        id: "rlusd",
        label: "$RLUSD",
        value: accountFound ? rlusd : "0",
        state: accountFound ? (Number(rlusd) > 0 ? "held" : "none") : "no_account",
        note: accountFound ? "Validated ledger trust line" : "No XRPL account yet",
      },
    ],
  };
}

async function xrpl(method, params) {
  const response = await fetch(XRPL_RPC, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ method, params: [params] }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.result?.status === "error" || data.error) {
    const error = new Error(data.result?.error_message || data.error_message || "XRPL request failed");
    error.code = data.result?.error || data.error || "xrpl_error";
    throw error;
  }
  return data.result || data;
}

export async function readBalances(address) {
  const config = loadConfig();
  const pndIssuer = config.site.issuerAddress;
  try {
    const [account, lines] = await Promise.all([
      xrpl("account_info", { account: address, ledger_index: "validated" }).catch((error) => {
        if (String(error.code || error.message).includes("actNotFound")) return null;
        throw error;
      }),
      xrpl("account_lines", { account: address, ledger_index: "validated" }).catch((error) => {
        if (String(error.code || error.message).includes("actNotFound")) return { lines: [] };
        throw error;
      }),
    ]);
    const accountFound = Boolean(account?.account_data);
    return summarizeBalances(
      {
        accountFound,
        balanceDrops: account?.account_data?.Balance || "0",
        lines: lines?.lines || [],
      },
      { pndIssuer },
    );
  } catch {
    return summarizeBalances(
      { accountFound: false, balanceDrops: "0", lines: [] },
      { pndIssuer },
    );
  }
}
