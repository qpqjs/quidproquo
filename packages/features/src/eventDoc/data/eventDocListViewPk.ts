import { EVENT_DOC_LIST_VIEW_KEY_SEPARATOR } from '../constants/eventDocListViewKeySeparator';

/**
 * The lists store partition key for one list view of one document type. View first, so every row of a view sits in one
 * partition per type. The only place the composed form is built: nothing outside the data layer sees it.
 */
export const eventDocListViewPk = (viewName: string, type: string): string => `${viewName}${EVENT_DOC_LIST_VIEW_KEY_SEPARATOR}${type}`;
