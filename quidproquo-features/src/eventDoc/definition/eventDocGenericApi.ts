import { askEventDocCreateDraft } from '../actionCreators/askEventDocCreateDraft';
import { askEventDocPublish } from '../actionCreators/askEventDocPublish';
import { askEventDocSetCode } from '../actionCreators/askEventDocSetCode';
import { askEventDocSetName } from '../actionCreators/askEventDocSetName';

/** The verbs every saved event doc has. createEventDocDefinition merges them into each saved api; a domain api redefining one throws. */
export const eventDocGenericApi = {
  askEventDocSetCode,
  askEventDocSetName,
  askEventDocCreateDraft,
  askEventDocPublish,
};

/** The shape of the generic verb set. */
export type EventDocGenericApi = typeof eventDocGenericApi;
