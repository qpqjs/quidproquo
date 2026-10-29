import { createServiceRequester } from '../../../webSocketQueue/logic/service';
import { askEventDocAiChatCreate } from '../../logic/askEventDocAiChatCreate';
import { eventDocAiServiceRequest } from '../../logic/eventDocAiServiceRequest';
import type { EventDocAiChatCreatePayload, EventDocAiChatSummary } from '../../models';

// Placeholder requester: serviceRequest only stores its method for
// defineServiceRequests-style map building, which defineEventDocAi bypasses
// (it keys the queue processors directly). The generics still type the handler.
const askChatCreateRequest = createServiceRequester<EventDocAiChatCreatePayload, EventDocAiChatSummary>('eventDocAi', 'ChatCreate');

export const onChatCreate = eventDocAiServiceRequest(askChatCreateRequest, askEventDocAiChatCreate);
