import { readFileSync } from 'fs';

export const readIt = (): string => readFileSync('/etc/hostname', 'utf8');
