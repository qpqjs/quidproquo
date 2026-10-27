import { askUIEventDocListAddItem } from './actionCreators/askUIEventDocListAddItem';
import { askUIEventDocListPageLoaded } from './actionCreators/askUIEventDocListPageLoaded';
import { askUIEventDocListSetConfig } from './actionCreators/askUIEventDocListSetConfig';
import { askUIEventDocListSetError } from './actionCreators/askUIEventDocListSetError';
import { askUIEventDocListSetLoading } from './actionCreators/askUIEventDocListSetLoading';
import { askEventDocListInit } from './logic/askEventDocListInit';
import { askEventDocListLoad } from './logic/askEventDocListLoad';
import { askEventDocListNextPage } from './logic/askEventDocListNextPage';
import { askEventDocListPreviousPage } from './logic/askEventDocListPreviousPage';
import { askEventDocListRefresh } from './logic/askEventDocListRefresh';
import { askEventDocListSetPageSize } from './logic/askEventDocListSetPageSize';

/** The generic list verbs. A host spreads this into its runtime api and adds its own init and open/create glue. */
export const sharedEventDocListApi = {
  askEventDocListInit,
  askEventDocListLoad,
  askEventDocListRefresh,
  askEventDocListNextPage,
  askEventDocListPreviousPage,
  askEventDocListSetPageSize,
  askUIEventDocListSetConfig,
  askUIEventDocListPageLoaded,
  askUIEventDocListAddItem,
  askUIEventDocListSetLoading,
  askUIEventDocListSetError,
};
