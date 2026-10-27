/**
 * Recognises a string leaf that wraps other text (base64, say). `decode` returns null when the
 * text is not in this encoding; `encode` is its inverse. The walker only treats a leaf as
 * transport-encoded when the inner text then decodes with a container codec.
 */
export type TransportCodec = {
  decode: (text: string) => string | null;
  encode: (text: string) => string;
};
