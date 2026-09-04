---
title: askOpenApiGetDocument
description: Build the service's OpenAPI 3.1 document from its route config.
---

# askOpenApiGetDocument

Returns the **OpenAPI document** describing every route in the service. Stories never see the service config, so the walk happens in the processor, which has it. The result is plain data, ready to serialise.

- **Action type:** `OpenApiActionType.GetDocument`

```typescript
import { askOpenApiGetDocument, qpqWebServerUtils } from 'quidproquo-webserver';

export function* getSpec() {
  const document = yield* askOpenApiGetDocument({ title: 'Widgets API', version: '1.2.0' });

  return qpqWebServerUtils.toJsonEventResponse(document);
}
```

## Signature

```typescript
function* askOpenApiGetDocument(options?: OpenApiDocumentOptions): AskResponse<OpenApiDocument>;
```

## Parameters

### `options` — `OpenApiDocumentOptions` (optional)

`title`, `version` and `description` for the document's info block. The title defaults to the application and module name, the version to `1.0.0`.

## Returns

`OpenApiDocument` — an OpenAPI 3.1 document with `info`, `servers`, `paths` and `components.securitySchemes`. The same structure `buildOpenApiDocument` in `qpqWebServerUtils` produces when given a config directly, which is the way to generate it at build time.

## Related

- [defineOpenApiRoutes](../../../config/features/open-api-routes.md) — serves this document and a reference page for it.
- [defineRoute](../../../config/webserver/route.md) — the `schema` option that fills in request and response shapes.
