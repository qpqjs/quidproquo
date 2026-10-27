---
sidebar_position: 5
title: Security model
description: Where the trust boundaries sit in a Quidproquo app, what each one checks, and what it deliberately does not promise.
---

# Security model

This page describes the boundaries a Quidproquo app relies on: how a request proves who it is, how data is kept apart, what a user script can and cannot do, and what the admin tooling is allowed to see. Each section says what the framework checks for you, where your code has to make a decision, and the limits you should plan around.

## The auth gate

Every HTTP request runs through one gate before any story code, `askValidateRouteAuth`. The route's `routeAuthSettings` decide what it checks:

- **No `routeAuthSettings`:** the route is public. Nothing is checked and the story runs anonymously.
- **`userDirectoryName`:** the request needs an `Authorization: Bearer <token>` header. The token is verified by the named [user directory](./config/core/user-directory.md) (on AWS, a Cognito user pool): signature, issuer, expiry. A missing, malformed, unsigned or expired token is a 401 before the story starts.
- **`apiKeys`:** the request needs an `x-api-key` header matching one of the configured [API keys](./config/webserver/api-key.md). This composes with the token check: a route with both needs both.

A route can swap in its own decode step through a per-route action processor override, which is how a signed session or a third-party token scheme plugs in. The gate still runs; only the way a token is decoded changes.

What the gate does not do: it does not authorise. Knowing who the caller is does not say what they may do. Permission decisions live in the layer below, scopes and tenants.

The same user directory authenticates WebSocket connections. A connection starts anonymous; it sends an `Authenticate` message carrying its bearer token and the server verifies it the same way. On a [WebSocket queue](./config/features/web-socket-queue.md) with a user directory, an unauthenticated connection may only ping or authenticate. Every other message is refused with `Unauthenticated` and never reaches a handler or the event bus.

## Scopes: keeping data apart

A storage scope is a string that partitions a store. A [key-value store](./config/core/key-value-store.md) or [storage drive](./config/core/storage-drive.md) declared `scoped: true` refuses any action that does not carry a scope, and composes the scope into every key it writes and reads. Two scopes never see each other's rows or files, including through indexes, pagination keys and list operations. A page key issued under one scope is rejected under another.

The scope comes from the story's session, not from the request. Story code reads and writes with its ordinary keys and never sees the composed form; the scope is applied and stripped inside the action processors. That means a bug in a story cannot accidentally reach across scopes by building a clever key: the partition is decided before the story runs.

Scopes are the mechanism. Tenants are the policy built on it.

## Tenants

[defineTenant](./config/features/tenant.md) turns scopes into organisations. Each request to a tenanted route carries a tenant id in a header (`x-qpq-tenant-id` by default). The order of checks is fixed: authenticate, resolve the header, check membership, check permission, then run the handler.

- A request with a tenant header runs in that tenant's scope, `TENANT#<id>`, only if the authenticated user holds an enabled membership in it. Otherwise it is `Forbidden`.
- A request with no header runs in the caller's personal scope, `PERSONAL#<userId>`. A tenanted route is never unscoped. There is no way to send a request that lands in the raw, scope-free partition.
- Permissions are judged against the membership row the gate already read: the member's roles from the tenant's role catalog plus any direct grants. A route declares the permission it needs; a member without it gets `Forbidden` with no store access having happened.

WebSocket connections claim a tenant the same way, by including the scope in their `Authenticate` message. The server resolves the claim through the same membership check and stores the result on the connection. Subscriptions are filed under that validated scope, so a client cannot subscribe into another tenant's topics, and a re-authentication with a new scope drops every earlier subscription.

Tenant records, memberships and the tenant documents themselves live in their own stores, owned by one service. Other services reference them rather than copying them, so there is one membership table to get right.

## User scripts: the sandbox

User scripts are code your users write and your service runs. They are treated as hostile. [defineUserScriptRunner](./config/core/user-script-runner.md) gives each service a sandbox with two walls:

- **No permissions.** The runner is its own function with its own role, which can write its logs and nothing else. It does not use the service role, so a script cannot reach a drive, a store, a secret, a queue or any other AWS resource, no matter what it imports or calls. The deployed smoke suite checks this on every deploy: no `AWS_*` variables are visible, the SDK's own credential lookup ends with no credentials, and direct calls against the service's bucket and account are denied.
- **Pure actions only.** The runner's action processors are date, guid, log, math and error. A script can yield `askDateNow` or `askNewGuid`; anything else it yields has no processor and fails at that point. A [user script module](./config/core/user-script-module.md) controls what a script can import, not what it can do, so treat it as an API surface rather than a boundary.

Timeout, memory and concurrency are set on the runner. A runner placed in a [virtual network](./config/core/virtual-network.md) with no route out has no internet either.

The dev server mirrors this with a child process that has no cloud credentials and the same timeout, so a script that works locally behaves the same deployed.

## Secrets, keys and tokens

- Secrets are read through `askConfigGetSecret` and live in the platform's secret store, never in config or in the bundle. Config carries the secret's name, not its value.
- Encryption and signing go through [crypto](./actions/core/crypto/ask-crypto-encrypt.md) actions backed by platform keys. Plaintext and decrypted values are marked in the story log so the redaction below removes them.
- Random values that act as credentials come from `askSecureTokenGenerate`, which uses the platform's secure random source and refuses to fall back to a weaker one. `askNewGuid` uses the same source.
- The admin app keeps tokens in memory only. A page refresh means a fresh login.

## What the admin tooling can see

Every story is logged in full: the actions it yielded, their payloads and results, the session, the console output. Those raw logs are readable only by the log service's own role. Everything an admin reads goes through a redaction pass first:

- Values under keys that name a credential (`password`, `token`, `secret`, `apiKey`, `authorization`, `cookie` and their common spellings) are removed, and the value itself is swept out of every other string in the log, including inside base64, JSON and form-encoded bodies.
- Results of actions whose output is a secret (a secret read, a decrypt, a generated token, a presigned URL) are removed the same way.
- JWTs, Basic auth credentials and long URL fragments are recognised by shape.
- Anything a story marks with `askRedactString` is swept from the whole log.

The redacted copy is what the admin viewer, the trace replay, the log search and the admin AI tools read. The console output of a Lambda can be run through the same rules with [defineConsoleLogRedaction](./config/features/console-log-redaction.md), since anyone with CloudWatch access in the account can otherwise read it.

Admin routes sit behind their own user pool, separate from your application's users. The deployed smoke suite checks on every deploy that an admin route served without a token is refused.

## Errors

A caller never receives a stack trace. An unhandled exception becomes `An unexpected error occurred [ErrorName]`, with the message and stack kept in the log for the admin tooling. The error body carries only an error type and a short text.

## What this model does not promise

- Scopes isolate data, not compute. A story running for tenant A can still spend tenant B's share of concurrency or a shared rate limit. Use per-function concurrency limits and the [WAF](./config/config-aws/bootstrap-waf.md) rate rules for that.
- A tenanted route is only as safe as the permission it declares. A route with no `permission` is membership-only, which is right for some routes and wrong for others.
- A user script module is a convenience, not a wall. The sandbox is the wall.
- Raw logs are privileged by design. Anyone who can read the raw log bucket or assume the log service role sees unredacted data.
