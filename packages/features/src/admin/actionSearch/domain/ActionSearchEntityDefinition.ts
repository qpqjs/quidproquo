import { ActionSearchActionRow } from './ActionSearchActionRow';
import { ActionSearchEntityRow } from './ActionSearchEntityRow';
import { ActionSearchFieldDefinition } from './ActionSearchFieldDefinition';

export type ActionSearchEntityDefinition = {
  entityType: string;
  viewName: string;
  fields: ActionSearchFieldDefinition[];

  // Must be order-independent: rows arrive in any order and the entity is refolded from scratch
  fold: (rows: ActionSearchActionRow[]) => Record<string, string | number | boolean>;

  // Local keys only (e.g. recipient#joe@x.com); the framework prepends `${entityType}#`
  lookupKeys: (entity: ActionSearchEntityRow) => string[];
};
