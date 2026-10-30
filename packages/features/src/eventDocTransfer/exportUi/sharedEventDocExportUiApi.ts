import { askEventDocExportReset } from './actionCreators/askEventDocExportReset';
import { askEventDocExportSetError } from './actionCreators/askEventDocExportSetError';
import { askEventDocExportToggleSelected } from './actionCreators/askEventDocExportToggleSelected';
import { askEventDocExportUiBack } from './logic/askEventDocExportUiBack';
import { askEventDocExportUiClose } from './logic/askEventDocExportUiClose';
import { askEventDocExportUiConfirm } from './logic/askEventDocExportUiConfirm';
import { askEventDocExportUiOpen } from './logic/askEventDocExportUiOpen';
import { askEventDocExportUiPreview } from './logic/askEventDocExportUiPreview';

/** The export dialog verbs. A host supplies its service name and base path and turns the returned download url into a file. */
export const sharedEventDocExportUiApi = {
  askEventDocExportUiOpen,
  askEventDocExportToggleSelected,
  askEventDocExportUiPreview,
  askEventDocExportUiBack,
  askEventDocExportUiConfirm,
  askEventDocExportUiClose,
  askEventDocExportSetError,
  askEventDocExportReset,
};
