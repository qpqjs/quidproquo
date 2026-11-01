/**
 * Masks a username the way Cognito masks a code delivery destination (`j***@e***`), so a simulated
 * delivery for an unknown account is indistinguishable from a real one.
 *
 * A username that is not an email (a preferred_username alias) still answers the full email shape: a real
 * alias account would show its masked email, so a reply without a domain would give the account away. The
 * domain letter is derived from the username so simulated replies vary the way real ones do.
 */
export const maskDeliveryDestination = (username: string): string => {
  const [local = '', domain] = username.split('@');
  const maskedLocal = `${local.charAt(0)}***`;
  const domainLetter = domain === undefined ? deriveDomainLetter(username) : domain.charAt(0);

  return `${maskedLocal}@${domainLetter}***`;
};

const deriveDomainLetter = (username: string): string => {
  const checksum = Array.from(username).reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) % 26, 0);

  return String.fromCharCode('a'.charCodeAt(0) + checksum);
};
