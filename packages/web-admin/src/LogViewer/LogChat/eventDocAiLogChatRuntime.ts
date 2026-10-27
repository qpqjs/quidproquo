import { createInitialEventDocAiState, eventDocAiReducer, sharedEventDocAiApi } from 'quidproquo-features';
import { createQpqRuntimeDefinition } from 'quidproquo-web-react';

import { askEventDocAiLogChatBoot } from './logic/askEventDocAiLogChatBoot';

// Bound per log correlation (see LogChat.tsx) so each open log dialog gets its
// own isolated chat state instead of sharing one across every log. Closing the
// dialog releases the area; reopening re-runs the boot story.
export const eventDocAiLogChatRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/admin/eventDocAiLogChat',
  api: sharedEventDocAiApi,
  initialState: createInitialEventDocAiState(),
  reducer: eventDocAiReducer,
  onInit: askEventDocAiLogChatBoot,
});
