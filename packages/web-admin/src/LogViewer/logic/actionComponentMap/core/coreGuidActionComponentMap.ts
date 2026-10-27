import { GuidActionType } from '@qpqjs/core';

const coreGuidActionComponentMap: Record<string, string[]> = {
  [GuidActionType.New]: ['askNewGuid'],
  [GuidActionType.NewSortable]: ['askNewSortableGuid'],
  [GuidActionType.NewSortableMany]: ['askNewSortableGuids', 'count'],
};

export default coreGuidActionComponentMap;
