---
title: defineAccountGithubOidcProvider
description: The account-level GitHub Actions OpenID Connect provider that every app's deploy role trusts.
---

# defineAccountGithubOidcProvider

Declares the account's **GitHub Actions OpenID Connect provider**, `token.actions.githubusercontent.com`. It is an account setting: declared once in `account.qpq.ts`, deployed by the `qpq-account` stack, and shared by every app's [`defineAwsGithubDeployRole`](./github-deploy-role.md) in that account.

- **On AWS:** creates an `aws_iam.OpenIdConnectProvider` for `https://token.actions.githubusercontent.com` with the `sts.amazonaws.com` audience. The provider's ARN is fixed by its URL, which is what the deploy roles trust. An account can hold only one provider for that URL, so a provider created by hand must be deleted before the account stack can own it.

```typescript
import { defineAccountGithubOidcProvider } from 'quidproquo-config-aws';

export default [
  defineAccountGithubOidcProvider(),
];
```

## Signature

```typescript
function defineAccountGithubOidcProvider(): AccountGithubOidcProviderQPQConfigSetting;
```

Takes no arguments.

## Related

- [defineAwsGithubDeployRole](./github-deploy-role.md) — the per-app, per-environment role that trusts this provider.
- [defineAccountBudget](./account-budget.md) — another account-stack setting.
