import { probeAws } from './probeAws';

// What infrastructure hands to defineUserScriptModule as the `smoke-probe` module: exactly
// what the smoke script's import sees.
export const smokeProbeModule = { probeAws };
