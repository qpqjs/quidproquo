# MCP server for eventDoc AIs

**Verdict:** enhancement
**Status:** in-progress (proof of concept)
**Branch:** `mcp-server`

## Summary

Let an MCP client (Claude Code, Claude Desktop) work with a service's eventDoc AI tools in plain language: "in Acme, make a plan for onboarding", "update the intake plan". The tool list comes from config at runtime, so a tool added to an AI shows up over MCP on the next deploy with no extra wiring.

Proof of concept scope:

- One service at a time. The endpoint lives in the service that owns the AI.
- Every tool with an `executor` is offered, writes included. Dev and demo data only (see Security).
- Auth is decided by the route: a user-directory Bearer token by default, or processor overrides (Kiln: app client credentials, which also fix the tenant).

## How a conversation flows

1. Client connects to `POST /mcp` with its `Authorization` header. The route's auth decides who is calling and, through `askRouteAuthValidationResolveContext`, which tenant every call runs in, before any tool runs. `initialize` returns each toolset's `instructions`.
2. User: "make a plan for onboarding". The model calls the app's create tool (a `defineMcpServer` tool, e.g. Mímir's `createPlan`).
3. User: "update the intake plan". The model calls `listDocs`, matches the name, then calls the AI's tools with `docId`.

Doc tools with a `docId` run after the collection's own `authorise` hook (as its get route) and a check that the doc exists, inside `askEventDocAiContextProvide({ serviceName, type, docId })`, the same context the chat wrapper sets, so tools cannot tell MCP from chat. `docId` is stripped before the tool's executor gets its arguments.

## What was built

All in `@qpqjs/features`:

- **Registrations, so runtime code can find things in config.**
  - `defineEventDocRoutes` also returns `defineEventDocCollectionRegistration` (the store with its `authorise`/`scopeResolver` hooks).
  - `defineEventDocAi` also returns `defineEventDocAiRegistration` (`aiName`, `serviceName`, `storeName`, `type`, `userDirectoryName`).
- **`defineMcpServer({ userDirectoryName, serverName?, path? = '/mcp', tools?, actionProcessors? })`** adds its setting, the `askMcpReadConfig` processor, the authenticated POST route and 405 GET/DELETE routes. The core knows nothing about eventDocs.
- **Toolsets** (`defineMcpToolset({ name, listTools, runTool, instructions? })`): a pluggable source of tools, as two inline functions. `listTools({ event })` returns `McpTool[]`; `runTool({ name, args, event })` runs one and sets up whatever context it needs. The server picks up every toolset defined in the service.
- **Handler** (`mcp/logic`): `askMcpHandleRequest` answers `initialize`, `ping`, `tools/list`, `tools/call`; notifications get 202. `askMcpToolBindingsBuild` asks each toolset for its tools, then `buildMcpToolBindings` lists the server's `tools`, then the toolsets'. First name wins on a clash. A server tool runs its executor directly; a toolset tool goes to that toolset's `runTool`. The core has no tenant logic: tenancy is whatever context the route's auth resolved.
- **eventDoc AI toolset** (`mcpEventDocAi`, `defineMcpEventDocAiToolset({ userDirectoryName })`): `listDocs` plus every eventDoc AI's tools with a `docId` argument. Its own `askMcpEventDocAiReadConfig` action reads the AIs, stores and tools from config. A doc tool runs after the collection's `authorise` hook and an existence check, inside `askEventDocAiContextProvide`. Its inline functions carry the eventDoc user-directory global the collection hooks need, so the MCP route does not.

Tests: `mcp/**/*.test.ts` and `mcpEventDocAi/**/*.test.ts`.

## End state: generic server, auth decides user and tenant

The proof of concept hard-codes eventDoc and tenant handling into the server. The end state moves both out:

- **Auth is per-route processor overrides, not MCP code.** A route can already swap `askRouteAuthValidationDecode` (who is calling). `askRouteAuthValidationResolveContext` (built, see below) lets it also return context, such as the tenant's storage scope. A Kiln client access token (one user, one tenant, scopes, hashed, revocable) then sets both the user and the tenant before any tool runs, so `tenantId` and `listTenants` go away. Public, Cognito and later OAuth are just other overrides or the defaults.
- **Toolsets.** The server takes plain `tools` (like `defineAi`) plus toolsets, each a `listTools` and a `runTool({ name, args })` inline function. The eventDoc AI handling (`listDocs`, doc permission check, `askEventDocAiContextProvide`) becomes one toolset.
- **`readOnly` on tools**, filtered in the core and sent as `readOnlyHint`, with token scopes deciding whether write tools are offered.

