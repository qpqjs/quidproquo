import { EncodedJsonCodec } from '../types/EncodedJsonCodec';

// `key=value&key2=value2`: no whitespace, no path/scheme/query characters, and no `=` inside a
// value (base64 padding would otherwise read as a form). Values may be empty and may carry
// percent-encoding or `+`.
const formPattern = /^[^\s&=?#/:]+=[^\s&=]*(&[^\s&=?#/:]+=[^\s&=]*)*$/;

type FormContainer = Record<string, string | string[]>;

const decodeForm = (text: string): unknown => {
  if (!formPattern.test(text)) {
    return null;
  }

  const container: FormContainer = {};
  for (const [key, value] of new URLSearchParams(text)) {
    const existing = container[key];
    container[key] = existing === undefined ? value : [...(Array.isArray(existing) ? existing : [existing]), value];
  }

  return container;
};

const encodeForm = (value: unknown): string => {
  const params = new URLSearchParams();
  for (const [key, entry] of Object.entries(value as FormContainer)) {
    for (const item of Array.isArray(entry) ? entry : [entry]) {
      params.append(key, String(item));
    }
  }

  return params.toString();
};

/** An `application/x-www-form-urlencoded` body, as a plain html form posts it. Repeated keys decode to an array. */
export const formUrlEncodedCodec: EncodedJsonCodec = {
  decode: decodeForm,
  encode: encodeForm,
};
