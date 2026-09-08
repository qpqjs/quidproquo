# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build Commands
```bash
# Build all packages
npm run build

# Build specific package
npm run build -w <package-name>

# Build only packages changed since the last build
npm run build:lite

# Watch specific package
npm run watch -w <package-name>

# Clean all build artifacts
npm run clean
```

### Code Quality
```bash
# Lint all packages
npm run lint

# Lint with auto-fix
npm run lint:fix

# Format code
npm run format
```

### Publishing
```bash
# Version bump, build, and publish all packages
npm run go

# Publish all packages (after build)
npm run publish
```

### Development Server
```bash
# Run the development server
cd quidproquo-dev-server
npm run start
```

## Architecture Overview

Quidproquo is a functional, action-based web framework built on generators and pure functions. The architecture follows a Redux-like action/processor pattern where business logic is expressed as generator functions ("stories") that yield actions, which are then processed by platform-specific implementations.

### Core Concepts

1. **Actions**: Type-safe Redux-style actions with a type and optional payload. All actions are defined in `quidproquo-core/src/actions/`.

2. **Stories**: Generator functions that compose business logic by yielding actions and receiving results. Stories are pure functions that describe what should happen without knowing how.

3. **Action Processors**: Platform-specific implementations that execute actions. Each runtime (AWS Lambda, Node.js, browser) has its own set of processors in `quidproquo-actionprocessor-*` packages.

4. **Runtime**: The orchestration layer that executes stories by processing yielded actions through the appropriate processors.

### Package Architecture

The monorepo uses npm workspaces with these key relationships:

- **quidproquo-core**: Defines all action types and core abstractions. Every other package depends on this.

- **quidproquo-webserver**: Builds on core to add web-specific concepts like routes, APIs, and services.

- **quidproquo-actionprocessor-\***: Runtime implementations that execute actions. Each targets a specific platform (AWS Lambda, Node.js, browser).

- **quidproquo-config-aws** + **quidproquo-deploy-awscdk**: Work together to define and deploy AWS infrastructure using CDK.

- **quidproquo-web** + **quidproquo-web-react**: Client-side utilities and React integration for building SPAs that interact with QPQ backends.

### Action Categories

Actions are organized by domain in `quidproquo-core/src/actions/`:

- **Config**: Parameters, secrets, globals
- **KeyValueStore**: DynamoDB-like operations  
- **File**: S3-like file storage
- **UserDirectory**: Authentication and user management
- **EventBus**: Pub/sub messaging
- **Queue**: Message queuing
- **WebSocket**: Real-time connections
- **Graph**: Neo4j graph database operations
- **Claude**: AI integration
- **Network**: HTTP requests
- **System**: Platform utilities

### Adding New Features

1. **Define the action** in `quidproquo-core/src/actions/<domain>/`
2. **Create action requester** (generator function) in the same location
3. **Implement processors** in each `quidproquo-actionprocessor-*` package
4. **Export from index files** at each level

### TypeScript Configuration

All packages extend the base config at `quidproquo-tsconfig/tsconfig.base.json`. Packages build dual CommonJS/ESM outputs using separate tsconfig files.

### ESLint Configuration  

Shared ESLint config at `quidproquo-eslint-config/eslint.config.mjs` enforces consistent code style. Import sorting groups quidproquo packages separately from external dependencies.

## Writing style

When writing documentation, comments, or user-facing frontend copy (e.g. the landing page):

- **Never** use em dashes (—). Use a period, comma, colon, or parentheses instead.
- Write like a person, not an AI assistant. Avoid the tells: no "leverage/utilize/robust/seamless/delve", no rule-of-three lists piled into one sentence, no overly symmetric "it's not just X, it's Y" constructions, no forced enthusiasm. Prefer plain, direct, slightly informal phrasing over polished marketing tone.
- **Comments must not cross-pollute between packages.** A comment explains its own package's concern in its own package's terms. Platform-agnostic packages (`quidproquo-core`, `quidproquo-webserver`, `quidproquo-web`, ...) never mention AWS, API Gateway, Lambda, CloudFront, express, or any other runtime: define the shape the framework wants and describe it on its own terms. The platform-specific package (`quidproquo-actionprocessor-*`, `quidproquo-deploy-awscdk`, `quidproquo-dev-server`) is where the conversion to and from that platform's shape lives, and that is the only place a comment about the platform belongs.

