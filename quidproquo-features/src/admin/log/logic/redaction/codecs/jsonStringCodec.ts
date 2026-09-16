import { parseJsonContainer } from '../parseJsonContainer';
import { EncodedJsonCodec } from '../types/EncodedJsonCodec';

/** A string leaf that is itself a JSON object or array, such as a request body. */
export const jsonStringCodec: EncodedJsonCodec = {
  decode: parseJsonContainer,
  encode: (value) => JSON.stringify(value),
};
