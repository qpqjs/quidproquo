import {
  askCatch,
  askContextProvideValue,
  askContextRead,
  askOverrideActions,
  AskResponse,
  askRunParallel,
  createContextIdentifier,
  createLocalContextIdentifier,
  getSuccessfulEitherActionResultIfRequired,
} from 'quidproquo-core';

import { boundary, echo, ECHO_ACTION, FAIL_ACTION, failLeaf } from './runtime';

// ─── Composition spec ─────────────────────────────────────────────────────────────
//
// A spec is a small tree of control-flow primitives. `buildStory` turns it into a real
// qpq story; `evaluate` is an independent oracle that computes the intended outcome from
// the same tree under a context state (global + local bags) and an override stack. The
// matrices assert that the real runtime's result matches the oracle for every generated
// tree; any mismatch is a finding.
//
//   ok / fail        leaves that succeed with a value / fail with an error
//   read(scope,key)  reads a context value (nearest provider of that scope wins, else default)
//   provide(scope)   provides a value for `key` in the global or local bag to its child
//   override(target) intercepts matching leaf actions ('ok' = echo, 'fail' = failing, '*' = any)
//   boundary         crosses a service boundary: local context is stripped, global survives
//   catch / parallel askCatch / askRunParallel

export type OverrideTarget = 'ok' | 'fail' | '*';
export type ContextScope = 'global' | 'local';

export type Spec =
  | { kind: 'ok' }
  | { kind: 'fail' }
  | { kind: 'read'; scope: ContextScope; key: string }
  | { kind: 'provide'; scope: ContextScope; key: string; child: Spec }
  | { kind: 'override'; target: OverrideTarget; child: Spec }
  | { kind: 'boundary'; child: Spec }
  | { kind: 'catch'; child: Spec }
  | { kind: 'parallel'; children: Spec[] };

export type IdSpec =
  | { kind: 'ok'; id: number }
  | { kind: 'fail'; id: number }
  | { kind: 'read'; scope: ContextScope; key: string }
  | { kind: 'provide'; scope: ContextScope; key: string; id: number; child: IdSpec }
  | { kind: 'override'; target: OverrideTarget; id: number; child: IdSpec }
  | { kind: 'boundary'; child: IdSpec }
  | { kind: 'catch'; child: IdSpec }
  | { kind: 'parallel'; children: IdSpec[] };

export const okValue = (id: number): string => `v${id}`;
export const failError = (id: number): string => `e${id}`;
export const provideValue = (key: string, id: number): string => `ctx:${key}#${id}`;
export const contextDefault = (key: string): string => `default:${key}`;
export const overrideValue = (id: number): string => `ov${id}`;

const identifierFor = (scope: ContextScope, key: string) =>
  scope === 'local' ? createLocalContextIdentifier<string>(key, contextDefault(key)) : createContextIdentifier<string>(key, contextDefault(key));
const actionTypeFor = (target: OverrideTarget): string => (target === 'ok' ? ECHO_ACTION : target === 'fail' ? FAIL_ACTION : '*');

export const assignIds = (spec: Spec): IdSpec => {
  let next = 0;
  const walk = (node: Spec): IdSpec => {
    switch (node.kind) {
      case 'ok':
      case 'fail':
        return { kind: node.kind, id: next++ };
      case 'read':
        return { kind: 'read', scope: node.scope, key: node.key };
      case 'provide':
        return { kind: 'provide', scope: node.scope, key: node.key, id: next++, child: walk(node.child) };
      case 'override':
        return { kind: 'override', target: node.target, id: next++, child: walk(node.child) };
      case 'boundary':
        return { kind: 'boundary', child: walk(node.child) };
      case 'catch':
        return { kind: 'catch', child: walk(node.child) };
      case 'parallel':
        return { kind: 'parallel', children: node.children.map(walk) };
    }
  };
  return walk(spec);
};

