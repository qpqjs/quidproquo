import { EventDocEffect } from '../models';
import { EventDocEventValidators } from './types/EventDocEventValidators';
import { allOf } from './validators/allOf';
import { forbidInit } from './validators/forbidInit';
import { requireDeleted } from './validators/requireDeleted';
import { requireDraft } from './validators/requireDraft';
import { requireNotDeleted } from './validators/requireNotDeleted';
import { requirePublished } from './validators/requirePublished';

/**
 * The lifecycle rules every document obeys. The '*' fallback covers every edit, so a published document rejects all but
 * CREATE_DRAFT and a deleted one all but RESTORE. DELETE deliberately skips the draft-only fallback, so a published
 * document can be deleted without branching a draft first.
 */
export const reservedEventDocEventValidators: EventDocEventValidators = {
  [EventDocEffect.InitState]: forbidInit,
  [EventDocEffect.CreateDraft]: allOf(requireNotDeleted, requirePublished),
  [EventDocEffect.Publish]: allOf(requireNotDeleted, requireDraft),
  [EventDocEffect.Delete]: requireNotDeleted,
  [EventDocEffect.Restore]: requireDeleted,
  '*': allOf(requireNotDeleted, requireDraft),
};
