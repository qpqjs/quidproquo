/** How an EventDocLink resolves to an event of its target. Only `Latest` is resolved today; the others are modelled ahead of use. */
export enum EventDocLinkMode {
  // The target's latest event at or before the effective-at time, drafts included; no time bound for a draft render.
  Latest = 'latest',
  // The latest event within a pinned documentVersion.
  Version = 'version',
  // A single frozen event id.
  Exact = 'exact',
}
