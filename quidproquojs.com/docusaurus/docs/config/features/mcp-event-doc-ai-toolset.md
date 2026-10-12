---
title: defineMcpEventDocAiToolset
description: Offer every eventDoc AI's tools on the service's MCP server, each scoped to a document by id.
---

# defineMcpEventDocAiToolset

Adds a toolset to the service's [MCP server](./mcp-server.md) that exposes the tools of every [defineEventDocAi](./event-doc-ai.md) in the service. It also adds a `listDocs` tool so the client can find a document id from a name.

Each AI tool takes a `docId` argument and runs in that document's AI context, the same as it would inside the chat. The collection's own hooks (for example a tenant authoriser) still decide whether the caller may touch the document.

```typescript
import { defineMcpEventDocAiToolset, defineMcpServer } from 'quidproquo-features';

export default [
  defineMcpServer({ userDirectoryName: 'users' }),
  defineMcpEventDocAiToolset({ userDirectoryName: 'users' }),
];
```

## Signature

```typescript
function defineMcpEventDocAiToolset(options: McpEventDocAiToolsetOptions): QPQConfig;
```

## Parameters

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `userDirectoryName` | `string` | – (required) | The user directory the collections' hooks resolve the caller against. |

## Notes

- The toolset finds collections and AIs through the registration settings that `defineEventDocRoutes` and `defineEventDocAi` now add to config, so both must be in the same service.
- It tells the client to look up a document id with `listDocs` first, and to ask the user if more than one document matches the name.

## Related

- [defineMcpServer](./mcp-server.md)
- [defineEventDocAi](./event-doc-ai.md)
- [defineEventDocRoutes](./event-doc-routes.md)