### Step 1, built: `askRouteAuthValidationResolveContext` (@qpqjs/webserver)

- New swappable action next to the decode. The default processor returns `{}`; a route overrides it through its runtime's `actionProcessors`.
- Yielded in `askValidateRouteAuth` after the decode and api key checks, so a rejection is a 401, and again in `askGetHttpApiEventStorySession`, where its result is merged into the session context.
- Only a validated token is passed to it, never the unverified log-only one.
- Fails closed: `getHttpApiEventGetStorySessionActionProcessor` now returns the error instead of quietly running the route with no session.
- Tests in the three stories/processors above, plus the requester and default processor. Docs: `quidproquojs.com/docusaurus/docs/actions/webserver/route-auth-validation/ask-route-auth-validation-resolve-context.md`.

### Next steps

1. ~~Generic MCP core with toolsets~~ (built, see "What was built"). `readOnly` deferred until tokens with scopes exist: it would be a per-tool flag the core filters on and sends as `readOnlyHint`.
2. Kiln app client auth, built (doccypoccy `harry-kiln`, uncommitted) and run end to end on the dev server. Kiln's existing app clients are the credential: owner + tenant + grants, hashed secrets. Nothing new was needed for storage.
   - qpq: `defineMcpServer({ actionProcessors })` attaches processor overrides to the endpoint only.
   - Kiln grant: `ClientAccessResourceType.Assistant` (`assistant:run`, all-or-nothing, off by default), a "Mímir over MCP" toggle in the app client editor, the MCP URL in its endpoints panel, and an "Add Mímir to Claude Code" command on the Connect tab (shown only with the grant; `--scope user`; literal Basic header once a secret is pasted).
   - Credentials: Mímir accepts `Authorization: Basic base64(id:secret)` (checked on every request through client-access's `clientAccessAuthenticateSecret` service function, so nothing to refresh, and revoking applies at once) or `Bearer <token>` from the token endpoint. Mímir hashes the secret before the hop. The token endpoint and the direct check share `askClientAccessCheckCredentials`.
   - Mímir: decode override (caller becomes the client's owner) and resolve context override (the client's tenant, owner membership rechecked per request). No tool takes a tenant.
   - Logs: stored raw, redacted on read. `basicAuthParser` in the admin redaction pipeline sweeps the decoded secret from the whole log.
3. Remote toolsets, built. A service exports its toolsets with `defineMcpToolsetExport()` (two backend-only service functions, `mcpExportListTools` and `mcpExportRunTool`); the MCP server's service adds them with `defineMcpRemoteToolset({ service, prefix })`. Tool names carry the prefix (`template_setLayout`), and a toolset with a `prefix` takes a call straight to its runTool without listing every toolset first. Calls cross by service function, so the caller and context (the tenant's storage scope) go with them; the request's `Authorization`, `Cookie` and `x-api-key` headers do not. A service that cannot list its tools is logged and offers none, rather than failing the server. Where two eventDoc AIs in one service share a tool name, each is offered as `${type}_${name}`. Kiln: the template service exports its four assistants (templates, template tests, transformers, content) and Mímir offers them under `template_`. Creating a template still needs an app tool like `createPlan` (Kiln's create route is permission-checked app code).
4. OAuth, last, because Cognito has no dynamic client registration.

## Using it in doccypoccy (local only, on `harry-kiln`, uncommitted)

In `services/mimir/service/src/infrastructure.ts`:

```ts
defineMcpServer({
  userDirectoryName: DOCGEN_USER_DIRECTORY,
  serverName: 'kiln-mimir',
  path: MIMIR_MCP_PATH,
  tools: MIMIR_MCP_TOOLS, // createPlan: wraps askMimirPlanCreateFromRequest + the PLAN_AUTHORITY check
  actionProcessors: ['/entry/actionProcessor/mimirMcpAuth::getMimirMcpAuthProcessors'],
}),
defineMcpEventDocAiToolset({ userDirectoryName: DOCGEN_USER_DIRECTORY }),
```

