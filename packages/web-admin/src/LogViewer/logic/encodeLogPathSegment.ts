/**
 * Percent-encodes a correlation id for use as one segment of an admin log route path. Anything that could
 * alter the request's path or query (`/`, `?`, `#`, `%`, spaces) is encoded; the `:` in `module::uuid` ids
 * stays literal because neither runtime decodes route params, so the server must see the id as minted.
 */
export const encodeLogPathSegment = (segment: string): string => encodeURIComponent(segment).replaceAll('%3A', ':');
