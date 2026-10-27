import { ActionSearchFilter } from './ActionSearchFilter';

export type ListEntityRowsRequest = {
  entityType: string;
  startIsoDateTime: string;
  endIsoDateTime: string;
  filters: ActionSearchFilter[];
  nextPageKey?: string;
};
