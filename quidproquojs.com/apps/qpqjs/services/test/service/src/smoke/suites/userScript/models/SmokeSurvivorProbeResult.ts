// What a later script call found at the survivor port: whether a process left behind by an
// earlier call still answers on it, and the connect outcome in words.
export type SmokeSurvivorProbeResult = {
  reachable: boolean;
  detail: string;
};
