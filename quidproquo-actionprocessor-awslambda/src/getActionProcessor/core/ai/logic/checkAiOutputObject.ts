import { AiJsonSchema } from 'quidproquo-core';

import Ajv, { ErrorObject } from 'ajv';

/** The outcome of checking a model's reply against the caller's output schema. */
export type AiOutputObjectCheck = { valid: true } | { valid: false; problems: string };

// The model is not bound by the schema on every Bedrock model (several get a non-strict forced tool
// call), so the reply is checked here before it is handed back as data. Ajv because nothing in the
// platform, QPQ or zod 3 validates JSON Schema. Ajv compiles a schema into code and its regexes run
// as written, so the schema must be trusted: a caller passing one an end user wrote vets it first
// (no `pattern`/`patternProperties`, a size and depth cap).
const MAX_LISTED_PROBLEMS = 5;

// Names the stray key on an additionalProperties error, so a caller retrying the prompt can tell the
// model exactly what to drop. A key comes from the schema's own vocabulary, never a value from the reply.
const describeProblem = (error: ErrorObject): string => {
  const where = `${error.instancePath || '(root)'} ${error.message ?? 'is invalid'}`;
  return error.keyword === 'additionalProperties' ? `${where} (${String(error.params.additionalProperty)})` : where;
};

/** Checks `value` against `schema`, listing the first few mismatches when it does not fit. */
export const checkAiOutputObject = (schema: AiJsonSchema, value: unknown): AiOutputObjectCheck => {
  // A fresh instance per check: Ajv caches every schema it compiles, and each call brings a new one.
  const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);

  if (validate(value)) {
    return { valid: true };
  }

  const problems = (validate.errors ?? []).slice(0, MAX_LISTED_PROBLEMS).map(describeProblem).join('; ');

  return { valid: false, problems };
};
