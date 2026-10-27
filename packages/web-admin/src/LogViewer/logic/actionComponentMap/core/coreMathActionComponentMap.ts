import { MathActionType } from 'quidproquo-core';

const coreMathActionComponentMap: Record<string, string[]> = {
  [MathActionType.RandomNumber]: ['askRandomNumber'],
};

export default coreMathActionComponentMap;
