import { probeAws } from './probeAws';
import { probeSurvivor } from './probeSurvivor';
import { spawnSurvivor } from './spawnSurvivor';

// What infrastructure hands to defineUserScriptModule as the `smoke-probe` module: exactly
// what the smoke script's import sees.
export const smokeProbeModule = { probeAws, probeSurvivor, spawnSurvivor };
