import { uniqueBy } from './uniqueBy';

/** The array with duplicate values removed, keeping the first of each (SameValueZero equality). */
export const unique = <T>(array: T[]): T[] => uniqueBy(array, (item) => item);
