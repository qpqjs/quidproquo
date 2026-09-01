// A row in the smokeProbe store. `category` is the store's GSI partition key,
// so querying by it proves index access under the tag-conditioned grant.
// External: testa writes these rows cross-service.
export type SmokeProbeRecord = {
  probeId: string;
  category: string;
  value: number;
};
