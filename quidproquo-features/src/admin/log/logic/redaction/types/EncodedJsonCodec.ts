/**
 * Recognises a string leaf that carries a JSON container in some encoding. `decode` returns null
 * when the text is not in this encoding or does not hold an object/array; `encode` is its inverse
 * (formatting is normalised, not preserved).
 */
export type EncodedJsonCodec = {
  decode: (text: string) => unknown;
  encode: (value: unknown) => string;
};
