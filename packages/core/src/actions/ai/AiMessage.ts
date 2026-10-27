export interface AiTextPart {
  type: 'text';
  text: string;
}

export interface AiFileUrlPart {
  type: 'file';
  url: string;
  mediaType: string;
  filename?: string;
}

// References a file on a storage drive — resolved to file contents by the action
// processor at prompt time, so no presigned url ever enters logs or session state.
export interface AiFileDrivePart {
  type: 'file';
  drive: string;
  filepath: string;
  // Storage scope the file lives under, for scoped drives. Forwarded to the
  // file read at resolve time; omit for unscoped drives.
  scope?: string;
  mediaType: string;
  filename?: string;
}

export type AiFilePart = AiFileUrlPart | AiFileDrivePart;

export interface AiToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  input: unknown;
}

export interface AiReasoningPart {
  type: 'reasoning';
  text: string;
  providerOptions?: Record<string, Record<string, unknown>>;
}

export interface AiToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  output: unknown;
  isError?: boolean;
}

export type AiUserMessagePart = AiTextPart | AiFilePart;
export type AiAssistantMessagePart = AiTextPart | AiFilePart | AiToolCallPart | AiReasoningPart;

export type AiUserMessage = {
  role: 'user';
  content: string | AiUserMessagePart[];
};

export type AiAssistantMessage = {
  role: 'assistant';
  content: string | AiAssistantMessagePart[];
};

export type AiToolMessage = {
  role: 'tool';
  content: AiToolResultPart[];
};

export type AiMessage = AiUserMessage | AiAssistantMessage | AiToolMessage;
