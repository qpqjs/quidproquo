// The marker row id for one received message: the recipient's local part, which the email
// test sets to its own run id so the marker it polls for is provably its own.
export const smokeEmailMarkerId = (recipient: string): string =>
  `email-${recipient.split('@')[0]}`;
