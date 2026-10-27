/**
 * Generates a short 8-character hash string from the given input strings.
 *
 * The algorithm is the classic multiply-by-31 string hash (the same one Java's
 * `String.hashCode` uses), folded to 32 bits with the sign dropped. It is fast and
 * deterministic but NOT cryptographic and not collision-resistant: use it only for
 * short non-adversarial identifiers like derived resource names, never for anything
 * security-sensitive.
 *
 * @param {string} input - The first input string to hash.
 * @param {...string[]} rest - Further strings, concatenated onto the input before hashing.
 * @returns {string} An 8-character lowercase hexadecimal string.
 */
export function generateSimpleHash(input: string, ...rest: string[]): string {
  const megaString = [input, ...rest].join('');
  let hash = 0;

  for (let i = 0; i < megaString.length; i++) {
    const char = megaString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }

  // Convert the hash to a hexadecimal string
  const hexHash = Math.abs(hash).toString(16);

  // Pad the hash with leading zeros if necessary
  const paddedHash = hexHash.padStart(8, '0');

  return paddedHash;
}
