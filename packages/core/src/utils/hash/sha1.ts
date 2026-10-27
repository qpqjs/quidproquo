/**
 * Computes the SHA-1 digest of the given bytes.
 *
 * This is a pure TypeScript implementation (RFC 3174) so it stays synchronous and
 * works in both Node and browsers without the async Web Crypto API or a Node-only
 * `crypto` import. SHA-1 is not collision-resistant, so this must never be used for
 * security purposes - it exists for deterministic identifiers like v5 UUIDs.
 *
 * @param {Uint8Array} message - The bytes to hash.
 * @returns {Uint8Array} The 20-byte SHA-1 digest.
 */
export function sha1(message: Uint8Array): Uint8Array {
  // Pad to a multiple of 64 bytes: a 0x80 byte, zeros, then the 64-bit big-endian bit length.
  const messageLength = message.length;
  const paddedLength = Math.ceil((messageLength + 1 + 8) / 64) * 64;

  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[messageLength] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLength = messageLength * 8;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Uint32Array(80);

  for (let block = 0; block < paddedLength; block += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = view.getUint32(block + t * 4);
    }

    for (let t = 16; t < 80; t++) {
      const x = w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16];
      w[t] = (x << 1) | (x >>> 31);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let t = 0; t < 80; t++) {
      let f: number;
      let k: number;

      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[t]) >>> 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const digest = new Uint8Array(20);
  const digestView = new DataView(digest.buffer);
  digestView.setUint32(0, h0);
  digestView.setUint32(4, h1);
  digestView.setUint32(8, h2);
  digestView.setUint32(12, h3);
  digestView.setUint32(16, h4);

  return digest;
}
