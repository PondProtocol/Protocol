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
  assert.equal(snapshot.trustLines.pnd.status, "missing");
  assert.equal(snapshot.trustLines.rpnd.status, "not_issued");
  assert.equal(snapshot.membership.status, "none");
  assert.equal(snapshot.airdrop.status, "later");
  assert.equal(snapshot.airdrop.hold, "0");
  assert.match(snapshot.airdrop.note, /not an APY/);
  assert.doesNotMatch(snapshot.airdrop.note, /earn|yield|% APY/i);
});

test("PND trust line is set even at zero, rPND stays not issued", () => {
  const snapshot = summarizeBalances(
    {
      accountFound: true,
      balanceDrops: "1000000",
      lines: [{ account: PND, currency: "PND", balance: "0" }],
    },
    { pndIssuer: PND },
  );
  assert.equal(snapshot.trustLines.pnd.status, "set");
  assert.equal(snapshot.assets.find((asset) => asset.id === "pnd").state, "not_issued");
  assert.equal(snapshot.trustLines.rpnd.status, "not_issued");
  assert.equal(snapshot.membership.status, "none");
  assert.match(snapshot.membership.note, /not minted/);
  assert.equal(snapshot.airdrop.hold, "0");
  assert.equal(snapshot.airdrop.status, "later");
});