## Code style

- **No non-trivial logic inline as a call argument.** If an arrow function passed as an argument needs a `try`/`catch`, an `if` beyond a single guard clause, or more than ~2 lines of body, pull it out into a named `const` (or top-level function) above the call site, with a comment explaining *why*, and pass the name instead. This applies especially inside object/array literals and spread expressions (e.g. `{ ...(await getX(y, inlineCallbackHere)) }`), where an inline multi-line callback breaks the scan-ability of the surrounding list and buries the actual logic. A named function you can read top-to-bottom, separate from the plumbing that wires it in, is worth the extra top-level declaration.
- **Prefer `type` over `interface`.** Use `type` aliases for all type definitions (props, payloads, results, state). Only use `interface` when extending or declaration merging is explicitly needed.
- **Prefer `unknown` over `any`.** Use `unknown` for values of uncertain type and narrow with type guards. `any` is acceptable only at variance boundaries (e.g. a slot-config union whose reducer state params are contravariant) or third-party APIs that require it, with a comment saying why.
- **Prefer `Nullable<T>` over hand-written `| null` / `| undefined` unions** for a value or return that may be absent (`Nullable` is in `quidproquo-core`); return `null`. Optional object properties (`field?: T`) are still fine.

## Story conventions

- **Every QPQ generator (story) is named `ask…`** (`askNounVerb`, where Noun is the domain), matching the requester style (`askFileExists`, `askKeyValueStoreUpdate`). Pure (non-generator) helpers stay camelCase verbNoun. The eslint config enforces the reverse too: the `ask` prefix is reserved for generators.
- **Story code must be deterministic.** Never `Date.now()`, `Math.random()`, or `crypto.randomUUID()` inside a story or the logic it calls; yield `askDateNow()` / `askNewGuid()` instead so logs replay and tests stay deterministic.
- **Throw with `return yield* askThrowError(...)`.** It infers the enclosing return type and tells TypeScript control stops there, which narrows values checked above it. Never work around the checker with a dummy trailing return or an `as` cast after a throw.
- **Guarantee cleanup with `askCatch`'s finally parameter.** `yield* askCatch(askDoWork(), askUISetLoading(false))` runs the second story on success or failure, so loading state can't get stuck.
- **Optimistic updates roll back on failure.** Dispatch the UI effect first, `askCatch` the backend call, and dispatch the reverse effect if it failed.
- **Context values must be serializable.** Never put functions or generators on a QPQ context; inject capabilities as factory-closure params instead. Config that must not cross a service boundary uses `createLocalContextIdentifier` (stays in `localContext`, never serialized out) rather than `createContextIdentifier`.

## Config conventions

- **`define*` is reserved for config.** A `define*` helper returns `QPQConfigSetting`s (or a `QPQConfig` array) only. Helpers that instantiate live objects (reducers, apis, CDK constructs) are `create*` / `build*`.
- **Never spread `define*` results.** QPQ flattens nested config arrays recursively, so a helper that returns an array goes into the config as a plain element; a `...spread` is redundant and breaks the convention.
- **Platform-specific config lives in the owning layer.** Web concerns (CORS, domains) belong in quidproquo-webserver settings, AWS-only concerns in quidproquo-config-aws, each keyed by the core resource name and resolved at deploy. Never add platform fields to a core `define*`.
- **Derive resource names.** No `xName?: string` override fields on config settings; derive names from accountId/region/config.

## Module & file structure

