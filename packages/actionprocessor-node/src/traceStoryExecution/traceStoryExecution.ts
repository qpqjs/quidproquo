// traceStoryExecution — replay a StoryResult log against real story code and record a
// line-by-line execution trace: every statement executed, with local variable values.
//
// Wraps qpqExecuteLog (deterministic replay: every impure action is answered from the
// log's history), while a worker-thread debug controller (see controllerWorker.ts)
// drives the V8 inspector against this thread and captures each statement + locals.
// Because the replay is deterministic, the recorded trace carries the same information
// an interactive debug session would. See trace-replay-plan.md.
//
// The CALLER must run on the process MAIN THREAD (lambda handlers and the dev server
// do) — inspector.Session.connectToMainThread only targets the main thread.

import { ActionProcessorList, getQpqIsoDateTimeFromDate, qpqExecuteLog, QpqExecutionTrace, StoryResult } from 'quidproquo-core';

import { Worker } from 'worker_threads';

import { TraceControllerWorkerData, traceControllerWorkerMain } from './controllerWorker';
import { filterOwnCodeLocations, resolveSourceMappedSteps } from './resolveSourceMaps';

export interface TraceStoryExecutionOptions {
  // Regex sources matched against script urls to trace IN ADDITION to the story
  // function's own script (auto-detected via [[FunctionLocation]]). Use for bundles
  // split across chunks, e.g. ['/tmp/qpq-federated-code/'].
  scriptPatterns?: string[];

  // Only break on statements whose source-mapped origin is the service's own code —
  // node_modules positions get no breakpoints, so the step/time budgets are spent
  // entirely on user statements. Scripts without a source map stay fully traced.
  onlyOwnCode?: boolean;

  // Extra own-code markers beyond the built-in "not node_modules" check — see
  // resolveSourceMaps.filterOwnCodeLocations. Only takes effect when onlyOwnCode is set.
  ownCodeMarkers?: string[];

  // Step budget and wall-clock budget: past either, the replay finishes untraced and
  // the trace is marked truncated. The wall clock is what bounds total runtime — locals
  // capture makes per-step cost variable, so step count alone doesn't bound time.
  maxSteps?: number;
  maxTraceMs?: number;

  // Serialization caps for captured locals: string length, properties per object level,
  // object walk depth for the deep json capture, and total json size per value.
  maxValueLength?: number;
  maxProperties?: number;
  maxValueDepth?: number;
  maxSerializedLength?: number;

  // Passed through to qpqExecuteLog — lets specific action types execute for real
  // instead of being answered from the log.
  overrides?: ActionProcessorList;
}

export interface TraceStoryExecutionResult {
  trace: QpqExecutionTrace;

  // The replay's own StoryResult (result/error of re-running the story)
  replay: StoryResult<any>;
}

// Ready covers domain enable + breakpoint installation across every traced chunk —
// generous because the service function running this has minutes of budget, and an
// abort here wastes a replay that would have succeeded (instrumentMs in the trace stats
// shows the real cost).
const READY_TIMEOUT_MS = 120_000;
const TRACE_TIMEOUT_MS = 60_000;

// One trace at a time per process: the controller owns process-wide debugger state
// (breakpoints, pause handling), and the story function handoff is a global.
let traceInFlight = false;

const waitForControllerMessage = (controller: Worker, type: string, timeoutMs: number): Promise<any> =>
  new Promise((resolve, reject) => {
    const cleanUp = () => {
      controller.off('message', onMessage);
      controller.off('error', onError);
      controller.off('exit', onExit);
      clearTimeout(timeout);
    };
    const onMessage = (message: any) => {
      if (message?.type === type) {
        cleanUp();
        resolve(message);
      } else if (message?.type === 'fatal') {
        cleanUp();
        reject(new Error(`trace controller failed: ${message.error}`));
      }
    };
    const onError = (error: Error) => {
      cleanUp();
      reject(error);
    };
    const onExit = (code: number) => {
      cleanUp();
      reject(new Error(`trace controller exited early with code [${code}]`));
    };
    const timeout = setTimeout(() => {
      cleanUp();
      reject(new Error(`timed out after ${timeoutMs}ms waiting for trace controller [${type}]`));
    }, timeoutMs);

    controller.on('message', onMessage);
    controller.on('error', onError);
    controller.on('exit', onExit);
  });

export const traceStoryExecution = async (
  storyResult: StoryResult<any>,
  runtime: any,
  options: TraceStoryExecutionOptions = {},
): Promise<TraceStoryExecutionResult> => {
  if (traceInFlight) {
    throw new Error('a story trace is already in progress in this process');
  }
  traceInFlight = true;

  // The controller locates the story's script through this global ([[FunctionLocation]])
  (globalThis as any).__qpqTraceStoryFunction = runtime;

  const workerData: TraceControllerWorkerData = {
    scriptPatterns: options.scriptPatterns ?? [],
    onlyOwnCode: options.onlyOwnCode ?? false,
    maxSteps: options.maxSteps ?? 20_000,
    maxTraceMs: options.maxTraceMs ?? 120_000,
    maxValueLength: options.maxValueLength ?? 1_000,
    maxProperties: options.maxProperties ?? 32,
    maxValueDepth: options.maxValueDepth ?? 4,
    maxSerializedLength: options.maxSerializedLength ?? 30_000,
  };

  // Lambdas ship as single-file webpack bundles, so the controller can't be a worker
  // FILE on disk — it's serialized and run as an eval worker (see controllerWorker.ts).
  const controller = new Worker(`(${traceControllerWorkerMain.toString()})()`, {
    eval: true,
    workerData,
  });

  // onlyOwnCode: the worker can't load trace-mapping (eval worker, builtin requires
  // only), so it round-trips candidate breakpoint locations here for source-map
  // filtering. Attached before the ready-wait — instrumentation happens during init.
  controller.on('message', (message: any) => {
    if (message?.type === 'filterLocations') {
      controller.postMessage({
        type: 'filteredLocations',
        requestId: message.requestId,
        locations: filterOwnCodeLocations(message.scriptUrl, message.locations || [], options.ownCodeMarkers),
      });
    }
  });

  try {
    await waitForControllerMessage(controller, 'ready', READY_TIMEOUT_MS);

    const replayStartedAt = Date.now();
    const replay = await qpqExecuteLog(storyResult, runtime, options.overrides);
    const replayMs = Date.now() - replayStartedAt;

    const tracePromise = waitForControllerMessage(controller, 'trace', TRACE_TIMEOUT_MS);
    controller.postMessage({ type: 'done' });
    const rawTrace = await tracePromise;

    const { sources, steps } = resolveSourceMappedSteps(rawTrace.steps, rawTrace.scripts);

    const trace: QpqExecutionTrace = {
      correlation: storyResult.correlation,
      moduleName: storyResult.moduleName,
      tracedAt: getQpqIsoDateTimeFromDate(new Date()),
      truncated: rawTrace.stats.truncated,
      sources,
      steps,
      stats: {
        pauses: rawTrace.stats.pauses,
        breakpoints: rawTrace.stats.breakpoints,
        replayMs,
        localsCaptureMs: rawTrace.stats.localsCaptureMs,
        instrumentMs: rawTrace.stats.instrumentMs,
        instrumentedScriptUrls: rawTrace.stats.instrumentedScriptUrls,
      },
    };

    return { trace, replay };
  } finally {
    delete (globalThis as any).__qpqTraceStoryFunction;
    traceInFlight = false;
    await controller.terminate();
  }
};
