// A row in the smokeProbe store. `category` is the store's GSI partition key,
// so querying by it proves index access under the tag-conditioned grant.
// External: testa writes these rows cross-service.
export type SmokeProbeRecord = {
  probeId: string;
  category: string;
  value: number;

  // Set by the storage drive event and kvs stream handlers: what the event
  // said its scope and path/key were, and (for file events) the ambient
  // storage scope the handler ran under, so a test can prove both agree.
  scope?: string;
  ambientScope?: string;
  path?: string;
};
