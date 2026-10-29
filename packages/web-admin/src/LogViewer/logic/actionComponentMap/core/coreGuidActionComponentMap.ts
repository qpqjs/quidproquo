import { GuidActionType } from '@qpqjs/core';

const coreGuidActionComponentMap: Record<string, string[]> = {
  [GuidActionType.New]: ['askGuidNew'],
  [GuidActionType.NewSortable]: ['askGuidNewSortable'],
  [GuidActionType.NewSortableMany]: ['askGuidNewSortableMany', 'count'],
};

export default coreGuidActionComponentMap;
