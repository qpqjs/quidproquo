import { ActionSearchFieldDefinition } from 'quidproquo-features';

export type ActionSearchView = {
  kind: 'action' | 'entity';

  // actionType for action views, entityType for entity views
  key: string;

  viewName: string;
  fields: ActionSearchFieldDefinition[];
};
