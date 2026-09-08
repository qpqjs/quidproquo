---
title: defineAwsGithubDeployRole
description: The IAM role GitHub Actions assumes through OIDC to deploy an app environment.
---

# defineAwsGithubDeployRole

Declares the **IAM role a GitHub Actions workflow assumes** (via OpenID Connect, no stored keys) to deploy this app's environment. It is a bootstrap setting: declared once in `bootstrap.qpq.ts`, deployed by the bootstrap stack.

- **On AWS:** creates `github-actions-deploy-<app>-<environment>` with a two-hour session and only what a deploy needs: `sts:AssumeRole` on the CDK bootstrap roles (deploy, file-publishing, image-publishing, lookup) in every region the app deploys to, read and write on this app's S3 buckets (`*-<app>-*-<environment>`, where the built views and federated remotes are synced), and read on the `/cdk-bootstrap/*` and `/qpq/*` SSM parameters. CloudFormation applies the stacks as the bootstrap exec role, so the deploy identity never holds the permissions of what it deploys. Its trust policy allows `sts:AssumeRoleWithWebIdentity` from the account's `token.actions.githubusercontent.com` provider when the token's audience is `sts.amazonaws.com` and its subject is the repository's immutable-id form `repo:<owner>@<ownerId>/<name>@<repositoryId>:environment:<githubEnvironment>`. The name form `repo:<owner>/<name>:...` is trusted only when no ids are given or `trustNameForm` is set, since a name can be re-earned by whoever next owns it and an id cannot. The role ARN is a stack output. The provider itself is one per account and comes from [`defineAccountGithubOidcProvider`](./account-github-oidc-provider.md) in the account config.

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
| `trustNameForm` | `boolean` | `true` without ids, else `false` | Also trust the name-form subject. Leave off once ids are given. |

## Locking it down further

Protect the GitHub Environment itself (Settings, Environments): required reviewers and a deployment-branch rule limited to `main` mean a token with the right subject only exists for approved runs of trusted branches.

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
