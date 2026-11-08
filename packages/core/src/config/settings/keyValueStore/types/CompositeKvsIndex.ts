import { KeyOf } from '../../../../types';
import { CompositeCompositeKvsIndex } from './CompositeCompositeKvsIndex';

/** An index given either as a bare partition key attribute name or in full. */
export type CompositeKvsIndex<T extends object = any> = KeyOf<T> | CompositeCompositeKvsIndex<T>;
