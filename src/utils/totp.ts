const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const SHA1_BLOCK_SIZE = 64;

const rotateLeft = (value: number, bits: number) =>
  ((value << bits) | (value >>> (32 - bits))) >>> 0;

const base32ToBytes = (secret = "") => {
  const cleanSecret = secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  const bytes: number[] = [];

  for (const char of cleanSecret) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) return [];
    bits += value.toString(2).padStart(5, "0");
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return bytes;
};

export const sha1 = (message: number[]) => {
  const bytes = [...message];
  const bitLength = bytes.length * 8;

  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);

  for (let shift = 56; shift >= 0; shift -= 8) {
    bytes.push(Math.floor(bitLength / 2 ** shift) & 0xff);
  }

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const words = new Array<number>(80).fill(0);

    for (let i = 0; i < 16; i += 1) {
      const offset = chunk + i * 4;
      words[i] =
        ((bytes[offset] << 24) |
          (bytes[offset + 1] << 16) |
          (bytes[offset + 2] << 8) |
          bytes[offset + 3]) >>>
        0;
    }

    for (let i = 16; i < 80; i += 1) {
      words[i] = rotateLeft(
        words[i - 3] ^ words[i - 8] ^ words[i - 14] ^ words[i - 16],
        1,
      );
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i += 1) {
      let f = 0;
      let k = 0;

      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + words[i]) >>> 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  return [h0, h1, h2, h3, h4].flatMap((word) => [
    (word >>> 24) & 0xff,
    (word >>> 16) & 0xff,
    (word >>> 8) & 0xff,
    word & 0xff,
  ]);
};

const hmacSha1 = (key: number[], message: number[]) => {
  let normalizedKey = [...key];
  if (normalizedKey.length > SHA1_BLOCK_SIZE) normalizedKey = sha1(normalizedKey);
  while (normalizedKey.length < SHA1_BLOCK_SIZE) normalizedKey.push(0);

  const outerKeyPad = normalizedKey.map((byte) => byte ^ 0x5c);
  const innerKeyPad = normalizedKey.map((byte) => byte ^ 0x36);

  return sha1([...outerKeyPad, ...sha1([...innerKeyPad, ...message])]);
};

const counterToBytes = (counter: number) => {
  const bytes = new Array<number>(8).fill(0);
  let value = counter;

  for (let i = 7; i >= 0; i -= 1) {
    bytes[i] = value & 0xff;
    value = Math.floor(value / 256);
  }

  return bytes;
};

export const generateTotp = (secret: string, timestamp = Date.now()) => {
  const key = base32ToBytes(secret);
  if (!key.length) return null;

  const counter = Math.floor(timestamp / 1000 / 30);
  const hash = hmacSha1(key, counterToBytes(counter));
  const offset = hash[hash.length - 1] & 0xf;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return String(code % 1000000).padStart(6, "0");
};

export const getTotpSecondsRemaining = (timestamp = Date.now()) =>
  30 - Math.floor(timestamp / 1000) % 30;
