import { QpqContextIdentifier } from '../../types';

export const createContextIdentifier = <T>(uniqueName: string, defaultValue: T): QpqContextIdentifier<T> => {
  return {
    uniqueName,
    defaultValue,
  };
};
