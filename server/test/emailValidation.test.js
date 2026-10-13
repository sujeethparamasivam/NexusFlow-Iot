import test from "node:test";
import assert from "node:assert/strict";
import { hasMailExchange } from "../src/emailValidation.js";

test("rejects domains that publish a null MX record", async () => {
  for (const exchange of [".", ""]) {
    const hasMail = await hasMailExchange("user@gmail.co", async () => [{ exchange }]);
    assert.equal(hasMail, false);
  }
});

test("accepts domains with working MX records", async () => {
  const hasMail = await hasMailExchange("user@gmail.com", async () => [{ exchange: "gmail-smtp-in.l.google.com" }]);
  assert.equal(hasMail, true);
});

test("rejects domains without MX records", async () => {
  const hasMail = await hasMailExchange("user@example.invalid", async () => {
    throw Object.assign(new Error("No MX records"), { code: "ENODATA" });
  });
  assert.equal(hasMail, false);
});