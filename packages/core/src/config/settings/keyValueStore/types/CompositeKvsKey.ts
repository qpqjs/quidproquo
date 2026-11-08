import { KeyOf } from '../../../../types';
import { KvsKey } from './KvsKey';

/** A key given either as a bare attribute name (a string key) or in full. */
export type CompositeKvsKey<T extends object = any> = KvsKey<T> | KeyOf<T>;
