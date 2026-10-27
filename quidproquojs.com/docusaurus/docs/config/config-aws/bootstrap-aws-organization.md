---
title: defineBootstrapAwsOrganization
description: Bootstrap an AWS Organizations organizational unit and its member accounts.
---

# defineBootstrapAwsOrganization

Bootstraps an **AWS Organizations organizational unit (OU)** and a set of member AWS accounts placed inside it. Use this when standing up the account/organization structure that your applications will later deploy into.

This is an **organization bootstrap setting**: it configures AWS Organizations itself, not a deployed service. It is declared in a bootstrap config and deployed by the bootstrap stack (`BootstrapQpqServiceStack`).

- **On AWS:** deploys an `aws_organizations.CfnOrganizationalUnit` under the given root/parent OU, and one `aws_organizations.CfnAccount` per name in `accountNames`, each placed in the new OU. Member accounts are named `<organizationName>-<accountName>`, given a cross-account access role `account-<accountName>-AccessRole`, and assigned a generated `+`-suffixed email derived from `baseEmailAddress` (e.g. `me+<org>-<account>@example.com`). Deployed by `QpqBootstrapConfigAwsOrganizationConstruct`.

```typescript
import { defineBootstrapAwsOrganization } from '@qpqjs/config-aws';

export default [
  defineBootstrapAwsOrganization(
    'r-abcd',                 // root/parent OU id
    'aws+billing@example.com', // base email for generated account emails
    'acme',                    // organization / OU name
    ['prod', 'staging', 'dev'],// member account names
  ),
];
```

## Signature

```typescript
function defineBootstrapAwsOrganization(
  rootAwsOrganizationalUnitId: string,
  baseEmailAddress: string,
  name: string,
  accountNames: string[],
): AwsOrganizationQPQConfigSetting;
```

## Parameters

### `rootAwsOrganizationalUnitId` — `string` (required)

The id of the parent OU (typically the organization root, e.g. `r-xxxx`) that the new organizational unit is created under. Also forms part of the setting's `uniqueKey` (`<rootAwsOrganizationalUnitId>-<name>`).

### `baseEmailAddress` — `string` (required)

A base email address used to generate a unique email for each member account. The construct splits it at `@` and produces `<local>+<organizationName>-<accountName>@<domain>` per account, so every AWS account gets a distinct, deliverable root email from a single mailbox.

### `name` — `string` (required)

The organization/OU name. Used as the created OU's name, as the prefix for each member account name (`<name>-<accountName>`), and within the generated account emails and the setting's `uniqueKey`.

### `accountNames` — `string[]` (required)

The member accounts to create inside the OU. Each entry produces one AWS account named `<name>-<accountName>` with an access role `account-<accountName>-AccessRole`.

## Notes

- Creating AWS accounts via CloudFormation is not reversible in the usual sense — removing an account from `accountNames` does not close the AWS account. Treat this as a one-way bootstrap and manage account lifecycle deliberately.
- The source additionally sketches (currently commented out) support for per-account user access and an IAM Identity Center (SSO) admin permission set; those are not created by the current implementation.

## Examples

```typescript
import { defineBootstrapAwsOrganization } from '@qpqjs/config-aws';

export default [
  defineBootstrapAwsOrganization(
    'r-abcd',
    'aws-ops@example.com',
    'acme',
    ['prod', 'staging', 'sandbox'],
  ),
];
```

## Related

- [defineBootstrapWaf](./bootstrap-waf.md) — another bootstrap-phase setting deployed by the same `BootstrapQpqServiceStack`.
- [defineAccountBudget](./account-budget.md), [defineAccountCloudTrail](./account-cloud-trail.md), [defineAccountSecurityServices](./account-security-services.md) — account-level settings applied per member account (from that account's own account config).
- **AWS implementation:** `QpqBootstrapConfigAwsOrganizationConstruct` (Organizations OU + member accounts) in `@qpqjs/deploy-aws`.
