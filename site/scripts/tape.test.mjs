import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  RIPPLE_EPOCH,
  emptyStore,
  ledgerTrade,
  ledgerTrades,
  mergePrints,
  publicTape,
  readStore,
  writeStore,
} from "./tape.mjs";

const FIRST_HASH = "DDB94DB45A333EAEC87A596ADF0F5BBE9A6A9EAFC54658D8E3DA7AC2FE3508DE";
const FIRST_DATE = 809_000_000; // 2025-08-22-ish ripple date; time math only
const LATER_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

function payment({ hash, date, side = "buy", xrpDrops = "2093800", pnd = "1" }) {
  const delivered =
    side === "buy"
      ? { currency: "PND", issuer: "rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc", value: pnd }
      : String(xrpDrops);
  const sendMax =
    side === "buy"
      ? String(xrpDrops)
      : { currency: "PND", issuer: "rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc", value: pnd };
  return {
    hash,
    ledger_index: 1,
    tx: {
      TransactionType: "Payment",
      hash,
      date,
      SendMax: sendMax,
      Amount: delivered,
    },
    meta: {
      TransactionResult: "tesSUCCESS",
      delivered_amount: delivered,
    },
  };
}

function withStore(run) {
  const dir = mkdtempSync(join(tmpdir(), "pond-tape-"));
  const prev = process.env.POND_TAPE_STORE;
  process.env.POND_TAPE_STORE = join(dir, "pnd-tape.json");
  return Promise.resolve()
    .then(run)
    .finally(() => {
      if (prev === undefined) delete process.env.POND_TAPE_STORE;
      else process.env.POND_TAPE_STORE = prev;
      rmSync(dir, { recursive: true, force: true });
    });
}

test("Payment PND↔XRP is a print; AMMCreate is not", () => {
  const first = ledgerTrade(payment({ hash: FIRST_HASH, date: FIRST_DATE, xrpDrops: "2093800", pnd: "1" }));
  assert.equal(first.hash, FIRST_HASH);
  assert.equal(first.side, "buy");
  assert.ok(Math.abs(first.price - 2.0938) < 1e-9);
  assert.equal(first.time, (FIRST_DATE + RIPPLE_EPOCH) * 1000);
  assert.equal(
    ledgerTrade({
      tx: { TransactionType: "AMMCreate", hash: "677356059F846A917FB902FF3ECF7D6B6B36C59C480CE61614A61546FCE4F1A9", date: FIRST_DATE - 100 },
      meta: { TransactionResult: "tesSUCCESS" },
    }),
    null,
  );
  assert.equal(
    ledgerTrade({
      tx: { TransactionType: "OfferCreate", hash: "OFFER", date: FIRST_DATE },
      meta: { TransactionResult: "tesSUCCESS" },
    }),
    null,
  );
  assert.equal(
    ledgerTrade({
      ...payment({ hash: "FAIL2", date: FIRST_DATE }),
      meta: { TransactionResult: "tecPATH_PARTIAL" },
    }),
    null,
  );
});

test("merge keeps genesis when a newest page arrives", () => {
  const first = ledgerTrade(payment({ hash: FIRST_HASH, date: FIRST_DATE }));
  const later = ledgerTrade(payment({ hash: LATER_HASH, date: FIRST_DATE + 40_000, xrpDrops: "1000000", pnd: "2" }));
  const newestPageOnly = ledgerTrades([payment({ hash: LATER_HASH, date: FIRST_DATE + 40_000, xrpDrops: "1000000", pnd: "2" })]);
  const merged = mergePrints([first], newestPageOnly);
  assert.equal(merged[0].hash, FIRST_HASH);
  assert.equal(merged.length, 2);
  assert.equal(merged[1].hash, LATER_HASH);
  assert.deepEqual(mergePrints([first, later], [later]).map((row) => row.hash), [FIRST_HASH, LATER_HASH]);
});

test("public tape reports first print forward and does not invent candles", () => {
  const prints = mergePrints(
    ledgerTrades([
      payment({ hash: FIRST_HASH, date: FIRST_DATE }),
      payment({ hash: LATER_HASH, date: FIRST_DATE + 120, xrpDrops: "1500000", pnd: "1" }),
    ]),
  );
  const body = publicTape({ ...emptyStore(), complete: true, prints });
  assert.equal(body.count, 2);
  assert.equal(body.firstPrint.hash, FIRST_HASH);
  assert.equal(body.lastPrint.hash, LATER_HASH);
  assert.equal(body.complete, true);
  assert.equal(body.prints.every((print) => print.type === "Payment"), true);
});

test("writeStore never drops the first stored print", () =>
  withStore(() => {
    const first = ledgerTrade(payment({ hash: FIRST_HASH, date: FIRST_DATE }));
    writeStore({ ...emptyStore(), complete: false, prints: [first] });
    const later = ledgerTrade(payment({ hash: LATER_HASH, date: FIRST_DATE + 80_000 }));
    const saved = writeStore({ ...readStore(), complete: true, prints: mergePrints(readStore().prints, [later]) });
    assert.equal(saved.prints[0].hash, FIRST_HASH);
    assert.equal(saved.firstPrintHash, FIRST_HASH);
    assert.equal(saved.prints.length, 2);
    const disk = JSON.parse(readFileSync(process.env.POND_TAPE_STORE, "utf8"));
    assert.equal(disk.prints[0].hash, FIRST_HASH);
    assert.equal(disk.complete, true);
  }));
