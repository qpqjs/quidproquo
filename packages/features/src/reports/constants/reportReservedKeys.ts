/** Names no dimension or measure may have: they name Object.prototype members, so a record keyed by them misbehaves. */
export const REPORT_RESERVED_KEYS: readonly string[] = ['__proto__', 'constructor', 'prototype'];
