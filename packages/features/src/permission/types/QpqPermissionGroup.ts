import { QpqPermission } from './QpqPermission';

/** A named set of permission keys, the shape an app's vocabulary and the eventDoc generator both produce. Declare a constant with `satisfies` to keep its member names literal. */
export type QpqPermissionGroup<K extends string = string> = Record<K, QpqPermission>;
