import { ActionSearchFilter } from './ActionSearchFilter';

export type ListActionRowsRequest = {
  actionType: string;
  startIsoDateTime: string;
  endIsoDateTime: string;
  filters: ActionSearchFilter[];
  nextPageKey?: string;
};
