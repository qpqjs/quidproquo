// Anthropic rejects a conversation ending on an assistant turn when extended
// thinking is enabled (it reads as a response prefill), and a resumed turn always
// ends on the just-saved assistant message. Sent as turn context, never saved.
export const EVENT_DOC_AI_CONTINUATION_NUDGE = 'Continue the task. Your previous tool calls and their results are recorded above.';
