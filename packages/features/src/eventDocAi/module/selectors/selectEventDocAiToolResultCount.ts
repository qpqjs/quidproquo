import type { EventDocAiState } from '../EventDocAiState';

// Total completed tool uses across the finalized messages — a change signals a
// tool mutated something (e.g. the document), letting the host UI react
// (refresh).
export const selectEventDocAiToolResultCount = (state: EventDocAiState): number =>
  state.chatMessages.reduce(
    (count, message) =>
      count +
      message.segments
        .filter((segment) => segment.type === 'tool-use')
        .flatMap((segment) => segment.tools)
        .filter((tool) => tool.output !== undefined).length,
    0,
  );
