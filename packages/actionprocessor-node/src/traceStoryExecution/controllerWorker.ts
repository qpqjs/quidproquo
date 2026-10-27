// The debug controller — runs on a WORKER THREAD and drives the V8 inspector against
// the MAIN thread, which is executing the story replay (see traceStoryExecution).
//
// Strategy (chosen by the phase-0 spike, see trace-replay-plan.md): set a breakpoint on
// every statement position of the traced scripts up front (getPossibleBreakpoints), then
// plain resume between hits. This survives the yield -> await -> reader.next() chain of
// the replay loop regardless of async task boundaries, and wastes no pauses on node
// internals (unlike blackbox + stepInto).
//
// SHIPPING CONSTRAINT: lambdas are single-file webpack bundles, so this can't be loaded
// as a worker FILE — traceStoryExecution serializes this function with
// Function.prototype.toString() and runs it via new Worker(source, { eval: true }).
// It must therefore be fully self-contained:
//   - builtin require()s only, nothing captured from module scope
//   - no syntax tsc would downlevel with module-scope helpers under the ES6 target:
//     no async/await (__awaiter), no generators (__generator), no object spread (__assign)
//
// Protocol with the parent (traceStoryExecution):
//   worker -> parent: { type: 'ready', tracedScriptUrls }   breakpoints armed, start the replay
//                     { type: 'trace', steps, scripts, stats }   reply to 'done'
//                     { type: 'filterLocations', requestId, scriptUrl, locations }   onlyOwnCode: map these through the source map
//                     { type: 'fatal', error }
//   parent -> worker: { type: 'done' }   replay finished, send the trace
//                     { type: 'filteredLocations', requestId, locations }   reply to 'filterLocations'
//
// The story function is located via globalThis.__qpqTraceStoryFunction (set by the
// parent before spawning): Runtime.evaluate -> [[FunctionLocation]] -> scriptId. Extra
// scripts (other bundle chunks, dynamically loaded ones) are matched by scriptPatterns.

export interface TraceControllerWorkerData {
  // Regex sources matched against script urls; matching scripts are traced in addition
  // to the story function's own script.
  scriptPatterns: string[];

  // Ask the parent to source-map-filter breakpoint locations so only the service's own
  // code gets breakpoints (the parent holds trace-mapping; this eval worker can't).
  onlyOwnCode: boolean;

  maxSteps: number;
  maxTraceMs: number;
  maxValueLength: number;
  maxProperties: number;
  maxValueDepth: number;
  maxSerializedLength: number;
}

interface TraceRawValue {
  preview: string;
  json?: string;
}

interface TraceRawStep {
  scriptId: string;
  line: number; // 0-based (CDP)
  column: number;
  functionName: string;
  locals: Record<string, TraceRawValue>;
  returnValue?: TraceRawValue;
}

