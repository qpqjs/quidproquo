/**
 * What an event type may be: a letter, then letters, digits, '.', '_' or '-', at most 64 in all. It becomes part of a month
 * document's id and blob paths and of a FIFO group id, so '/', '#' and '~' are kept out.
 */
export const REPORT_EVENT_TYPE_PATTERN = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
