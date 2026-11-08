/**
 * Validator for askFromValidJsonEventRequest: every named field must be a non-empty
 * string, otherwise it throws and the request is rejected as Invalid (422).
 */
export const requireStringFields =
  <T>(...fields: string[]) =>
  (data: unknown): T => {
    const record = (data ?? {}) as Record<string, unknown>;
    const missing = fields.filter((field) => typeof record[field] !== 'string' || record[field] === '');

    if (missing.length > 0) {
      throw new Error(`Missing or invalid fields: ${missing.join(', ')}`);
    }

    return data as T;
  };
