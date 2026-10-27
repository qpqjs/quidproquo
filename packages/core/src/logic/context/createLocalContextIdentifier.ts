import { QpqContextIdentifier } from '../../types';
import { createContextIdentifier } from './createContextIdentifier';

// Like createContextIdentifier, but the provided value stays within the current
// service. It flows down the story tree and into in-process sub-runtimes, but is
// never serialized across a service boundary (queue / event bus / service function).
export const createLocalContextIdentifier = <T>(uniqueName: string, defaultValue: T): QpqContextIdentifier<T> => {
  return {
    ...createContextIdentifier(uniqueName, defaultValue),
    local: true,
  };
};
