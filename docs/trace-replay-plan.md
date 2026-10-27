# Trace Replay Plan — line-by-line execution traces from log replay

## Goal

Replay a `StoryResult` log against the federated code for that service **in the cloud**, and
produce a **trace**: every statement the story executed, in order, with the values of local
variables at each step — rendered in qpq-admin as annotated original TypeScript source:

```ts
// id = 'abcd-efg-1234'
const id = yield* askGuidNew();
```

No interactive debugger. Because replay is deterministic (`qpqExecuteLog` answers every impure
action from `history[logIndex++]`), a recorded trace carries the same information an interactive
session would — and it can be re-viewed forever in the admin UI.

## How it works (mechanism)

Node's `node:inspector` lets a process debug itself with no port and no attach step:

1. The replay lambda spawns a **worker thread** that acts as the debug controller.
2. The worker calls `inspector.Session.connectToMainThread()` and speaks Chrome DevTools
   Protocol (CDP) to the main thread.
3. The worker enables `Debugger`, and blackboxes everything **except** the federated code
   (`Debugger.setBlackboxPatterns` — traced scripts live under the federated cache dir,
   `/tmp/qpq-federated-code/<container>/<hash>/…`, so the allow-pattern is trivial).
4. The main thread runs `qpqExecuteLog(...)` as normal. The existing `debugger;` statement in
   `packages/core/src/qpqExecuteLog.ts` fires the first `Debugger.paused` event — that is the
   controller's "start tracing" signal (nice: the statement finally earns its keep in the cloud).
5. The controller then loops: `Debugger.stepInto` → on `Debugger.paused`, record
   `{scriptUrl, line, column, functionName}` from the top call frame, and capture locals with
   `Runtime.getProperties` on the frame's local scope. Blackboxing makes stepping skip
   framework/runtime code automatically, so only user story statements are recorded.
6. When the story completes (a marker function after `resolveStory` returns, with a breakpoint on
   it — or a main→worker message), the controller detaches and the trace is finalized.

Pauses are in-process CDP round trips — thousands of steps per second. A step budget
(default ~50k steps) and wall-clock budget cap runaway stories; a truncated trace is flagged, not
an error.

## Source maps — yes, and here's exactly how

CDP reports **generated** (compiled JS) positions. Source maps are applied by *us*, post-hoc —
the same way Chrome DevTools does it client-side:

- During the trace we record generated `{scriptUrl, line, column}` per step.
- After the replay, the `.map` files are sitting next to the JS in the /tmp cache (the store
  loader syncs every manifest file). Map each step with `@jridgewell/trace-mapping`
  (small, fast, no wasm) to original source + line.
- Build with `sourcesContent` included (webpack `devtool: 'source-map'` default), so the trace
  JSON can embed the **original TS source text** — qpq-admin renders the real source with zero
  access to the repo.

**⚠ Two build-side gaps discovered (must fix, both small):**

1. `getWebpackConfigForQpqRemote.ts` currently sets **`devtool: false`** — federated remotes do
   NOT emit source maps today. Flip to `'source-map'` for the remote build. The rest of the
   pipeline then Just Works: `publishFederatedRemote` includes every file in the build dir
   (only `@mf-types`/`mf-stats` are excluded), so `.map` files flow into the manifest, the
   content hash, and the lambda's /tmp sync with no changes.
2. `getWebpackBuildMode` maps environment `production` → webpack `mode: 'production'` →
   **terser mangling**. Mangled code renames locals (`id` → `e`), which wrecks
   `Runtime.getProperties` output (source-map `names` recovery is unreliable for scope locals).
   Fix: in the **remote** build only, set `optimization: { minimize: false }` (or terser with
   `mangle: false`). Remotes are not size-sensitive — they ship S3 → /tmp, not over the wire to
   browsers — and unminified code also makes generated↔original mapping much more faithful.

With those two changes, locals come out of the inspector with their real names, and source maps
are only needed for line mapping + rendering original source.

## Trace format

