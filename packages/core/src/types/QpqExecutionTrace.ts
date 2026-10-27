import { QpqIsoDateTime } from './QpqIsoDateTime';

// A line-by-line execution trace of a story REPLAY (see qpqExecuteLog): every statement
// the story executed, with the values of its local variables at that moment. Produced by
// quidproquo-actionprocessor-node's traceStoryExecution (worker-thread V8 inspector) and
// rendered by qpq-admin as annotated original source. See trace-replay-plan.md.

// One original source file the trace maps into. When the traced bundle shipped source
// maps with sourcesContent (the federated remote build does), `content` is the original
// TypeScript text, so a viewer can render annotated source with no access to the repo.
export interface QpqExecutionTraceSource {
  // Original source path from the source map (e.g. webpack://service/src/story.ts), or
  // the generated script's url when no map was available.
  path: string;

  content?: string;
}

// One captured variable value. `preview` is always present — a short single-line display
// string (used for inline annotations). `json` is present for object values that could be
// fully serialized: a JSON string of the value walked to the capture depth/size caps
// (strings clamped, circular refs and overflow marked with «...» placeholders), for
// expandable inspection in a viewer.
export interface QpqExecutionTraceValue {
  preview: string;
  json?: string;
}

export interface QpqExecutionTraceStep {
  // Index into QpqExecutionTrace.sources
  sourceIndex: number;

  // Position in the ORIGINAL source when a source map resolved it, otherwise in the
  // generated script. 1-based line, 0-based column (source-map convention).
  line: number;
  column: number;

  functionName: string;

  // Local + block scope variables at this statement (size-capped at capture time)
  locals: Record<string, QpqExecutionTraceValue>;

  // Present when this step paused at a function's return point: the value being
  // returned (V8 exposes it on the call frame at return break positions)
  returnValue?: QpqExecutionTraceValue;
}

export interface QpqExecutionTraceStats {
  // Total debugger pauses, including non-story pauses that were resumed through
  pauses: number;

  // Statement breakpoints set across the traced scripts
  breakpoints: number;

  // Wall time of the traced replay / time spent reading locals out of the inspector
  replayMs: number;
  localsCaptureMs: number;

  // Setup time before the replay could start (domain enable + breakpoint installation)
  instrumentMs?: number;

  // Urls of every script that received breakpoints (steps can only be recorded in
  // these) — the first thing to check when expected code is missing from a trace
  instrumentedScriptUrls?: string[];
}

export interface QpqExecutionTrace {
  // The log (StoryResult) that was replayed
  correlation: string;
  moduleName: string;

  tracedAt: QpqIsoDateTime;

  // True when the step budget was hit — the replay still ran to completion, but steps
  // beyond the budget were not recorded.
  truncated: boolean;

  sources: QpqExecutionTraceSource[];
  steps: QpqExecutionTraceStep[];

  stats: QpqExecutionTraceStats;
}
