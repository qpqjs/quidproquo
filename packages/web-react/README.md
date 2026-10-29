# @qpqjs/web-react

React bindings for [quidproquo](https://github.com/qpqjs/quidproquo).

This is what a qpq frontend is built on. It runs the qpq runtime in the browser, so the same kind of stories that run on the server can drive your UI, and it provides the state, auth, and connection plumbing around them.

```bash
npm install @qpqjs/web-react
```

React 18 or newer is a peer dependency.

## What is in here

| Area | What it gives you |
| --- | --- |
| `runtime` | The browser runtime, wired to the web action processors |
| `store` | The qpq state store: reference-counted, `set_state` only, with an `onInit` hook on the definition and immediate teardown when the last consumer unmounts |
| `state` | Effect and reducer wiring for state modules, matching the layout `@qpqjs/features` uses |
| `api` | Typed clients for your service apis |
| `auth` | Sign in, sign out, tokens, and the auth context |
| `websocket`, `webSocketQueue` | Live connections, including the ordered, reliable queue |
| `hooks` | The general-purpose hooks, plus `useFieldBinding` for forms and `useSharedQueryParams` for url-backed state |
| `qpqContext` | Getting qpq config and service info into your components |
| `dateTime`, `baseUrl` | Formatting and url resolution consistent with the backend |

## Loading data: `onInit`

A screen never fetches in a `useEffect`. The runtime definition names the story that loads
what the area needs on arrival, and the store runs it once, when the first component binds
the area (the bind that takes it from no consumers to one). Later binders join the live state.
When the last consumer unmounts the area is torn down, so the next mount is a fresh lifetime
and the load runs again.

```ts
export const ordersRuntime = createQpqRuntimeDefinition({
  uniqueName: 'shop/orders',
  api: ordersLogic,
  initialState: ordersInitialState,
  reducer: ordersReducer,
  onInit: askOrdersLoad,
});
```

A load that depends on a key (the selected order, a route param) is not an `onInit` concern:
the story that changes the key dispatches the load, so the fetch and the state it fills
travel together and nothing watches the key from a hook. Processors the `onInit` story needs
go on the definition's `getActionProcessors`, not on a hook: any binder in the tree can be the
one that runs it.

## How it fits

Frontend state is a fold over dispatched effects, the same shape the backend uses for event documents. Components stay presentational: a handler dispatches an effect or runs a story, a reducer produces the next state, and a selector reads it. Data is fetched in the event handler that needs it, not in an effect that fires after render.

## Status

Pre-1.0. The whole `@qpqjs/*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
