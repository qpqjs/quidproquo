import { type AiStreamPart, AiStreamPartType } from 'quidproquo-core';

import type { EventDocAiMessageSegment, EventDocAiToolUse } from '../../models';

const replaceLast = (segments: EventDocAiMessageSegment[], segment: EventDocAiMessageSegment): EventDocAiMessageSegment[] => [
  ...segments.slice(0, -1),
  segment,
];

const appendText = (segments: EventDocAiMessageSegment[], type: 'text' | 'reasoning', text: string): EventDocAiMessageSegment[] => {
  const last = segments[segments.length - 1];

  if (last && last.type === type) {
    return replaceLast(segments, { type, text: last.text + text });
  }

  return [...segments, { type, text }];
};

const appendTool = (segments: EventDocAiMessageSegment[], tool: EventDocAiToolUse): EventDocAiMessageSegment[] => {
  const last = segments[segments.length - 1];

  if (last && last.type === 'tool-use') {
    return replaceLast(segments, { type: 'tool-use', tools: [...last.tools, tool] });
  }

  return [...segments, { type: 'tool-use', tools: [tool] }];
};

// Rewrites one tool in the last tool-use segment. A missing match (a result for
// a call this fold never saw) leaves the segments untouched.
const updateLastTool = (
  segments: EventDocAiMessageSegment[],
  matches: (tool: EventDocAiToolUse) => boolean,
  update: (tool: EventDocAiToolUse) => EventDocAiToolUse,
): EventDocAiMessageSegment[] => {
  const last = segments[segments.length - 1];

  if (!last || last.type !== 'tool-use') {
    return segments;
  }

  const index = last.tools.findIndex(matches);

  if (index < 0) {
    return segments;
  }

  const tools = [...last.tools];
  tools[index] = update(tools[index]);

  return replaceLast(segments, { type: 'tool-use', tools });
};

// Pairs a call-scoped part with its tool: by call id when both sides have one,
// else the first unresolved call of that name.
const matchesCall = (toolCallId: string, toolName: string) => (tool: EventDocAiToolUse) =>
  tool.toolCallId ? tool.toolCallId === toolCallId : tool.toolName === toolName && tool.output === undefined;

/**
 * Folds one stream part into the durable segment list, returning a new list
 * (the input is never mutated, so it can run inside a state reducer). A tool
 * call surfaces at ToolInputStart, the moment the model begins writing its
 * arguments, with the input as the raw JSON accumulated so far, and is replaced
 * by the parsed input on ToolCall. Parts the segment format has no place for
 * (lifecycle markers, usage) fold to the same list.
 */
export const foldStreamPart = (segments: EventDocAiMessageSegment[], part: AiStreamPart): EventDocAiMessageSegment[] => {
  switch (part.type) {
    case AiStreamPartType.TextDelta:
      return appendText(segments, 'text', part.text);

    case AiStreamPartType.ReasoningDelta:
      return appendText(segments, 'reasoning', part.text);

    case AiStreamPartType.ToolInputStart:
      return appendTool(segments, { toolName: part.toolName, input: '', toolCallId: part.id });

    case AiStreamPartType.ToolInputDelta:
      return updateLastTool(
        segments,
        (tool) => tool.toolCallId === part.id && typeof tool.input === 'string',
        (tool) => ({ ...tool, input: `${tool.input}${part.delta}` }),
      );

    case AiStreamPartType.ToolCall: {
      const last = segments[segments.length - 1];
      const streamed = last?.type === 'tool-use' && last.tools.some((tool) => tool.toolCallId === part.toolCallId);

      if (streamed) {
        return updateLastTool(
          segments,
          (tool) => tool.toolCallId === part.toolCallId,
          (tool) => ({ ...tool, input: part.input }),
        );
      }

      // Providers that don't stream tool arguments emit ToolCall directly.
      return appendTool(segments, { toolName: part.toolName, input: part.input, toolCallId: part.toolCallId });
    }

    case AiStreamPartType.ToolResult:
      return updateLastTool(segments, matchesCall(part.toolCallId, part.toolName), (tool) => ({ ...tool, output: part.output }));

    // A thrown executor still resolves the call: fold the error in as the
    // output so the model can react to it, and so the call is not mistaken
    // for a client-side tool awaiting the user (output === undefined).
    case AiStreamPartType.ToolError:
      return updateLastTool(segments, matchesCall(part.toolCallId, part.toolName), (tool) => ({ ...tool, output: { error: part.message } }));

    default:
      return segments;
  }
};
