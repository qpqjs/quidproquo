import { Brand } from '../types/Brand';

/**
 * Builds a type guard that narrows a base value to its branded type when `isValid` accepts it.
 * `const isUserId = createBrandGuard<string, UserId>((s) => s.length > 0)`.
 */
export function createBrandGuard<TBase, TBranded extends Brand<TBase, string>>(
  isValid: (value: TBase) => boolean,
): (value: TBase) => value is TBranded {
  return (value: TBase): value is TBranded => isValid(value);
}
