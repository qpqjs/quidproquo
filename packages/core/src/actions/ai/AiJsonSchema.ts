/**
 * A JSON Schema object describing the shape a reply must take. Plain data, so it travels in the
 * action payload and the log like any other field.
 */
export type AiJsonSchema = Record<string, unknown>;
