import fs from 'fs';

// Default is any (not unknown) because every caller mutates loosely-shaped
// JSON (package.json, deploy configs) in place; forcing casts at each call
// site would add noise without safety.
export const readJsonFile = <T = any>(filePath: string): T => JSON.parse(fs.readFileSync(filePath, 'utf8'));
