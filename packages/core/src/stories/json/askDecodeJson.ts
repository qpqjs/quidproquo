import { askThrowError } from '../../actions';
import { AskResponse, ErrorTypeEnum } from '../../types';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function* askDecodeJson<T>(json: string, validateObject?: (item: T) => boolean): AskResponse<T> {
  let obj: T;

  try {
    obj = JSON.parse(json) as T;
  } catch (error) {
    return yield* askThrowError(
      ErrorTypeEnum.Invalid,
      `Failed to parse JSON. Ensure the input is a valid JSON string. Error: ${getErrorMessage(error)}`,
    );
  }

  if (validateObject) {
    // Run the validator outside the parse try/catch so a throwing validator is reported as a
    // validation problem, not misreported as a JSON parse failure.
    let isValid: boolean;

    try {
      isValid = validateObject(obj);
    } catch (error) {
      return yield* askThrowError(
        ErrorTypeEnum.Invalid,
        `The provided JSON is valid, but the validation function threw an error. Error: ${getErrorMessage(error)}`,
      );
    }

    if (!isValid) {
      return yield* askThrowError(
        ErrorTypeEnum.Invalid,
        `The provided JSON is valid, but the object structure or content is invalid according to the validation function.`,
      );
    }
  }

  return obj;
}
