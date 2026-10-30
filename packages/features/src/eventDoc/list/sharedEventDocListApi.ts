import { askEventDocListAddItem } from './actionCreators/askEventDocListAddItem';
import { askEventDocListPageLoaded } from './actionCreators/askEventDocListPageLoaded';
import { askEventDocListSetConfig } from './actionCreators/askEventDocListSetConfig';
import { askEventDocListSetError } from './actionCreators/askEventDocListSetError';
import { askEventDocListSetLoading } from './actionCreators/askEventDocListSetLoading';
import { askEventDocListChangePageSize } from './logic/askEventDocListChangePageSize';
import { askEventDocListInit } from './logic/askEventDocListInit';
import { askEventDocListLoad } from './logic/askEventDocListLoad';
import { askEventDocListNextPage } from './logic/askEventDocListNextPage';
import { askEventDocListPreviousPage } from './logic/askEventDocListPreviousPage';
import { askEventDocListRefresh } from './logic/askEventDocListRefresh';

/** The generic list verbs. A host spreads this into its runtime api and adds its own init and open/create glue. */
export const sharedEventDocListApi = {
  askEventDocListInit,
  askEventDocListLoad,
  askEventDocListRefresh,
  askEventDocListNextPage,
  askEventDocListPreviousPage,
  askEventDocListChangePageSize,
  askEventDocListSetConfig,
  askEventDocListPageLoaded,
  askEventDocListAddItem,
  askEventDocListSetLoading,
  askEventDocListSetError,
};
