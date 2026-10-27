// A JSON Schema document as plain data. Kept loose on purpose: route configs are
// written out as JSON by `qpq synth`, so nothing here can hold a live validator.
export type JsonSchema = Record<string, unknown>;