export const buildStory = (spec: IdSpec): AskResponse<any> => {
  switch (spec.kind) {
    case 'ok':
      return echo(okValue(spec.id));
    case 'fail':
      return failLeaf(failError(spec.id));
    case 'read':
      return askContextRead(identifierFor(spec.scope, spec.key));
    case 'provide':
      return (function* () {
        return yield* askContextProvideValue(identifierFor(spec.scope, spec.key), provideValue(spec.key, spec.id), buildStory(spec.child));
      })();
    case 'override':
      return (function* () {
        // A handler returning its own value must shape it for returnErrors (the documented contract).
        const handler = function* (action: any) {
          return getSuccessfulEitherActionResultIfRequired(overrideValue(spec.id), action.returnErrors);
        };
        return yield* askOverrideActions(buildStory(spec.child), { [actionTypeFor(spec.target)]: handler });
      })();
    case 'boundary':
      return boundary(() => buildStory(spec.child));
    case 'catch':
      return (function* () {
        return yield* askCatch(buildStory(spec.child));
      })();
    case 'parallel':
      return (function* () {
        return yield* askRunParallel(spec.children.map(buildStory));
      })();
  }
};

export type Outcome = { ok: true; value: any } | { ok: false; error: string };

type OverrideFrame = {
  target: OverrideTarget;
  id: number;
};

type ContextState = {
  global: Record<string, string>;
  local: Record<string, string>;
};

const nearestOverride = (overrides: OverrideFrame[], leafKind: 'ok' | 'fail'): OverrideFrame | undefined => {
  for (let i = overrides.length - 1; i >= 0; i--) {
    if (overrides[i].target === '*' || overrides[i].target === leafKind) {
      return overrides[i];
    }
  }
  return undefined;
};

const emptyContext = (): ContextState => ({ global: {}, local: {} });

// The intended contract, computed independently of the runtime machinery.
export const evaluate = (spec: IdSpec, context: ContextState = emptyContext(), overrides: OverrideFrame[] = []): Outcome => {
  switch (spec.kind) {
    case 'ok': {
      const ov = nearestOverride(overrides, 'ok');
      return { ok: true, value: ov ? overrideValue(ov.id) : okValue(spec.id) };
    }
    case 'fail': {
      const ov = nearestOverride(overrides, 'fail');
      // An override that intercepts the failing action's type suppresses the failure.
      return ov ? { ok: true, value: overrideValue(ov.id) } : { ok: false, error: failError(spec.id) };
    }
    case 'read': {
      const bag = context[spec.scope];
      return { ok: true, value: spec.key in bag ? bag[spec.key] : contextDefault(spec.key) };
    }
    case 'provide':
      return evaluate(spec.child, { ...context, [spec.scope]: { ...context[spec.scope], [spec.key]: provideValue(spec.key, spec.id) } }, overrides);
    case 'override':
      return evaluate(spec.child, context, [...overrides, { target: spec.target, id: spec.id }]);
    case 'boundary':
      // Crossing a service boundary strips local context (and the in-process override stack);
      // global context survives.
      return evaluate(spec.child, { global: context.global, local: {} }, []);
    case 'catch': {
      const inner = evaluate(spec.child, context, overrides);
      return {
        ok: true,
        value: inner.ok ? { success: true, result: inner.value } : { success: false, error: { errorType: inner.error, errorText: inner.error } },
      };
    }
    case 'parallel': {
      const outcomes = spec.children.map((c) => evaluate(c, context, overrides));
      const firstFailure = outcomes.find((o): o is { ok: false; error: string } => !o.ok);
      if (firstFailure) {
        return firstFailure;
      }
      return { ok: true, value: outcomes.map((o) => (o as { ok: true; value: any }).value) };
    }
  }
};

export const show = (spec: Spec): string => {
  switch (spec.kind) {
    case 'ok':
      return 'ok';
    case 'fail':
      return 'FAIL';
    case 'read':
      return spec.scope === 'local' ? `readL(${spec.key})` : `read(${spec.key})`;
    case 'provide':
      return spec.scope === 'local' ? `provideL(${spec.key},${show(spec.child)})` : `provide(${spec.key},${show(spec.child)})`;
    case 'override':
      return `override(${spec.target},${show(spec.child)})`;
    case 'boundary':
      return `boundary(${show(spec.child)})`;
    case 'catch':
      return `catch(${show(spec.child)})`;
    case 'parallel':
      return `par(${spec.children.map(show).join(',')})`;
  }
};

const subtrees = (depth: number, leaves: Spec[], wrap: (sub: Spec[]) => Spec[]): Spec[] => {
  if (depth === 0) {
    return leaves;
  }
  const sub = subtrees(depth - 1, leaves, wrap);
  const parallels: Spec[] = [];
  for (const a of sub) {
    for (const b of sub) {
      parallels.push({ kind: 'parallel', children: [a, b] });
    }
  }
  const catches: Spec[] = sub.map((child) => ({ kind: 'catch', child }));
  return [...leaves, ...catches, ...parallels, ...wrap(sub)];
};

