import { askAiPromptStream, AskResponseReturnType } from '@qpqjs/core';

/** The open model stream a turn reads parts from, as askAiPromptStream resolves it. */
export type EventDocAiStreamHandle = AskResponseReturnType<ReturnType<typeof askAiPromptStream>>;
