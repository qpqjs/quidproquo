/**
 * Discriminator for every part that can appear in an AI prompt stream.
 *
 * Lifecycle order, broadly:
 *   Start → (StartStep → step events → FinishStep)+ → Finish
 *
 * Within a step, text / reasoning / tool-input events come in matched
 * start → delta… → end triples sharing the same `id`.
 */
export enum AiStreamPartType {
  /** Emitted once before any other parts — the overall response is starting. */
  Start = 'start',

  /** Emitted once at the very end — overall response is complete, with aggregate usage. */
  Finish = 'finish',

  /** A single generation step (one round-trip to the model) has started. */
  StartStep = 'start-step',

  /** The current generation step ended, with the step's finish reason and usage. */
  FinishStep = 'finish-step',

  /** The stream was aborted (e.g. abort signal, client disconnect). */
  Abort = 'abort',

  /** A non-fatal streaming error. `streamText` swallows errors by default; this surfaces them. */
  Error = 'error',

  /** A provider-specific raw chunk — passed through for debugging or custom handling. */
  Raw = 'raw',

  /** The model cited a source (URL or document) — used for grounded / RAG-style responses. */
  Source = 'source',

  /** The model produced a file artifact (e.g. generated image). */
  File = 'file',

  /** The model produced a reasoning file artifact (e.g. an encrypted reasoning trace). */
  ReasoningFile = 'reasoning-file',

  /** A provider-specific custom event — identified by `kind`, with no higher-level mapping. */
  Custom = 'custom',

  /** Beginning of a contiguous text block. Pair with `TextEnd` via shared `id`. */
  TextStart = 'text-start',

  /** End of the text block opened by a matching `TextStart`. */
  TextEnd = 'text-end',

  /** An incremental chunk of text inside the currently open text block. */
  TextDelta = 'text-delta',

  /** Beginning of a model reasoning / "thinking" block (extended-thinking models). */
  ReasoningStart = 'reasoning-start',

  /** End of the reasoning block opened by a matching `ReasoningStart`. */
  ReasoningEnd = 'reasoning-end',

  /** An incremental chunk of reasoning text inside the currently open reasoning block. */
  ReasoningDelta = 'reasoning-delta',

  /** The model has begun streaming arguments for a tool call. */
  ToolInputStart = 'tool-input-start',

  /** The model has finished streaming arguments for the tool call. */
  ToolInputEnd = 'tool-input-end',

  /** An incremental chunk of the (JSON) tool-call arguments. */
  ToolInputDelta = 'tool-input-delta',

  /** A fully-assembled tool call — arguments are complete and parsed. */
  ToolCall = 'tool-call',

  /** A tool finished executing successfully. Includes the original `input` and the `output`. */
  ToolResult = 'tool-result',

  /** A tool threw while executing. `message` carries the stringified error. */
  ToolError = 'tool-error',

  /** The caller denied executing the tool after an approval request. */
  ToolOutputDenied = 'tool-output-denied',

  /** The model is requesting permission to execute a tool — awaiting approve/deny. */
  ToolApprovalRequest = 'tool-approval-request',

  /** The approve/deny decision for a prior {@link ToolApprovalRequest}. */
  ToolApprovalResponse = 'tool-approval-response',
}
