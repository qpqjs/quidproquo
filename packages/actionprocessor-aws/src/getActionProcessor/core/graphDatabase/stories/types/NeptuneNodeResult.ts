import { NeptuneGraphEntity } from './NeptuneGraphEntity';

export type NeptuneNodeResult = NeptuneGraphEntity & {
  '~entityType': 'node';
  '~labels': string[];
};
