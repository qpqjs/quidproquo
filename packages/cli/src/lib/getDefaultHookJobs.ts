import os from 'os';

/** How many package scripts a hook run starts at once: a core left for the rest of the machine, capped so a wide dependency level doesn't stack up too many npm processes. */
export const getDefaultHookJobs = (): number => Math.max(1, Math.min(8, os.availableParallelism() - 1));
