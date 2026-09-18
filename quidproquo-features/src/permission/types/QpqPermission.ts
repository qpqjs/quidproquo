import { Brand } from 'quidproquo-core';

/**
 * A permission key: colon-separated segments such as `case:approve` or
 * `eventDoc:templates:write`. Opaque to the mechanisms that compare it. Construct one with
 * `toQpqPermission`, or narrow a string with `isQpqPermission`.
 */
export type QpqPermission = Brand<string, 'QpqPermission'>;
