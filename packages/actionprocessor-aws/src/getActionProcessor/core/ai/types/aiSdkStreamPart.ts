import { TextStreamPart, ToolSet } from 'ai';

export type AiSdkStreamPart = TextStreamPart<ToolSet>;

export type AiSdkStreamPartOfType<K extends AiSdkStreamPart['type']> = Extract<AiSdkStreamPart, { type: K }>;
