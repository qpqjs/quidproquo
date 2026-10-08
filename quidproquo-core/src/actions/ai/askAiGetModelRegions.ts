import { createActionRequester } from '../../types';
import { AiActionType } from './AiActionType';
import { AiModelRegionMap } from './AiModelRegionMap';

/**
 * The regions every `AiModel` is offered in on the current platform, for a picker that shows
 * where a request's data goes. The mapping is platform-owned, so a story asks for it rather than
 * hard-coding it.
 */
export const askAiGetModelRegions = createActionRequester<AiModelRegionMap>()({
  actionType: AiActionType.GetModelRegions,
});