The create tool is app code on purpose: Mímir's plan create runs Kiln's own permission check (`docGenPermissionedRoute` with `PLAN_AUTHORITY`), which a generic eventDoc create would skip.

Client: the app client's Connect tab shows `claude mcp add --scope user --transport http kiln-mimir <mimir api>/mcp --header "Authorization: Basic <base64 id:secret>"`.


## Security and compliance

- **Dev and demo data only.** `proposePlan`, `recordFinding` and `tryFlow` are exposed with no person confirming, against doccypoccy's #1199, and `docs/reviews/MCP_DRAFT_AUTHORING_FINDINGS.md` found no server-side "drafts only" enforcement.
- **Data residency.** Tool results go to whatever model the MCP client runs, which may be outside Australia. Needs a decision before any client tenant's data goes through this.
- **Same identity as the chat.** Calls run as the token's user, tenant membership is checked per call, collection `authorise` hooks run for listDocs and doc access. Identity never comes from tool arguments; `tenantId` is a claim that is checked.
- **Prompt injection.** Tenant-written text in tool results goes into someone else's agent, and writes are exposed. Acceptable on demo data only.
- **Audit.** Each call is one route execution, logged with the user. Keep the bearer token out of logs.

## Open questions

- [ ] **Which tools are exposed beyond the proof of concept?** A `readOnly` flag on `AiToolDefinition` (hidden unless set, sent as `readOnlyHint`) is the simplest filter; server-side "proposals only" is the fuller fix.
- [ ] **Argument validation.** Neither the chat nor MCP checks args against `inputSchema` today (`prepareAiPromptCall` passes `jsonSchema(inputSchema)` with no `validate`). `ajv` (new dependency) or a small hand-written check.
- [ ] **Longer-term auth.** Cognito access tokens expire after an hour. Personal access tokens (user + tenant scoped, revocable) or OAuth via Cognito with a pre-registered client.
- [x] **Personal space.** Settled by auth: an app client created in a personal space works in its owner's personal space; a tenant client only in its tenant.
- [ ] **Long tools.** API Gateway cuts responses at 29 seconds. `tryFlow` may need the async continuation pattern.
- [x] **End-to-end run.** Run against the local dev server with a dev token: tools/list, listTenants, listDocs, getPlan, wrong-tenant and bad-docId errors all behaved. Write tools and `createPlan` not yet exercised.

## Changelog

- 2026-10-13: remote toolsets (`defineMcpToolsetExport`, `defineMcpRemoteToolset`, toolset `prefix` routing), shared-name handling in the eventDoc AI toolset, Kiln template assistants on Mímir's endpoint, tests for Mímir's MCP auth and the direct secret check.

- 2026-10-12: removed the proof of concept's tenant-by-argument mode (`tenanted`, `listTenants`, `tenantId` on tools) and the tenant feature's `tenantListMine` service function and owner globals added for it. Tenancy comes only from route auth.

- 2026-10-12: Basic auth with the client id + secret (no token refresh), Connect tab command for Claude Code, `basicAuthParser` log redaction.

- 2026-10-12: MCP auth moved to Kiln app client tokens (Assistant grant, membership recheck, client tokens only). User logins no longer work on Mímir's MCP endpoint.

- 2026-10-12: generic core: toolsets (`defineMcpToolset`) replace the built-in eventDoc handling, which moved to the `mcpEventDocAi` toolset. Mímir on `harry-kiln` adds `defineMcpEventDocAiToolset`.

- 2026-10-12: added `askRouteAuthValidationResolveContext` to @qpqjs/webserver (step 1 of the end state); session building now fails closed.
- 2026-10-12: added Mímir's `createPlan` MCP tool on doccypoccy `harry-kiln` (local only).

- 2026-10-12: built the proof of concept on `mcp-server`: tenant as a checked tool argument, listTenants/listDocs built-ins, server tools for doc-less actions like create.
- 2026-10-12: dropped the `readOnly` filter; proof of concept exposes every tool with an `executor`.
- 2026-10-12: created from the MCP brainstorm (Mímir in doccypoccy).
