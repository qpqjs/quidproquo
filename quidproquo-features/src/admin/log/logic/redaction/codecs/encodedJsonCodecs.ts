import { EncodedJsonCodec } from '../types/EncodedJsonCodec';
import { formUrlEncodedCodec } from './formUrlEncodedCodec';
import { jsonStringCodec } from './jsonStringCodec';

/** Every container encoding the parsers and the sweep look inside. First codec to decode a leaf wins. */
export const encodedJsonCodecs: readonly EncodedJsonCodec[] = [jsonStringCodec, formUrlEncodedCodec];
