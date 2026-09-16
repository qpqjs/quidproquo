import { LogRedactionParser } from '../types/LogRedactionParser';
import { encryptInputParser } from './encryptInputParser';
import { jwtParser } from './jwtParser';
import { knownKeysParser } from './knownKeysParser';
import { secretResultParser } from './secretResultParser';

/** Every parser runs, in this order, before the sweep. */
export const logRedactionParsers: readonly LogRedactionParser[] = [knownKeysParser, encryptInputParser, secretResultParser, jwtParser];
