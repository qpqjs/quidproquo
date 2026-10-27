import { DateActionType } from 'quidproquo-core';

const coreDateActionComponentMap: Record<string, string[]> = {
  [DateActionType.Now]: ['askDateNow'],
};

export default coreDateActionComponentMap;
