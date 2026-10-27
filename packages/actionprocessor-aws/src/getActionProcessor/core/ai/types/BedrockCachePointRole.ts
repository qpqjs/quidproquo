/** Where a cache point sits in the request; the dynamic lifetime policy keys off it. */
export enum BedrockCachePointRole {
  System = 'system',
  Anchor = 'anchor',
  Tail = 'tail',
}
