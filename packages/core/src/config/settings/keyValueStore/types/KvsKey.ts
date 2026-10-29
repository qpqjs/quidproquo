import { KeyOf } from '../../../../types';

export type KvsKeyType = 'string' | 'number' | 'binary';

export type KvsKey<T extends object = any> = {
  key: KeyOf<T>;
  type: KvsKeyType;
};
