import { NeptuneGraphEntity } from './NeptuneGraphEntity';

export type NeptuneRelationshipResult = NeptuneGraphEntity & {
  '~entityType': 'relationship';
  '~start': string;
  '~end': string;
  '~type': string;
};