State-modules (a feature in `quidproquo-features` with frontend state, or any shared state module) follow this layout, one concern per folder:

| Folder | Purpose |
|---|---|
| `types/` | Module types, ONE type per file, file named after the type. A type and its `createInitial*` function share a file; a shared base type gets its own file that both variants import |
| `models/` | Domain models shared across layers or with consumers |
| `effects/` | `[Module]Effect.ts` = the effect enum. One file PER effect (`[Module]SetLoadingEffect.ts`) exporting the payload type (`[Module]SetLoadingPayload`) and the `Effect<...>` type. `[Module]Effects.ts` = the union of all of them, nothing else |
| `actionCreators/` | One `askUI*` generator per file, dispatching its effect via `askStateDispatchEffect` |
| `stateUpdaters/` | One pure `(state, payload) => state` transform per file, importing its payload type from the effect's file; wired by `buildEffectReducer`. Shared helpers (e.g. `updateSlotState`) get their own file |
| `logic/` | One story or pure helper per file |
| `selectors/` | One `select<Module><Thing>` function per file (parameterized selector factories are `create<Thing>Selector`) |
| `constants/` | One named constant per file (store names, reserved lists, stable sentinel values); never inline these strings at call sites |

The api surface file (`shared[Module]Api.ts` or `[module]Api.ts`) only composes: it imports verbs from `logic/`/`actionCreators/` and exports the object. Verbs are never declared inside it.

**Event-doc modules use the SAME shape.** An event-doc event is a special kind of effect
(`Effect<type, data>`): declare the enum + per-effect Payload/Effect files in `effects/`
exactly as above; action creators dispatch with `askApplyEventDocEvent<TheEffect>(enum.member,
{ ...payload })` (typed like `askStateDispatchEffect`); the fold reducer consumes
`EventDocFoldEffects<TheEffectsUnion>` (which wraps each payload in the stored event's
`EventDocEventPayload`), cast to `QpqReducer<TView, EventDocEvent>` at the registration
boundary, and its handlers live in `stateUpdaters/` (one per file, taking
`(state, payload: EventDocEventPayload<ThePayload>)`) — never inlined in the reducer.
Logic stories call the action creators, never inline `askApplyEventDocEvent`.
The workspace chrome slot (`eventDoc/workspace/chrome/`) is the canonical example.

Backend-only features (routes + logic) use the same idea with `actions/`, `routes/`, `config/`, `data/` folders as needed (see `eventDoc`).

- **One exported thing per file, file named after it.** Two exports are acceptable only when they are one concept (a type + its `createInitial*`, an effect + its payload type). If a second consumer imports just one of a file's exports, that export belongs in its own file.
- **Every directory has an `index.ts` barrel.** Barrels are the surface for consumers outside the folder. Within a module, import specific files (`../actionCreators/askUISetError`), not a barrel that might transitively include the importing file; that is how circular imports start. Importing another subtree's leaf barrel (`../../models`) is established practice and fine.
- **No re-export shims.** A value lives in exactly one place. When something moves, repoint every call site and delete the original; never leave `export { X } from '<old-home>'` behind. (A package's own barrel re-exporting its own files is not a shim.)
- **Cross-layer shapes are named models.** If a typed value flows between two or more files/layers, give it a name in `models/` (or `types/`); never re-declare `{ url: string; filename: string }` inline in multiple places.

## Important Notes

- This is a monorepo using npm workspaces - always use `-w <package-name>` to target specific packages
- Tests run with vitest (`npm run test -w <package-name>`); vitest configs alias sibling qpq packages to their `src`, so no build is needed to run tests. Unit-test stories with `runStory` from `quidproquo-core/src/testing` (mock actions by type), and state-driven logic with `askReduceState`.
- The project is under active development and not production-ready
- When modifying actions, ensure changes are reflected across all action processor implementations
- The dev server in `quidproquo-dev-server` is the primary way to test changes locally