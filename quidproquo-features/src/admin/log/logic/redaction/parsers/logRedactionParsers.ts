import { LogRedactionParser } from '../types/LogRedactionParser';
import { encryptInputParser } from './encryptInputParser';
import { jwtParser } from './jwtParser';
import { knownKeysParser } from './knownKeysParser';

/** Every parser runs, in this order, before the sweep. */
export const logRedactionParsers: readonly LogRedactionParser[] = [knownKeysParser, encryptInputParser, jwtParser];
