/**
 * Masks a username the way Cognito masks a code delivery destination (`j***@e***`), so a simulated
 * delivery for an unknown account is indistinguishable from a real one.
 */
export const maskDeliveryDestination = (username: string): string => {
  const [local = '', domain] = username.split('@');
  const maskedLocal = `${local.charAt(0)}***`;

  return domain === undefined ? maskedLocal : `${maskedLocal}@${domain.charAt(0)}***`;
};
