import { KeyOf } from '../../../types';
import { KvsKey, KvsKeyType } from './types/KvsKey';

export const kvsKey = <T extends object = any>(key: KeyOf<T>, type: KvsKeyType = 'string'): KvsKey<T> => ({
  key,
  type,
});
