---
title: defineMcpServer
description: Serve an MCP (Model Context Protocol) endpoint from a service, so AI clients can call your tools as the signed-in user.
---

# defineMcpServer

Adds an **MCP server** to a service: a single HTTP endpoint (streamable HTTP, stateless) that AI clients such as Claude can connect to and call tools on. It returns an array of config settings, so put it in your service config as a plain element.

Callers send a Bearer access token. By default it is checked against `userDirectoryName`, and every tool call runs as that user. The server offers the tools in `options.tools` plus the tools of every [defineMcpToolset](#defineMcpToolset) in the same service. Tools are listed on each request, so a tool added to a toolset's source shows up after the next deploy.

```typescript
import { defineMcpServer } from '@qpqjs/features';

export default [
  defineMcpServer({
    userDirectoryName: 'users',
    serverName: 'My app',
  }),
];
```

## Signature

```typescript
function defineMcpServer(options: McpServerOptions): QPQConfig;
```

## Parameters

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `userDirectoryName` | `string` | – (required) | The user directory callers authenticate against with a Bearer access token. Ignored for identity if `actionProcessors` override the decode. |
| `serverName` | `string` | – | Shown to the client as the server's name. |
| `path` | `` `/${string}` `` | `/mcp` | Route the endpoint is served on. |
| `tools` | `AiToolDefinition[]` | – | Tools the server runs directly by executor, like [defineAi](../core/ai.md)'s. Toolsets add more. |
| `actionProcessors` | `QpqFunctionRuntime[]` | – | Processor overrides attached to this route only, for custom auth. `askRouteAuthValidationDecode` decides who is calling; [askRouteAuthValidationResolveContext](../../actions/webserver/route-auth-validation/ask-route-auth-validation-resolve-context.md) sets context such as a tenant's storage scope. |

## Notes

- `POST` on the path handles MCP requests. `GET` and `DELETE` on the same path answer "method not allowed", since the server keeps no sessions.
- A custom auth override that rejects the caller makes the request fail rather than fall back to running without that context.

## defineMcpToolset

```typescript
function defineMcpToolset(toolset: McpToolset): McpToolsetQPQConfigSetting;
```

Offers a pluggable source of tools on this service's MCP server. A toolset is a `name` plus two inline function names:

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Unique per service. Names the toolset in config and logs. |
| `listTools` | `string` | Inline function that gets `McpToolsetListToolsInput` and returns `McpTool[]`. |
| `runTool` | `string` | Inline function that gets `McpToolsetRunToolInput` and returns the tool's result. |
| `instructions` | `string` | Optional. Added to the server's `instructions` when a client connects. |
| `prefix` | `string` | Optional. Every tool this toolset lists is named `<prefix>_…`, so a call to such a name goes straight to its `runTool` without listing every toolset first. Remote toolsets set it. |

Both functions already run as the caller, with whatever context the route's auth resolved. The two inline functions must be registered separately with `defineInlineFunction`.

Tool names must be unique across the server: the server's own `tools` come first, then each toolset's in config order, and on a clash the earlier tool wins.

## Toolsets from another service

One service's MCP server can offer the toolsets of other services, so a client connects once and reaches them all.

In the service that owns the tools, `defineMcpToolsetExport()` offers its toolsets (its `defineMcpToolset` registrations) as two backend-only service functions, one to list the tools and one to run one:

```typescript
import { defineMcpEventDocAiToolset, defineMcpToolsetExport } from '@qpqjs/features';

// in the template service
export default [
  defineMcpEventDocAiToolset({ userDirectoryName: 'users' }),
  defineMcpToolsetExport(),
];
```

In the service with the MCP server, `defineMcpRemoteToolset` adds them under a prefix:

```typescript
import { defineMcpRemoteToolset, defineMcpServer } from '@qpqjs/features';

export default [
  defineMcpServer({ userDirectoryName: 'users' }),
  defineMcpRemoteToolset({
    service: 'template',
    prefix: 'template',
    instructions: 'Tools named template_… work on templates. Find their docId with template_listDocs.',
  }),
];
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `service` | `string` | – (required) | The service that calls `defineMcpToolsetExport`. |
| `prefix` | `string` | – (required) | Put in front of each of its tool names (`template_setLayout`), so two services cannot clash. Letters, digits and dashes. |
| `instructions` | `string` | – | Added to the server's `instructions`. The exporting service's own toolset instructions are not forwarded, so say here how a client finds the ids its tools take. |

- Calls cross by service function, so the caller and their context (a tenant's storage scope, say) go with them, and the remote tools run as that caller. Auth happens once, at the MCP endpoint.
- The request's `Authorization`, `Cookie` and `x-api-key` headers are removed before the hop: credentials never leave the endpoint.
- A service that cannot list its tools is logged and offers none, so one service being down never takes the whole server with it.
- A call to `<prefix>_…` goes straight to that service. Listing still asks every remote service, one hop each.

## Related

- [defineMcpEventDocAiToolset](./mcp-event-doc-ai-toolset.md)
- [askRouteAuthValidationResolveContext](../../actions/webserver/route-auth-validation/ask-route-auth-validation-resolve-context.md)
- [defineEventDocAi](./event-doc-ai.md)
