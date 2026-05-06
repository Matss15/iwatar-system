const crypto = require("crypto");

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

function generateSecret() {
  const bytes = crypto.randomBytes(20);
  let bits = "";
  let secret = "";

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }

  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    secret += BASE32_ALPHABET[parseInt(chunk, 2)];
  }

  return secret;
}

function decodeBase32(secret) {
  const cleanSecret = String(secret).replace(/\s+/g, "").toUpperCase();
  let bits = "";
  const bytes = [];

  for (const character of cleanSecret) {
    const value = BASE32_ALPHABET.indexOf(character);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateToken(secret, counter) {
  const key = decodeBase32(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
}

function verifyToken(secret, token) {
  const cleanToken = String(token || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / STEP_SECONDS);

  for (let offset = -1; offset <= 1; offset += 1) {
    if (generateToken(secret, currentCounter + offset) === cleanToken) {
      return true;
    }
  }

  return false;
}

function createOtpAuthUri({ secret, username, issuer = "IWATAR Admin" }) {
  const label = `${issuer}:${username}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

module.exports = {
  generateSecret,
  verifyToken,
  createOtpAuthUri,
};
