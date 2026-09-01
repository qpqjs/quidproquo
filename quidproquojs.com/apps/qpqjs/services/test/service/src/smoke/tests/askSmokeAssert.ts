import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo';

// Fails the enclosing test with `message` when `condition` is false. The
// runner records the thrown error text as the test's message.
export function* askSmokeAssert(
  condition: boolean,
  message: string
): AskResponse<void> {
  if (!condition) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, message);
  }
}
