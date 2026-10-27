// Best-effort logout drain: how long to wait for the flush loop to empty the
// pending buffer before the tokens are cleared anyway.
export const sessionDrainTiming = {
  pollMs: 250,
  maxPolls: 12,
};
