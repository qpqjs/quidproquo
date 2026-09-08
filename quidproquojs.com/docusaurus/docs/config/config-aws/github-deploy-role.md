---
title: defineAwsGithubDeployRole
description: The IAM role GitHub Actions assumes through OIDC to deploy an app environment.
---

# defineAwsGithubDeployRole

Declares the **IAM role a GitHub Actions workflow assumes** (via OpenID Connect, no stored keys) to deploy this app's environment. It is a bootstrap setting: declared once in `bootstrap.qpq.ts`, deployed by the bootstrap stack.

- **On AWS:** creates `github-actions-deploy-<app>-<environment>` with `AdministratorAccess` (a deploy creates IAM roles, so it needs what the person running `qpq go` has) and a two-hour session. Its trust policy allows `sts:AssumeRoleWithWebIdentity` from the account's `token.actions.githubusercontent.com` provider when the token's audience is `sts.amazonaws.com` and its subject is `repo:<owner>/<name>:environment:<githubEnvironment>`. When `ownerId` and `repositoryId` are given, the immutable-id form GitHub can issue (`repo:owner@id/name@id:environment:...`) is trusted as well. The role ARN is a stack output. The provider itself is one per account and comes from [`defineAccountGithubOidcProvider`](./account-github-oidc-provider.md) in the account config.

```typescript
import { defineAwsGithubDeployRole } from 'quidproquo-config-aws';

export default [
  defineAwsGithubDeployRole('qpqjs/quidproquo', { ownerId: 314167689, repositoryId: 571382961 }),
];
```

## Signature

```typescript
function defineAwsGithubDeployRole(
  repository: string,
  options?: { ownerId?: number; repositoryId?: number; githubEnvironment?: string },
): AwsGithubDeployRoleQPQConfigSetting;
```

## Parameters

### `repository` — `string` (required)

`owner/name` of the GitHub repository whose workflows may assume the role.

### `options` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ownerId` | `number` | – | The owner's numeric GitHub id. `gh api repos/<owner>/<name> --jq .owner.id`. With `repositoryId`, also trusts the immutable-id subject form. |
| `repositoryId` | `number` | – | The repository's numeric GitHub id. `gh api repos/<owner>/<name> --jq .id`. |
| `githubEnvironment` | `string` | the deploy environment | The GitHub Environment the deploy job declares (`environment:` on the job). A job without it is refused by STS. |

## Wiring the workflow

After the bootstrap stack deploys, `qpq setup --check` prints the role ARN. Put it in the GitHub Environment's variables as `DEPLOY_ROLE_ARN` with `AWS_REGION`, and have the job declare that environment and `permissions: id-token: write`:

```yaml
jobs:
  deploy:
    environment: development
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: ${{ vars.DEPLOY_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}
```

## Related

- [defineBootstrapWaf](./bootstrap-waf.md) — another bootstrap-stack setting.