export function traceControllerWorkerMain(): void {
  // require, not import: this function body is the ENTIRE worker source (eval mode) —
  // imports at module scope wouldn't exist when it runs. And eval('require'), not a
  // bare require: bundlers rewrite require() calls at build time (webpack lambda builds
  // turn them into __webpack_require__, which doesn't exist when this string is eval'd
  // in the worker) — eval is opaque to them, so the worker's REAL cjs require survives.
  const dynamicRequire = eval('require');
  const inspector = dynamicRequire('node:inspector');
  const workerThreads = dynamicRequire('node:worker_threads');

  const parentPort = workerThreads.parentPort;
  const options: TraceControllerWorkerData = workerThreads.workerData;

  const session = new inspector.Session();
  session.connectToMainThread();

  const post = (method: string, params?: object): Promise<any> =>
    new Promise((resolve, reject) =>
      session.post(method, params || {}, (error: Error | null, result: unknown) =>
        error ? reject(new Error(method + ': ' + error.message)) : resolve(result),
      ),
    );

  const fatal = (error: unknown): void => {
    parentPort.postMessage({ type: 'fatal', error: String((error && (error as Error).stack) || error) });
  };

  const scriptPatterns = options.scriptPatterns.map((pattern) => new RegExp(pattern));
  const scriptUrlsById = new Map<string, string>();
  const instrumentedScriptIds = new Set<string>();

  // Script end positions from scriptParsed. getPossibleBreakpoints MUST be given an
  // explicit end: with the range left open, V8 answers with an empty list once the
  // script's bytecode has been flushed by GC (functions parsed but not run for a few
  // collections), so a story loaded a while before the trace would get no breakpoints.
  const scriptEndById = new Map<string, { lineNumber: number; columnNumber: number }>();

  // The directory of the story function's own script (set during init). Bundles are
  // chunk-SPLIT: a story exported through a factory wrapper (export const x = wrap(story))
  // has its function object created in the FACTORY's chunk, while the code it runs lives
  // in sibling chunks — so every script in the same directory is traced too. This covers
  // any bundle layout (federated /tmp cache, lambda shell, dev-server dist) without
  // needing an environment-specific pattern.
  let storyScriptDirUrl = '';

  // CJS require() scripts get plain-path urls, ESM imports get file:// urls — the same
  // directory can appear both ways in one process, so compare scheme-stripped.
  const normalizeScriptUrl = (url: string): string => url.replace(/^file:\/\//, '').replace(/\\/g, '/');

  const isTraceTargetUrl = (url: string): boolean =>
    !!url && (scriptPatterns.some((pattern) => pattern.test(url)) || (!!storyScriptDirUrl && normalizeScriptUrl(url).startsWith(storyScriptDirUrl)));

  const steps: TraceRawStep[] = [];
  let pauses = 0;
  let breakpoints = 0;
  let truncated = false;
  let localsCaptureMs = 0;
  let instrumentMs = 0;
  let firstPauseAt = 0;
  let ready = false;

  // ── Value summarization ─────────────────────────────────────────────────────
  // RemoteObject -> short display string. Depth comes from generatePreview (one level);
  // the caps keep pathological values from exploding the trace.
  const clampText = (text: string): string => (text.length > options.maxValueLength ? text.slice(0, options.maxValueLength) + '…' : text);

  const summarizeValue = (remoteObject: any): string => {
    if (!remoteObject) return 'undefined';
    if (remoteObject.type === 'undefined') return 'undefined';
    if (remoteObject.subtype === 'null') return 'null';
    if (remoteObject.unserializableValue) return remoteObject.unserializableValue;
    if (remoteObject.type === 'string' || remoteObject.type === 'number' || remoteObject.type === 'boolean') {
      return clampText(JSON.stringify(remoteObject.value));
    }
    if (remoteObject.preview) {
      const parts: string[] = [];
      const previewProperties = remoteObject.preview.properties || [];
      for (let i = 0; i < previewProperties.length && i < options.maxProperties; i += 1) {
        const property = previewProperties[i];
        const value = property.type === 'string' ? "'" + property.value + "'" : property.value;
        parts.push(remoteObject.preview.subtype === 'array' ? value : property.name + ': ' + value);
      }
      const overflow = remoteObject.preview.overflow || previewProperties.length > options.maxProperties ? ', …' : '';
      const body = parts.join(', ') + overflow;
      return clampText(remoteObject.preview.subtype === 'array' ? '[' + body + ']' : '{' + body + '}');
    }
    return clampText(remoteObject.description || remoteObject.type);
  };

  // ── Deep serialization ──────────────────────────────────────────────────────
  // Runs IN THE DEBUGGEE (Runtime.callFunctionOn with `this` = the value) at the pause,
  // returning a JSON string of the value walked to the caps — what powers expandable
  // object inspection in the viewer. Property reads are try/catch'd (getters can throw);
  // circular refs and overflow become «...» placeholder strings. Same serialization
  // constraints as this whole file: no async/generators/spread (it ships via toString).
  function qpqSerializeValue(this: any, maxDepth: number, maxString: number, maxProps: number, maxTotal: number): string | null {
    const seen: any[] = [];

    const walk = (value: any, depth: number): any => {
      if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.length > maxString ? value.slice(0, maxString) + '…' : value;
      if (typeof value === 'undefined') return '«undefined»';
      if (typeof value === 'function') return '«function ' + (value.name || '') + '»';
      if (typeof value === 'bigint') return value.toString() + 'n';
      if (typeof value === 'symbol') return value.toString();

      if (value instanceof Date) return value.toISOString();
      if (value instanceof Error) return '«' + (value.name || 'Error') + ': ' + value.message + '»';
      if (value instanceof Map) return '«Map(' + value.size + ')»';
      if (value instanceof Set) return '«Set(' + value.size + ')»';

      if (depth >= maxDepth) return Array.isArray(value) ? '«array[' + value.length + ']»' : '«object»';
      if (seen.indexOf(value) >= 0) return '«circular»';
      seen.push(value);

      let result: any;
      if (Array.isArray(value)) {
        result = [];
        for (let i = 0; i < value.length && i < maxProps; i += 1) {
          try {
            result.push(walk(value[i], depth + 1));
          } catch (error) {
            result.push('«threw»');
          }
        }
        if (value.length > maxProps) result.push('«+' + (value.length - maxProps) + ' more»');
      } else {
        result = {};
        const keys = Object.keys(value);
        for (let i = 0; i < keys.length && i < maxProps; i += 1) {
          try {
            result[keys[i]] = walk(value[keys[i]], depth + 1);
          } catch (error) {
            result[keys[i]] = '«threw»';
          }
        }
        if (keys.length > maxProps) result['«more»'] = '+' + (keys.length - maxProps) + ' properties';
      }

      seen.pop();
      return result;
    };

    try {
      const json = JSON.stringify(walk(this, 0));
      return json && json.length <= maxTotal ? json : null;
    } catch (error) {
      return null;
    }
  }

  const isDeepSerializable = (remoteObject: any): boolean =>
    !!remoteObject && remoteObject.type === 'object' && remoteObject.subtype !== 'null' && !!remoteObject.objectId;

  // ── Value capture ───────────────────────────────────────────────────────────
  // Every value gets a short preview; object values also get a deep JSON serialization
  // (in the debuggee, see qpqSerializeValue). Never fails — a value that can't be
  // serialized keeps its preview.
  const captureRemoteValue = (remoteObject: any): { captured: TraceRawValue; work: Promise<unknown> } => {
    const captured: TraceRawValue = { preview: summarizeValue(remoteObject) };

    if (!isDeepSerializable(remoteObject)) {
      return { captured, work: Promise.resolve() };
    }

    const work = post('Runtime.callFunctionOn', {
      objectId: remoteObject.objectId,
      functionDeclaration: qpqSerializeValue.toString(),
      arguments: [
        { value: options.maxValueDepth },
        { value: options.maxValueLength },
        { value: options.maxProperties },
        { value: options.maxSerializedLength },
      ],
      returnByValue: true,
    }).then(
      (result: any) => {
        if (result && result.result && typeof result.result.value === 'string') {
          captured.json = result.result.value;
        }
      },
      () => undefined,
    );

    return { captured, work };
  };

  interface CapturedStepValues {
    locals: Record<string, TraceRawValue>;
    returnValue?: TraceRawValue;
  }

  // Local + block scopes only, outermost first so inner scopes win name collisions.
  // At a return break position the frame also carries the value being returned.
  const captureStepValues = (frame: any): Promise<CapturedStepValues> => {
    const startedAt = Date.now();
    const values: CapturedStepValues = { locals: {} };
    const scopes = frame.scopeChain
      .filter((scope: any) => (scope.type === 'local' || scope.type === 'block') && scope.object && scope.object.objectId)
      .reverse();

    let chain: Promise<unknown> = Promise.resolve();
    scopes.forEach((scope: any) => {
      chain = chain
        .then(() => post('Runtime.getProperties', { objectId: scope.object.objectId, ownProperties: true, generatePreview: true }))
        .then((response: any) => {
          let valueChain: Promise<unknown> = Promise.resolve();
          (response.result || []).forEach((property: any) => {
            const capture = captureRemoteValue(property.value);
            values.locals[property.name] = capture.captured;
            valueChain = valueChain.then(() => capture.work);
          });
          return valueChain;
        });
    });

    if (frame.returnValue) {
      const returnCapture = captureRemoteValue(frame.returnValue);
      values.returnValue = returnCapture.captured;
      chain = chain.then(() => returnCapture.work);
    }

    return chain.then(() => {
      localsCaptureMs += Date.now() - startedAt;
      return values;
    });
  };

  // ── Script instrumentation ──────────────────────────────────────────────────
  // onlyOwnCode: the parent (traceStoryExecution) filters candidate locations through
  // the script's source map — only positions originating in the service's own code
  // (not node_modules) get breakpoints. Round-tripped over parentPort because this
  // worker can't load the source-map library (see the shipping constraint above).
  let filterRequestSeq = 0;
  const pendingFilterRequests = new Map<number, (locations: any[]) => void>();

  const filterLocationsViaParent = (scriptId: string, locations: any[]): Promise<any[]> => {
    if (!options.onlyOwnCode || locations.length === 0) return Promise.resolve(locations);

    filterRequestSeq += 1;
    const requestId = filterRequestSeq;
    return new Promise((resolve) => {
      pendingFilterRequests.set(requestId, resolve);
      parentPort.postMessage({ type: 'filterLocations', requestId, scriptUrl: scriptUrlsById.get(scriptId) || '', locations });
    });
  };

  // getPossibleBreakpoints CAPS its response (~1000 locations) when the range is large —
  // on a real bundle chunk (tens of thousands of lines) a single call covers only the
  // top of the file and everything below it silently gets no breakpoints. Page through
  // the script, restarting just past the last returned location, until a page comes back
  // empty or stops advancing.
  const getAllPossibleBreakpoints = (scriptId: string): Promise<any[]> => {
    const allLocations: any[] = [];
    const scriptEnd = scriptEndById.get(scriptId);

    const readPage = (startLine: number, startColumn: number): Promise<any[]> =>
      post('Debugger.getPossibleBreakpoints', {
        start: { scriptId, lineNumber: startLine, columnNumber: startColumn },
        end: scriptEnd ? { scriptId, lineNumber: scriptEnd.lineNumber, columnNumber: scriptEnd.columnNumber } : undefined,
      }).then((response: any) => {
        const locations = response.locations || [];
        if (locations.length === 0) return allLocations;

        locations.forEach((location: any) => allLocations.push(location));

        const last = locations[locations.length - 1];
        const nextLine = last.lineNumber;
        const nextColumn = (last.columnNumber || 0) + 1;
        if (nextLine < startLine || (nextLine === startLine && nextColumn <= startColumn)) return allLocations;

        return readPage(nextLine, nextColumn);
      });

    return readPage(0, 0);
  };

  const instrumentScript = (scriptId: string): Promise<void> => {
    if (instrumentedScriptIds.has(scriptId)) return Promise.resolve();
    instrumentedScriptIds.add(scriptId);

    return getAllPossibleBreakpoints(scriptId)
      .then((locations: any[]) => filterLocationsViaParent(scriptId, locations))
      .then((locations: any[]) => {
        // PIPELINED, not chained: a service's chunks can hold tens of thousands of
        // statement positions, and awaiting each setBreakpoint round-trip serially made
        // instrumentation the dominant setup cost (it blew the ready timeout on real
        // services). The session queues the posts; the backend processes them in order.
        // Per-location failures are tolerated: nearby candidate positions can RESOLVE to
        // the same actual breakpoint ("already exists") — one lost position must not
        // abort the whole trace.
        return Promise.all(
          locations.map((location: any) =>
            post('Debugger.setBreakpoint', { location }).then(
              () => {
                breakpoints += 1;
              },
              () => undefined,
            ),
          ),
        ).then(() => undefined);
      });
  };

  session.on('Debugger.scriptParsed', (message: any) => {
    const url = message.params.url || '';
    scriptUrlsById.set(message.params.scriptId, url);
    scriptEndById.set(message.params.scriptId, { lineNumber: message.params.endLine, columnNumber: message.params.endColumn });

    // A traced bundle chunk loaded mid-story (async-node chunk loading) — instrument it
    // as it appears so its statements are traced too.
    if (ready && isTraceTargetUrl(url)) {
      instrumentScript(message.params.scriptId).catch(fatal);
    }
  });

  // ── Pause loop ──────────────────────────────────────────────────────────────
  const onPaused = (message: any): Promise<unknown> => {
    pauses += 1;
    if (!firstPauseAt) firstPauseAt = Date.now();
    const frame = message.params.callFrames[0];

    // Non-traced pause (e.g. the debugger; statement in qpqExecuteLog) — just resume.
    if (!instrumentedScriptIds.has(frame.location.scriptId)) {
      return post('Debugger.resume');
    }

    // Step budget AND wall-clock budget: locals capture costs several CDP round trips
    // per step, so a big story can take MINUTES against maxSteps alone — long-running
    // invocations stress their whole sandbox (a >5min trace exposed a 300s long-poll
    // timeout bug in the qpq-log-extension, killing the lambda). Past either budget,
    // stop pausing entirely so the replay finishes at full speed.
    if (steps.length >= options.maxSteps || Date.now() - firstPauseAt > options.maxTraceMs) {
      truncated = true;
      return post('Debugger.setBreakpointsActive', { active: false }).then(() => post('Debugger.resume'));
    }

    return captureStepValues(frame)
      .then((values) => {
        const step: TraceRawStep = {
          scriptId: frame.location.scriptId,
          line: frame.location.lineNumber,
          column: frame.location.columnNumber,
          functionName: frame.functionName || '',
          locals: values.locals,
        };
        if (values.returnValue) {
          step.returnValue = values.returnValue;
        }
        steps.push(step);
      })
      .then(() => post('Debugger.resume'));
  };

  session.on('Debugger.paused', (message: any) => {
    onPaused(message).catch(fatal);
  });

  // ── Parent protocol (also keeps the worker's event loop alive — an inspector
  // session alone does not, the worker would silently exit) ────────────────────
  parentPort.on('message', (message: any) => {
    if (message && message.type === 'filteredLocations') {
      const resolveFilter = pendingFilterRequests.get(message.requestId);
      if (resolveFilter) {
        pendingFilterRequests.delete(message.requestId);
        resolveFilter(message.locations || []);
      }
      return;
    }

    if (message && message.type === 'done') {
      const scripts: Record<string, string> = {};
      scriptUrlsById.forEach((url, scriptId) => {
        scripts[scriptId] = url;
      });
      const instrumentedScriptUrls: string[] = [];
      instrumentedScriptIds.forEach((scriptId) => {
        instrumentedScriptUrls.push(scriptUrlsById.get(scriptId) || scriptId);
      });
      parentPort.postMessage({
        type: 'trace',
        steps,
        scripts,
        stats: { pauses, breakpoints, localsCaptureMs, truncated, instrumentMs, instrumentedScriptUrls },
      });
    }
  });

  // ── Init: enable domains, find the story function's script, arm breakpoints ──
  const initStartedAt = Date.now();
  post('Runtime.enable')
    .then(() => post('Debugger.enable'))
    .then(() => post('Runtime.evaluate', { expression: 'globalThis.__qpqTraceStoryFunction' }))
    .then((evaluation: any) => {
      const objectId = evaluation && evaluation.result && evaluation.result.objectId;
      if (!objectId) return null;
      return post('Runtime.getProperties', { objectId, ownProperties: true }).then((response: any) => {
        const functionLocation = (response.internalProperties || []).find((property: any) => property.name === '[[FunctionLocation]]');
        const location = functionLocation && functionLocation.value && functionLocation.value.value;
        return location ? location.scriptId : null;
      });
    })
    .then((storyFunctionScriptId: string | null) => {
      const targetScriptIds = new Set<string>();
      if (storyFunctionScriptId) {
        targetScriptIds.add(storyFunctionScriptId);

        const storyScriptUrl = normalizeScriptUrl(scriptUrlsById.get(storyFunctionScriptId) || '');
        storyScriptDirUrl = storyScriptUrl.slice(0, storyScriptUrl.lastIndexOf('/') + 1);
      }

      scriptUrlsById.forEach((url, scriptId) => {
        if (isTraceTargetUrl(url)) targetScriptIds.add(scriptId);
      });

      if (targetScriptIds.size === 0) {
        throw new Error('trace controller found no scripts to trace (no story function location, no scriptPatterns match)');
      }

      const instrumentations: Promise<void>[] = [];
      targetScriptIds.forEach((scriptId) => {
        instrumentations.push(instrumentScript(scriptId));
      });
      return Promise.all(instrumentations).then(() => targetScriptIds);
    })
    .then((targetScriptIds: any) => {
      ready = true;
      instrumentMs = Date.now() - initStartedAt;
      const tracedScriptUrls: string[] = [];
      targetScriptIds.forEach((scriptId: string) => tracedScriptUrls.push(scriptUrlsById.get(scriptId) || scriptId));
      parentPort.postMessage({ type: 'ready', tracedScriptUrls });
    })
    .catch(fatal);
}
