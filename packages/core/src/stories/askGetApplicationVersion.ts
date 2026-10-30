import { askConfigGetGlobal } from '../actions';
import { qpqApplicationVersionGlobal } from '../constants';
import { AskResponse, Nullable } from '../types';
import { askCatch } from './system/askCatch';

export function* askGetApplicationVersion(): AskResponse<Nullable<string>> {
  const version = yield* askCatch(askConfigGetGlobal<string>(qpqApplicationVersionGlobal));

  if (!version.success) {
    return null;
  }

  return version.result;
}