```jsonc
{
  "correlation": "…",              // the replayed log
  "tracedAt": "…",
  "truncated": false,
  "stats": { "steps": 1234, "wallMs": 800 },
  "sources": [                      // deduped, from sourcesContent
    { "url": "webpack://svc/src/stories/onboardUser.ts", "content": "…" }
  ],
  "steps": [
    {
      "s": 0,                       // index into sources
      "l": 47, "c": 2,              // ORIGINAL line/col (post source-map)
      "fn": "askOnboardUser",
      "locals": { "id": "'abcd-efg…'", "user": { "…": "…" } },   // depth/size-capped
      "h": 3                        // history index of the most recent action — anchors
    }                               // this step to the admin timeline/tree
  ]
}
```

Capture limits: max value depth 3, max string 1k, max props 50 per object, max visits per line
(loops) ~25 — all overridable per trace request. Gzip before storing.

## Where each piece lives

### 1. `@qpqjs/actionprocessor-node` — the tracer itself
- `traceStoryExecution(storyResult, runtime, options): Promise<QpqExecutionTrace>` —
  wraps `qpqExecuteLog`, owns the worker-thread controller, stepping loop, locals capture,
  source-map resolution, budgets. Pure node — reusable by the dev server later (same tracer,
  local).
- `QpqExecutionTrace` type in `@qpqjs/core` (types only, no node deps in core).

### 2. `@qpqjs/deploy-webpack` — build changes
- Remote build: `devtool: 'source-map'`, `optimization: { minimize: false }`.
- No changes needed in `publishFederatedRemote` or `loadFederatedStory` (verified: file
  enumeration and /tmp sync already carry arbitrary files).
- Cost note: maps roughly double store size and /tmp sync bytes. Acceptable for v1; a later
  optimization can skip `.map` files during normal load and fetch them only when a trace runs.

### 3. Cloud endpoint — run the trace in the OWNING service's lambda
Decision: the replay must run where the target service's federated store, env
(`federatedCodeStoreUrl`), and MF shared-scope singletons are already correct — i.e. **inside the
target service**, not inside the log/admin service (which would need cross-prefix S3 IAM and
risks shared-package version skew).

- Add a framework-provided **service function** (qpq already has SERVICE_FUNCTION_EXE machinery)
  exposed by every service that opts in: `traceLogExecution(storyResult) → traceStorageLocation`.
  Its implementation calls `traceStoryExecution` with the service's own `dynamicModuleLoader`,
  gzips the trace, and writes it to the service's log drive next to the log
  (`<correlation>.trace.json.gz`).
- Admin log service gets a route (`defineAdminServiceLog*Route` pattern, admin-auth):
  `POST /log/:correlation/trace` — story: load the StoryResult from log storage → call the
  owning service's `traceLogExecution` via the service-function action (routed by
  `storyResult.moduleName`) → return a signed URL for the trace.
- Timeouts: service-function lambdas aren't behind API Gateway's 29s cap; the admin route can
  either await (v1, with the step budget keeping traces to seconds) or return 202 + poll the
  trace location (upgrade path if big stories appear).

### 4. `@qpqjs/web-admin` — UI
- LogDialog: a **Trace** button beside Execute → hits the new route via the platform API URL
  (note: Execute currently hardcodes `http://localhost:8080/…`; the new button must use
  `useBaseUrlResolvers` so it works deployed).
- New **Trace tab**: render `sources[i].content` with per-line inline annotations
  (`// id = 'abcd…'`, last-write-wins per line, expandable per-visit for loops), plus a step
  scrubber. Each step's `h` index cross-links to the existing Tree/Timeline tabs.
- v1 rendering can be plain `<pre>` + gutter annotations; fancy later.

## Phases

**Phase 0 — spike ✅ DONE (see `spikes/trace-replay/`, results below)**
Standalone node script: worker `connectToMainThread`, blackbox all-but-one file, stepInto
through a generator being driven by a replay loop, capture locals, print steps/sec.
Validated: pausing on the `debugger;` statement, stepping across `yield`/`await`
resumptions, and Runtime.getProperties cost. Both strategies work; breakpoints mode wins.

**Phase 1 — build changes ✅ DONE** (deploy-webpack: `devtool: 'source-map'` +
`optimization.minimize: false` for remotes). Still to verify on a real deploy: republish a
service and confirm `.map` files land in the store and /tmp.

