import { GuidActionType } from '@qpqjs/core';

const coreGuidActionComponentMap: Record<string, string[]> = {
  [GuidActionType.New]: ['askGuidNew'],
  [GuidActionType.NewSortable]: ['askGuidNewSortable'],
  [GuidActionType.NewSortableMany]: ['askNewSortableGuids', 'count'],
};

export default coreGuidActionComponentMap;
