import { DateActionType } from '@qpqjs/core';

const coreDateActionComponentMap: Record<string, string[]> = {
  [DateActionType.Now]: ['askDateNow'],
};

export default coreDateActionComponentMap;
