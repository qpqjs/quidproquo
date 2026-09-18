declare const brandSymbol: unique symbol;

/**
 * Nominal wrapper over a structural type: `Brand<string, 'UserId'>` is a string the compiler
 * refuses to confuse with any other string. The brand exists only at the type level, so the
 * only way in is a cast; funnel construction through a guard from `createBrandGuard`.
 *
 * @example Two ids that must never be mixed up
 * ```ts
 * type UserId = Brand<string, 'UserId'>;
 * type TenantId = Brand<string, 'TenantId'>;
 *
 * const isUserId = createBrandGuard<string, UserId>((s) => s.startsWith('user_'));
 *
 * declare function getUser(id: UserId): User;
 *
 * const raw: string = request.params.id;
 * if (isUserId(raw)) {
 *   getUser(raw); // ok, raw is UserId here
 * }
 * getUser(raw);                  // error: string is not UserId
 * getUser('t_1' as TenantId);    // error: TenantId is not UserId
 * ```
 *
 * @example A validated primitive
 * ```ts
 * type Port = Brand<number, 'Port'>;
 * const isPort = createBrandGuard<number, Port>((n) => Number.isInteger(n) && n > 0 && n < 65536);
 * ```
 *
 * @example Branded values still behave as their base type
 * ```ts
 * const id: UserId = 'user_1' as UserId;
 * id.toUpperCase();              // fine, it is still a string
 * const plain: string = id;      // fine, UserId is assignable to string
 * ```
 */
export type Brand<T, B extends string> = T & { readonly [brandSymbol]: B };
