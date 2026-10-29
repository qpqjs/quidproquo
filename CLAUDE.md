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

Releases normally go through the `release` GitHub Actions workflow (`.github/workflows/release.yml`), run by hand on main with a patch/minor/major choice: `gh workflow run release.yml -f level=minor`. On 0.x, anything breaking is a minor bump, and a patch is refused while `breaking-changes.md` has bullets under `## vNext`. `npm run go` is the local fallback (patch only).

```bash
# Version bump, build, and publish all packages (local fallback)
npm run go

# Publish all packages (after build)
npm run publish
```

### Development Server
```bash
# Run the development server
cd packages/dev-server
npm run start
```

## Architecture Overview

Quidproquo is a functional, action-based web framework built on generators and pure functions. The architecture follows a Redux-like action/processor pattern where business logic is expressed as generator functions ("stories") that yield actions, which are then processed by platform-specific implementations.

### Core Concepts

1. **Actions**: Type-safe Redux-style actions with a type and optional payload. All actions are defined in `packages/core/src/actions/`.

2. **Stories**: Generator functions that compose business logic by yielding actions and receiving results. Stories are pure functions that describe what should happen without knowing how.

3. **Action Processors**: Platform-specific implementations that execute actions. Each runtime (AWS Lambda, Node.js, browser) has its own set of processors in `@qpqjs/actionprocessor-*` packages.

4. **Runtime**: The orchestration layer that executes stories by processing yielded actions through the appropriate processors.

### Package Architecture

Every published package lives in `packages/<folder>` and is named `@qpqjs/<folder>` (`packages/core` is `@qpqjs/core`). Two keep unscoped names because people type them by hand: `quidproquo`, the umbrella that re-exports core and webserver, and `create-qpq-app`, the `npx create-qpq-app` scaffolder. A new package follows the rule; never add another exception. Action type strings keep their `@quidproquo-<package>/...` ids (`@quidproquo-core/Date/Now`): they are identifiers stored in logs and sent between services, not package names, so never rename them to match. The site's `qpqjs` app (`quidproquojs.com/apps/qpqjs`) also uses the `@qpqjs` scope for its own packages (`config`, `constants`, `service-utils`, and `<service>-<kind>` such as `admin-models`), so a new framework folder must never take one of those names.

The monorepo uses npm workspaces with these key relationships:

- **@qpqjs/core**: Defines all action types and core abstractions. Every other package depends on this.

- **@qpqjs/webserver**: Builds on core to add web-specific concepts like routes, APIs, and services.

- **@qpqjs/actionprocessor-\***: Runtime implementations that execute actions. Each targets a specific platform (AWS Lambda, Node.js, browser).

- **@qpqjs/config-aws** + **@qpqjs/deploy-aws**: Work together to define and deploy AWS infrastructure using CDK.

- **@qpqjs/web** + **@qpqjs/web-react**: Client-side utilities and React integration for building SPAs that interact with QPQ backends.

### Action Categories

Actions are organized by domain in `packages/core/src/actions/`:

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

1. **Define the action** in `packages/core/src/actions/<domain>/`
2. **Create action requester** (generator function) in the same location
3. **Implement processors** in each `@qpqjs/actionprocessor-*` package
4. **Export from index files** at each level

### TypeScript Configuration

All packages extend the base config at `packages/tsconfig/tsconfig.base.json`. Packages build dual CommonJS/ESM outputs using separate tsconfig files.

### ESLint Configuration  

Shared ESLint config at `packages/eslint-config/eslint.config.mjs` enforces consistent code style. Import sorting groups quidproquo packages separately from external dependencies.

## Writing style

When writing documentation, comments, or user-facing frontend copy (e.g. the landing page):

- **Never** use em dashes (—). Use a period, comma, colon, or parentheses instead.
- Write like a person, not an AI assistant. Avoid the tells: no "leverage/utilize/robust/seamless/delve", no rule-of-three lists piled into one sentence, no overly symmetric "it's not just X, it's Y" constructions, no forced enthusiasm. Prefer plain, direct, slightly informal phrasing over polished marketing tone.

## Code standards

All code conventions (comments, types, story and config rules, module and file layout, processors, tests, application layout) are in `docs/code-standards.md`. Read it before writing or reviewing code and cite rule ids (G1, C3, ...) in reviews. CLAUDE.md does not repeat them; if this file and that document ever disagree, the document wins.

Three rules worth restating because they bite most often:

- Every generator is `ask<Domain><Verb>` and deterministic (`askDateNow`, `askGuidNew`; never `Date.now()` or `Math.random()` in a story). Entry handlers are named after their trigger.
- Throw with `return yield* askErrorThrow(...)`; clear loading flags through `askCatch`'s finally parameter.
- `define*` returns config only and is never spread; names are derived, platform concerns live in the owning layer.

## Important Notes

- This is a monorepo using npm workspaces - always use `-w <package-name>` to target specific packages
- Tests run with vitest (`npm run test -w <package-name>`); vitest configs alias sibling qpq packages to their `src`, so no build is needed to run tests. Unit-test requesters with `captureRequester`, stories with `runStory` (mock actions by type), and state-driven logic with `askReduceState`; see the Tests section of `docs/code-standards.md`.
- The project is under active development and not production-ready
- When modifying actions, ensure changes are reflected across all action processor implementations
- The dev server in `packages/dev-server` is the primary way to test changes locally