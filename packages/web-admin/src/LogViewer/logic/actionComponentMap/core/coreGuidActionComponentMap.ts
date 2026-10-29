import { GuidActionType } from '@qpqjs/core';

const coreGuidActionComponentMap: Record<string, string[]> = {
  [GuidActionType.New]: ['askGuidNew'],
  [GuidActionType.NewSortable]: ['askNewSortableGuid'],
  [GuidActionType.NewSortableMany]: ['askNewSortableGuids', 'count'],
};

export default coreGuidActionComponentMap;
