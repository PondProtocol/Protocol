import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeBalances } from "./balances.mjs";

const PND = "rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc";

test("unissued PND and rPND stay 0 / not issued", () => {
  const snapshot = summarizeBalances(
    { accountFound: true, balanceDrops: "25000000", lines: [] },
    { pndIssuer: PND },
  );
  const byId = Object.fromEntries(snapshot.assets.map((asset) => [asset.id, asset]));
  assert.equal(byId.pnd.value, "0");
  assert.equal(byId.pnd.state, "not_issued");
  assert.equal(byId.rpnd.value, "0");
  assert.equal(byId.rpnd.state, "not_issued");
  assert.equal(byId.xrp.value, "25");
  assert.equal(byId.xrp.state, "held");
  assert.equal(byId.rlusd.value, "0");
  assert.match(byId.pnd.note, /Not issued/);
});

test("missing XRPL account stays honest zeros", () => {
  const snapshot = summarizeBalances({ accountFound: false, balanceDrops: "0", lines: [] }, { pndIssuer: PND });
  const xrp = snapshot.assets.find((asset) => asset.id === "xrp");
  assert.equal(xrp.value, "0");
  assert.equal(xrp.state, "no_account");
});
