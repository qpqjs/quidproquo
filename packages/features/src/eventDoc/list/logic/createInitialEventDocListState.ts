import { EVENT_DOC_LIST_PAGE_SIZE } from '../constants/eventDocListPageSize';
import { EventDocListState } from '../types/EventDocListState';

/** Initial list state; the host fills the config via SetConfig. */
export const createInitialEventDocListState = (): EventDocListState => ({
  serviceName: '',
  basePath: '',
  editService: '',
  editModule: '',
  entityLabel: '',
  editBasePath: '',
  listBasePath: '',
  canTransfer: false,
  canCreate: false,
  items: [],
  isLoading: false,
  error: null,
  pageIndex: 0,
  cursors: [null],
  nextPageKey: null,
  pageSize: EVENT_DOC_LIST_PAGE_SIZE,
});
