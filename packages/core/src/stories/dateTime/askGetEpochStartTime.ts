import { askDateNow } from '../../actions';
import { AskResponse, AskResponseReturnType } from '../../types';

export function* askGetEpochStartTime(): AskResponse<AskResponseReturnType<ReturnType<typeof askDateNow>>> {
  return '1970-01-01T00:00:00.000Z';
}