**Phase 2 — tracer ✅ DONE** — `traceStoryExecution` in
`packages/actionprocessor-node/src/traceStoryExecution/` + `QpqExecutionTrace` in core
types. Tests cover step/locals capture, step-budget truncation, and a real source-map
round-trip (TS transpiled at test time, steps asserted against original TS lines/content).
Implementation notes:
- The controller ships as an **eval worker** (`fn.toString()` → `new Worker(src, {eval:true})`)
  because lambdas are single-file webpack bundles with no worker files on disk. The
  controller is therefore written without async/await/generators/object-spread — the ES6
  tsc target would downlevel those with module-scope helpers that break serialization.
- Its builtin requires are `eval('require')`, not bare `require` — webpack rewrites
  require() calls to `__webpack_require__` at bundle time, which doesn't exist when the
  serialized source is eval'd in the fresh worker (bit the first real lambda deploy;
  verified fixed with a webpack production-bundle e2e).
- The story's script is auto-located via `globalThis.__qpqTraceStoryFunction` →
  `[[FunctionLocation]]`; additional chunks match `scriptPatterns` (and chunks parsed
  mid-story get instrumented on `scriptParsed`).
- One trace at a time per process (module-level guard) — debugger state is process-wide.

**Phase 3 — cloud wiring ✅ DONE**
- New core action `System::TraceStory` (`askTraceStory(storyResult, scriptPatterns?)`) —
  only node runtimes implement a processor.
- Shared processor `getSystemTraceStoryActionProcessor` in actionprocessor-node
  (loads the story via the runtime's dynamicModuleLoader — federated on lambda — then
  runs the tracer). Registered in the dev server's core processors, and in awslambda's
  system processors via a DEEP import of the tracer subtree (keeps the node package's
  Claude SDK etc. out of every lambda bundle) with a default script pattern of the
  federated code cache dir.
- `defineAdminSettings` now gives EVERY service a `qpqTraceLogExecution` service
  function (entry story in @qpqjs/features `admin/config/entry/serviceFunction/`),
  so traces run inside the service that owns the log.
- Admin log route `POST /log/{correlationId}/trace` → `logController.traceLog`: reads
  the log from the logs drive (cold-storage guarded), calls the owning service's
  function routed on `moduleName`, stores `<correlation>.trace.json` to the reports
  drive (30-day lifecycle), returns a signed url.
- Known v1 limits: the log travels as the service-function request payload and the
  trace as its response — both bounded by lambda's 6MB sync invoke limits. If real
  traces hit this, switch to drive-mediated handoff and/or gzip.

**Phase 4 — admin UI ✅ DONE**: a **Trace tab** in LogDialog (replaces the interim
bottom-bar button). Runs the trace on first open (with retry + re-run), then renders:
- annotated source from `sources[].content` — per-line `// ×N name = value` rollups
  (values a line produced, attributed via next-step locals diff, last visit wins),
- a step scrubber (slider + prev/next) with current-line highlight + auto-scroll,
  auto-following execution across source files; clicking an executed line jumps to it,
- a locals panel for the selected step, and stats chips (steps / replay ms / truncated).
Components: `LogViewer/TraceViewer/` (pure rollup logic in `traceViewerLogic.ts`,
unit tested) + `LogDialog/tabs/TraceTab/`; fetch in `LogViewer/logic/getLogTrace.ts`.

