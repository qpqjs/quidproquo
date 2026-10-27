import {
  AiAssistantMessage,
  AiAssistantMessagePart,
  AiFilePart,
  AiMessage,
  AiToolMessage,
  AiToolResultPart,
  AiUserMessage,
  AiUserMessagePart,
  QPQBinaryData,
} from 'quidproquo-core';

import type { AssistantModelMessage, ModelMessage, ToolModelMessage, UserModelMessage } from 'ai';

export type AiDriveFileResolver = (drive: string, filepath: string, scope?: string) => Promise<QPQBinaryData>;

const mapFilePart = async (part: AiFilePart, resolveDriveFile: AiDriveFileResolver) => {
  if ('url' in part) {
    return {
      type: 'file' as const,
      data: new URL(part.url),
      mediaType: part.mediaType,
      filename: part.filename,
    };
  }

  const binary = await resolveDriveFile(part.drive, part.filepath, part.scope);

  return {
    type: 'file' as const,
    data: binary.base64Data,
    mediaType: part.mediaType,
    filename: part.filename ?? binary.filename,
  };
};

const mapUserPart = async (part: AiUserMessagePart, resolveDriveFile: AiDriveFileResolver) => {
  if (part.type === 'text') {
    return { type: 'text' as const, text: part.text };
  }

  return mapFilePart(part, resolveDriveFile);
};

const mapAssistantPart = async (part: AiAssistantMessagePart, resolveDriveFile: AiDriveFileResolver) => {
  switch (part.type) {
    case 'text':
      return { type: 'text' as const, text: part.text };
    case 'file':
      return mapFilePart(part, resolveDriveFile);
    case 'tool-call':
      return {
        type: 'tool-call' as const,
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        input: part.input,
      };
    case 'reasoning':
      return {
        type: 'reasoning' as const,
        text: part.text,
        providerOptions: part.providerOptions as never,
      };
  }
};

const mapToolResult = (part: AiToolResultPart) => {
  const output = part.isError
    ? typeof part.output === 'string'
      ? { type: 'error-text' as const, value: part.output }
      : { type: 'error-json' as const, value: part.output as never }
    : typeof part.output === 'string'
      ? { type: 'text' as const, value: part.output }
      : { type: 'json' as const, value: part.output as never };

  return {
    type: 'tool-result' as const,
    toolCallId: part.toolCallId,
    toolName: part.toolName,
    output,
  };
};

const mapUserMessage = async (message: AiUserMessage, resolveDriveFile: AiDriveFileResolver): Promise<UserModelMessage> => {
  if (typeof message.content === 'string') {
    return { role: 'user', content: message.content };
  }

  return { role: 'user', content: await Promise.all(message.content.map((part) => mapUserPart(part, resolveDriveFile))) };
};

const mapAssistantMessage = async (message: AiAssistantMessage, resolveDriveFile: AiDriveFileResolver): Promise<AssistantModelMessage> => {
  if (typeof message.content === 'string') {
    return { role: 'assistant', content: message.content };
  }

  return { role: 'assistant', content: await Promise.all(message.content.map((part) => mapAssistantPart(part, resolveDriveFile))) };
};

const mapToolMessage = (message: AiToolMessage): ToolModelMessage => ({
  role: 'tool',
  content: message.content.map(mapToolResult),
});

export const toSdkMessages = (messages: AiMessage[], resolveDriveFile: AiDriveFileResolver): Promise<ModelMessage[]> =>
  Promise.all(
    messages.map((message) => {
      switch (message.role) {
        case 'user':
          return mapUserMessage(message, resolveDriveFile);
        case 'assistant':
          return mapAssistantMessage(message, resolveDriveFile);
        case 'tool':
          return mapToolMessage(message);
      }
    }),
  );
