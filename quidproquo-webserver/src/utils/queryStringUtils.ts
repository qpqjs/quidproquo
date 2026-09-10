import { HttpEventQuery } from '../types/HTTPEvent';

// Parses a raw query string (with or without the leading `?`) into an HttpEventQuery: a key
// seen once is a string, a key seen more than once is a string[]. `URLSearchParams` does
// the decoding, so `+` and percent escapes come out as plain text and a key with no value
// (`?flag`) comes out as an empty string.
export const parseQueryString = (rawQueryString: string): HttpEventQuery => {
  const query: HttpEventQuery = {};

  for (const [key, value] of new URLSearchParams(rawQueryString)) {
    const existing = query[key];

    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  }

  return query;
};
