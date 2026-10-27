// SendGrid's delivery event statuses, plus `sent`: the default state a send
// starts in before any delivery events arrive.
export enum EmailDeliveryStatus {
  // The send action succeeded; no delivery events yet
  sent = 'sent',

  // Provider received the message and is preparing to send it
  processed = 'processed',

  // Receiving server temporarily rejected it; the provider will retry (reason = SMTP response)
  deferred = 'deferred',

  // Accepted by the receiving server
  delivered = 'delivered',

  // Provider did not attempt delivery: suppression list, invalid, prior bounce (reason attached)
  dropped = 'dropped',

  // Permanent rejection
  bounce = 'bounce',

  // Blocked by the receiving server
  block = 'block',
}
