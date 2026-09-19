import assert from "node:assert/strict";
import { test } from "node:test";
import { ADMIN_ADDRESS } from "./profiles.mjs";
import {
  handleIdenticon,
  identiconHash,
  identiconPath,
  identiconSeed,
  identiconSvg,
  isIdenticonPath,
} from "./identicon.mjs";

const OTHER = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpADk";

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(payload) {
      this.body = payload || "";
    },
  };
}

test("identicon is derived from the r-address and stays stable", () => {
  const path = identiconPath(ADMIN_ADDRESS);
  const hash = identiconHash(ADMIN_ADDRESS);
  assert.match(hash, /^[a-f0-9]{16}$/);
  assert.equal(path, `/identicon/${hash}.svg`);
  assert.equal(isIdenticonPath(path), true);
  assert.equal(identiconPath(ADMIN_ADDRESS), path);
  assert.equal(identiconSeed(ADMIN_ADDRESS), hash);
  assert.equal(identiconSeed(hash), hash);
  assert.equal(identiconSvg(ADMIN_ADDRESS), identiconSvg(hash));
  assert.notEqual(identiconPath(OTHER), path);
  assert.notEqual(identiconSvg(OTHER), identiconSvg(ADMIN_ADDRESS));
  assert.equal(identiconPath("not-an-address"), "");
  assert.equal(identiconSvg(""), "");
});

test("identicon SVG is a generated photo, not the duck", () => {
  const svg = identiconSvg(ADMIN_ADDRESS);
  assert.match(svg, /<svg[\s\S]*<\/svg>/);
  assert.match(svg, /clipPath/);
  assert.match(svg, /Generated tadpole avatar/);
  assert.doesNotMatch(svg, /greenhead/i);
  assert.doesNotMatch(svg, /duck/i);
  assert.doesNotMatch(svg, /r3E25CzRmwMRNmT15mD3s8tLP9fZHbmN7B/);
});

test("GET /identicon/:hash.svg serves the same image as the address", () => {
  const path = identiconPath(ADMIN_ADDRESS);
  const res = mockRes();
  assert.equal(handleIdenticon({ method: "GET" }, res, path), true);
  assert.equal(res.statusCode, 200);
  assert.match(String(res.headers["Content-Type"]), /image\/svg\+xml/);
  assert.equal(res.body, identiconSvg(ADMIN_ADDRESS));
  const byAddress = mockRes();
  assert.equal(handleIdenticon({ method: "GET" }, byAddress, `/identicon/${ADMIN_ADDRESS}.svg`), true);
  assert.equal(byAddress.body, res.body);
  const missing = mockRes();
  assert.equal(handleIdenticon({ method: "GET" }, missing, "/profile/"), false);
});
