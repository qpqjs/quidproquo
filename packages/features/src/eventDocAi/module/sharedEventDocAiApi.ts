import { askEventDocAiLoadChats } from './logic/askEventDocAiLoadChats';
import { askEventDocAiNewChat } from './logic/askEventDocAiNewChat';
import { askEventDocAiSelectChat } from './logic/askEventDocAiSelectChat';
import { askEventDocAiSendMessage } from './logic/askEventDocAiSendMessage';

export const sharedEventDocAiApi = {
  askEventDocAiLoadChats,
  askEventDocAiNewChat,
  askEventDocAiSelectChat,
  askEventDocAiSendMessage,
};
