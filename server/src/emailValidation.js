import { resolveMx } from "node:dns/promises";

export async function hasMailExchange(email, lookupMx = resolveMx) {
  const domain = email.slice(email.lastIndexOf("@") + 1);

  try {
    const records = await lookupMx(domain);
    return records.some((record) => record.exchange && record.exchange !== ".");
  } catch (error) {
    if (error.code === "ENODATA" || error.code === "ENOTFOUND") return false;
    const lookupError = new Error("Could not verify email domain");
    lookupError.code = "EMAIL_DOMAIN_LOOKUP_FAILED";
    throw lookupError;
  }
}