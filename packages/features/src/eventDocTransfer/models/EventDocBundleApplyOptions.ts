/** How an import behaves, and who is doing it. */
export type EventDocBundleApplyOptions = {
  transferId: string;
  // Every imported event's createdBy.userId becomes this (the source id means nothing here); the display name is kept.
  importerUserId: string;
  // Discard a diverged target's tail (backed up first) and take the bundle's version. Never applies to a code conflict.
  force?: boolean;
};
