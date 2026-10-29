import { QpqRuntimeType, StoryResult } from '@qpqjs/core';

import {
  apiGenericTextExtractor,
  AUTH_CREATE_AUTH_CHALLENGE_GenericTextExtractor,
  AUTH_DEFINE_AUTH_CHALLENGE_GenericTextExtractor,
  AUTH_VERIFY_AUTH_CHALLENGE_GenericTextExtractor,
  deployEventGenericTextExtractor,
  kvsStreamEventGenericTextExtractor,
  queueEventGenericTextExtractor,
  seoORGenericTextExtractor,
  serviceFunctionExeGenericTextExtractor,
  unknownGenericTextExtractor,
  webSocketEventGenericTextExtractor,
} from '../../genericTextExtractors';

// Which extractor turns a story result of each runtime type into its searchable tags.
export const genericTextExtractorsByRuntimeType: Record<QpqRuntimeType, (sr: StoryResult<any>) => string[]> = {
  [QpqRuntimeType.API]: apiGenericTextExtractor,
  [QpqRuntimeType.QUEUE_EVENT]: queueEventGenericTextExtractor,
  [QpqRuntimeType.SERVICE_FUNCTION_EXE]: serviceFunctionExeGenericTextExtractor,
  [QpqRuntimeType.KVS_STREAM_EVENT]: kvsStreamEventGenericTextExtractor,

  [QpqRuntimeType.RECURRING_SCHEDULE]: unknownGenericTextExtractor,
  [QpqRuntimeType.EVENT_SEO_OR]: seoORGenericTextExtractor,
  [QpqRuntimeType.EXECUTE_STORY]: unknownGenericTextExtractor,
  [QpqRuntimeType.EXECUTE_IMPLEMENTATION_STORY]: unknownGenericTextExtractor,
  [QpqRuntimeType.SEND_EMAIL_EVENT]: unknownGenericTextExtractor,

  [QpqRuntimeType.AUTH_DEFINE_AUTH_CHALLENGE]: AUTH_DEFINE_AUTH_CHALLENGE_GenericTextExtractor,
  [QpqRuntimeType.AUTH_CREATE_AUTH_CHALLENGE]: AUTH_CREATE_AUTH_CHALLENGE_GenericTextExtractor,
  [QpqRuntimeType.AUTH_VERIFY_AUTH_CHALLENGE]: AUTH_VERIFY_AUTH_CHALLENGE_GenericTextExtractor,

  [QpqRuntimeType.WEBSOCKET_EVENT]: webSocketEventGenericTextExtractor,

  [QpqRuntimeType.DEPLOY_EVENT]: deployEventGenericTextExtractor,

  [QpqRuntimeType.STORAGEDRIVE_EVENT]: unknownGenericTextExtractor,

  [QpqRuntimeType.CLOUD_FLARE_DEPLOY]: unknownGenericTextExtractor,

  [QpqRuntimeType.UI]: unknownGenericTextExtractor,
  [QpqRuntimeType.UNIT_TEST]: unknownGenericTextExtractor,
};
