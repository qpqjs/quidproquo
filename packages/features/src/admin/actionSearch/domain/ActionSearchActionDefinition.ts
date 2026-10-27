import { ActionHistory, Nullable, StoryResult } from 'quidproquo-core';

import { ActionSearchExtractedAction } from './ActionSearchExtractedAction';
import { ActionSearchFieldDefinition } from './ActionSearchFieldDefinition';

export type ActionSearchActionDefinition = {
  actionType: string;
  viewName: string;
  fields: ActionSearchFieldDefinition[];

  // Returning null means this history entry gets no action row
  extract: (entry: ActionHistory, storyResult: StoryResult<any>, actionIndex: number) => Nullable<ActionSearchExtractedAction>;
};
