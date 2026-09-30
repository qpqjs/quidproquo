import { LogRedactionParser } from '../types/LogRedactionParser';
import { encryptInputParser } from './encryptInputParser';
import { jwtParser } from './jwtParser';
import { keyFragmentParser } from './keyFragmentParser';
import { knownKeysParser } from './knownKeysParser';
import { redactStringParser } from './redactStringParser';
import { secretResultParser } from './secretResultParser';
import { urlFragmentParser } from './urlFragmentParser';

/** Every parser runs, in this order, before the sweep. */
export const logRedactionParsers: readonly LogRedactionParser[] = [
  knownKeysParser,
  keyFragmentParser,
  encryptInputParser,
  secretResultParser,
  jwtParser,
  urlFragmentParser,
  redactStringParser,
];
