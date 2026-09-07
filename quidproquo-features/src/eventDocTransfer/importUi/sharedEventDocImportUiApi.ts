import { askUIEventDocImportReset } from './actionCreators/askUIEventDocImportReset';
import { askUIEventDocImportSetError } from './actionCreators/askUIEventDocImportSetError';
import { askEventDocImportUiApply } from './logic/askEventDocImportUiApply';
import { askEventDocImportUiClear } from './logic/askEventDocImportUiClear';
import { askEventDocImportUiLoad } from './logic/askEventDocImportUiLoad';

/** The import screen verbs. A host spreads this into its runtime api and supplies the service name and file picker. */
export const sharedEventDocImportUiApi = {
  askEventDocImportUiLoad,
  askEventDocImportUiApply,
  askEventDocImportUiClear,
  askUIEventDocImportSetError,
  askUIEventDocImportReset,
};