**Follow-up: compiled dependency source maps (2026-07-08)** — org libs that ship
compiled js get bundled into remotes, and without input-map chaining their traces show
tsc output instead of TS. Fixed: the remote build now runs `source-map-loader`
(enforce: pre, resolved from deploy-webpack's own deps) so dependency maps chain into
the remote's map; verified with a compiled-lib fixture e2e. REQUIREMENT on org lib
builds: emit `sourceMap: true` + `inlineSources: true` and publish the `.js.map` files —
without inlineSources (or shipped src) the lib silently stays compiled-js in traces.
Note: quidproquo framework packages build with sourceMap: false, so framework lines
that land in remote bundles (anything outside the core/webserver MF-shared singletons)
still trace as compiled js — acceptable; flip their builds to inlineSources if it ever
matters.

**Follow-up: deep locals inspection (2026-07-08)** — previews alone dead-ended at
`headers: Object`. Trace values are now `{ preview, json? }` (`QpqExecutionTraceValue`):
the controller serializes object values IN THE DEBUGGEE via `Runtime.callFunctionOn`
with a self-capping walker (depth/props/string caps, `«circular»`/`«+N more»` markers,
getter-throw safe, total json size cap — options `maxValueDepth`, `maxSerializedLength`).
Previews still power the line annotations (and change detection now compares json when
present, so nested mutations aren't missed); the locals panel renders expandable
`<details>` trees (`LocalValueTree`) in a vertically resizable pane.

**Follow-up: the 23s / 500 timeout (2026-07-08)** — root cause was the tracer's own
15s READY timeout losing to sequential breakpoint installation (one CDP call per
statement position across every federated chunk), stacked on a cold start. Fixed:
breakpoint installation is pipelined (Promise.all, both per-script and across scripts),
READY timeout raised to 120s (the service function has 14.5 min), `instrumentMs` added
to trace stats (+ a "setup" chip in the viewer) so setup cost is visible. ALSO: the
trace route now serves the STORED trace unless `?refresh=true` (hierarchies-style), so
only the first view of a log pays for tracing — Re-run forces fresh. Remaining ceiling:
the synchronous route path dies at the API lambda's 25s default / API Gateway's 29s; if
first-runs still exceed that on big services, the durable fix is the async shape
(fire-and-forget service function + a store-result callback + UI polling).

**Follow-up: framework source maps (2026-07-08)** — @qpqjs/tsconfig base now sets
`sourceMap: true` + `inlineSources: true`, so ALL framework packages ship maps with
embedded TS (verified: features' defineAdminSettings.js.map carries sourcesContent).
Requires republishing the framework for consumers to pick up.

**Follow-up: runaway traces / Extension.Crash (2026-07-08)** — a production trace ran
~5 minutes and the sandbox died at 301s (`Error Type: Extension.Crash`). CloudWatch
showed the ACTUAL crash was the qpq-log-extension: its extensions-API long-poll
(`event/next`) used `fetch`, and undici's default 300s headersTimeout aborts any poll
blocking past 5 minutes — i.e. during ANY invocation longer than that ("fatal: fetch
failed" → extension exit → lambda kills the sandbox). Latent bug for every long lambda
(15-min queue handlers included), first exposed by the unbounded trace. TWO fixes:
1. Extension long-poll rewritten to plain `http.request` (no default timeout) —
   qpqLogExtension/index.ts, layer rebuilt.
2. Tracer wall-clock budget (`maxTraceMs`, default 60s from first pause) — like the
   step budget it disables breakpoints, lets the replay finish at full speed, and marks
   the trace truncated. Default `maxSteps` also lowered 50k→10k (bounds json size too).
Operational note: route-level timeouts abort the HTTP request but the service function
keeps running — repeated retries stack concurrent multi-minute traces; budgets matter.

**Follow-up: async + websocket callback (2026-07-08)** — the synchronous route path is
dead (25/29s ceilings vs multi-minute traces). New flow:
1. `POST /log/{id}/trace` → stored trace? `{url}`. Else fire-and-forget
   `askServiceFunctionExecute(..., isAsync: true)` to the owning service → `{pending}`.
   `check=true` only reports state (never triggers — safe for polling);
   `refresh=true` forces a re-run.
2. Owning service (`qpqTraceLogExecution`) traces under `askCatch` (failures must
   notify too) and replies to the log service's new `qpqTraceStore` service function
   (payload: `QpqStoreTraceResultPayload` — trace or errorText).
3. `qpqStoreTraceResult` stores the trace on the reports drive and broadcasts a
   `TraceDone` websocket message (`askSendTraceDoneToAdmins`, clone of
   askSendLogToAdmins) to all admin connections.
4. TraceTab waits on `useSubscribeToWebSocketEvent(TraceDone)` filtered by correlation,
   with a 15s checkOnly poll as backstop (ws reconnect gaps / dev servers). Contracts
   live in webserver `services/log/config/traceLogServiceFunction.ts`.
No more HTTP-timeout coupling: the request returns instantly; the trace has the service
function's 14.5-minute budget.

**Follow-up: return values (2026-07-08)** — steps at return break positions now carry
`returnValue` (V8 exposes the value being returned on the call frame at those
positions; our every-statement breakpoints already include them — DevTools' "Return
value" mechanism). Captured with the same preview+deep-json treatment as locals.
UI: line annotations append `→ <value>` on return lines (last visit wins), and the
Watch panel pins "→ returns" above the locals for the selected step.

**Still open (future)**: step→history cross-linking to the Tree/Timeline tabs — needs
the tracer to stamp each step with the history index of the most recent replayed action
(the `h` field from the trace-format sketch), then the UI can link both ways.

## Spike results (2026-07-07, Node v20.19.6, `spikes/trace-replay/`)

Test story: generator with `yield*` delegation to sub-stories, a plain helper function, a
branch, and a 50-iteration loop — driven by a replay loop with an async boundary between every
action (microtask, and `--macrotask` via setImmediate). 52 actions, ~30 traceable statements.

| mode | story steps | stray pauses | traced time | throughput |
|---|---|---|---|---|
| step (blackbox + stepInto) | 615 | 268 (node internals) | 121ms | ~6.1k pauses/s |
| breakpoints (per-statement + resume) | 822 | 1 | 127ms | ~6.4k pauses/s |
| step, macrotask boundary | 615 | 268 | 124ms | ~6.0k |
| breakpoints, macrotask boundary | 822 | 1 | 136ms | ~6.1k |

- **Stepping DOES survive yield → await → `reader.next()` chains**, both microtask and
  macrotask boundaries. The #1 risk is retired.
- **Breakpoints mode is the winner**: more granular capture (statement positions within lines),
  essentially zero wasted pauses, same throughput, and no dependence on blackbox stepping
  semantics. Use it as the primary strategy; free-stepping is a proven backup.
- Replay result was byte-identical to an untraced baseline in all modes — tracing does not
  perturb execution.
- Locals capture (`Runtime.getProperties`, `generatePreview: true`) is ~45% of trace time.
- ~6k pauses/sec on a dev laptop → a 10k-statement story traces in ~2s. Lambda CPU will be
  slower but same order of magnitude.
- The annotated-source rendering (per-line `// name = value` from step-to-step locals diffs)
  produces exactly the target UX; see runner.js output.

**Implementation gotchas discovered (bake into the real tracer):**
1. `Debugger.paused` `callFrames[].url` is **empty** on Node 20 — resolve the script via
   `location.scriptId` against the `Debugger.scriptParsed` map.
2. The controller worker must hold its event loop open (e.g. a `parentPort.on('message')`
   listener) — an inspector session alone does not keep the worker alive; it silently exits.
3. Blackbox patterns do NOT suppress stepping pauses in some `node:` internals
  (async_hooks, node:events, inspector's own async hook) — another reason to prefer
  breakpoints mode.
4. `getPossibleBreakpoints` without `end` covers the whole script; each location gets its own
   `setBreakpoint` call (31 for the test story — trivial).

## Risks / open questions
- **Locals fidelity**: TS→JS lowering can synthesize temps and move code; unminified builds keep
  this minimal. `this`/closure scopes captured only at depth 0 (top frame, local scope) in v1.
- **Trace size** for loop-heavy stories — mitigated by per-line visit caps + gzip; surfaced in
  the UI as "N more visits truncated".
- **Security**: traces contain live variable values (potentially secrets fetched via config
  actions — though those come from the log's recorded responses, which are already stored).
  Admin-auth only, same trust boundary as the logs themselves.
- **Lambda memory/CPU**: stepping is CPU-bound; the traced service function should run at a
  decent memory size (CPU scales with memory). Config knob on the service function definition.

## Explicitly out of scope (v1)

- Interactive remote debugging (CDP-over-WebSocket bridge) — determinism makes it unnecessary.
- Browser-side replay of federated code in qpq-admin (separate idea, separate plan).
- Dev-server integration of the tracer (trivial follow-up: same `traceStoryExecution` behind the
  existing `/admin/service/log/execute` flow, no lambda needed).
