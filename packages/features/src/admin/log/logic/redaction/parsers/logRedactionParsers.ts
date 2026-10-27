import { LogRedactionParser } from '../types/LogRedactionParser';
import { basicAuthParser } from './basicAuthParser';
import { encryptInputParser } from './encryptInputParser';
import { jwtParser } from './jwtParser';
import { keyFragmentParser } from './keyFragmentParser';
import { knownKeysParser } from './knownKeysParser';
import { redactStringParser } from './redactStringParser';
import { secretResultParser } from './secretResultParser';
import { urlFragmentParser } from './urlFragmentParser';

/** Every parser runs, in this order, before the sweep. Each sees the log as the parsers before it left it. */
export const logRedactionParsers: readonly LogRedactionParser[] = [
  // Before knownKeysParser, which blanks the Authorization header this one decodes.
  basicAuthParser,
  knownKeysParser,
  keyFragmentParser,
  encryptInputParser,
  secretResultParser,
  jwtParser,
  urlFragmentParser,
  redactStringParser,
];