// askCatch + askRunParallel + ok/fail leaves.
export const generateError = (depth: number): Spec[] => subtrees(depth, [{ kind: 'ok' }, { kind: 'fail' }], () => []);

// read/provide (global) over two keys, wrapped in catch/parallel.
export const generateContext = (depth: number, keys: string[] = ['k1', 'k2']): Spec[] =>
  subtrees(
    depth,
    keys.map((key): Spec => ({ kind: 'read', scope: 'global', key })),
    (sub) => keys.flatMap((key) => sub.map((child): Spec => ({ kind: 'provide', scope: 'global', key, child }))),
  );

// override (by leaf type or wildcard) over ok/fail leaves, wrapped in catch/parallel.
export const generateOverride = (depth: number): Spec[] =>
  subtrees(depth, [{ kind: 'ok' }, { kind: 'fail' }], (sub) =>
    (['ok', 'fail', '*'] as OverrideTarget[]).flatMap((target) => sub.map((child): Spec => ({ kind: 'override', target, child }))),
  );

// Everything together: ok/fail/read leaves under provide + override + catch + parallel.
// Override targets leaf types only (not the wildcard, which would also intercept reads).
export const generateCombined = (depth: number, keys: string[] = ['k1', 'k2']): Spec[] =>
  subtrees(depth, [{ kind: 'ok' }, { kind: 'fail' }, ...keys.map((key): Spec => ({ kind: 'read', scope: 'global', key }))], (sub) => [
    ...keys.flatMap((key) => sub.map((child): Spec => ({ kind: 'provide', scope: 'global', key, child }))),
    ...(['ok', 'fail'] as OverrideTarget[]).flatMap((target) => sub.map((child): Spec => ({ kind: 'override', target, child }))),
  ]);

// Single-chain "towers": every control-flow wrapper stacked `depth` deep, cycling so each
// primitive appears many times down one chain. One tower per (rotation × leaf), which varies
// the adjacency order so every wrapper-over-wrapper pairing shows up. Parallel keeps a trivial
// `ok` sibling so the chain still descends through one branch. The oracle handles any depth.
const TOWER_WRAPPERS: Array<(child: Spec) => Spec> = [
  (child) => ({ kind: 'catch', child }),
  (child) => ({ kind: 'override', target: 'ok', child }),
  (child) => ({ kind: 'override', target: 'fail', child }),
  (child) => ({ kind: 'provide', scope: 'global', key: 'g', child }),
  (child) => ({ kind: 'provide', scope: 'local', key: 'l', child }),
  (child) => ({ kind: 'boundary', child }),
  (child) => ({ kind: 'parallel', children: [child, { kind: 'ok' }] }),
];

const TOWER_LEAVES: Spec[] = [
  { kind: 'read', scope: 'global', key: 'g' },
  { kind: 'read', scope: 'local', key: 'l' },
  { kind: 'ok' },
  { kind: 'fail' },
];

export const generateTowers = (depth: number): Spec[] => {
  const towers: Spec[] = [];
  const width = TOWER_WRAPPERS.length;
  for (let rotation = 0; rotation < width; rotation++) {
    for (const leaf of TOWER_LEAVES) {
      let node: Spec = leaf;
      for (let level = 0; level < depth; level++) {
        node = TOWER_WRAPPERS[(level + rotation) % width](node);
      }
      towers.push(node);
    }
  }
  return towers;
};

// global + local read/provide with service boundaries, wrapped in catch/parallel. Global and
// local use distinct identifier names ('g' / 'l') so the two scopes are separate namespaces;
// same-name cross-scope aliasing is covered separately (see crossScopeAliasing.test.ts).
export const generateLocalContext = (depth: number, globalKey = 'g', localKey = 'l'): Spec[] =>
  subtrees(
    depth,
    [
      { kind: 'read', scope: 'global', key: globalKey },
      { kind: 'read', scope: 'local', key: localKey },
    ],
    (sub) => [
      ...sub.map((child): Spec => ({ kind: 'provide', scope: 'global', key: globalKey, child })),
      ...sub.map((child): Spec => ({ kind: 'provide', scope: 'local', key: localKey, child })),
      ...sub.map((child): Spec => ({ kind: 'boundary', child })),
    ],
  );
