import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig } from 'quidproquo-core';

import { aws_iam, Resource, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

const STACK_CHILD_ID = 'qpq-service-role';

// IAM caps a managed policy document at 6,144 non-whitespace bytes. Statements are
// merged before measuring, so a chunk usually holds far more grants than its raw
// statement count suggests; the slack covers any drift between the synth-time
// rendering measured here and what IAM counts.
const MANAGED_POLICY_BYTE_BUDGET = 5632;

type ManagedPolicyChunk = {
  policy: aws_iam.ManagedPolicy;
  statements: aws_iam.PolicyStatement[];
};

/**
 * The service role shared by every lambda in a stack, imported from the inf stack.
 *
 * Grants made against it (event sources, tracing, explicit addToPrincipalPolicy calls)
 * are packaged into customer-managed policies rather than the role's inline policies:
 * a role's inline policies are capped at 10,240 bytes in aggregate, and the inf stack
 * already spends most of that on the baseline. Managed policies are a separate budget
 * per policy. Statements are merged and chunked so no policy overflows its own limit.
 *
 * One instance per stack, via QpqServiceRole.of: importing the role per construct
 * would give each construct its own inline policy on the same role.
 */
export class QpqServiceRole extends Resource implements aws_iam.IRole, aws_iam.IComparablePrincipal {
  static of(scope: Construct, qpqConfig: QPQConfig): QpqServiceRole {
    const stack = Stack.of(scope);
    const existing = stack.node.tryFindChild(STACK_CHILD_ID);

    if (existing instanceof QpqServiceRole) {
      return existing;
    }

    return new QpqServiceRole(stack, STACK_CHILD_ID, qpqConfig);
  }

  readonly grantPrincipal: aws_iam.IPrincipal = this;
  readonly assumeRoleAction = 'sts:AssumeRole';
  readonly roleArn: string;
  readonly roleName: string;
  readonly policyFragment: aws_iam.PrincipalPolicyFragment;
  readonly principalAccount?: string;

  private readonly importedRole: aws_iam.IRole;
  private readonly chunks: ManagedPolicyChunk[] = [];

  private constructor(scope: Construct, id: string, qpqConfig: QPQConfig) {
    super(scope, id);

    // Immutable: nothing may reach the imported role's own inline policy.
    this.importedRole = aws_iam.Role.fromRoleName(
      this,
      'imported',
      awsNamingUtils.getConfigRuntimeResourceNameFromConfig('service-role', qpqConfig),
      {
        mutable: false,
      },
    );

    this.roleArn = this.importedRole.roleArn;
    this.roleName = this.importedRole.roleName;
    this.policyFragment = this.importedRole.policyFragment;
    this.principalAccount = this.importedRole.principalAccount;
  }

  get roleRef(): aws_iam.RoleReference {
    return { roleArn: this.roleArn, roleName: this.roleName };
  }

  addToPrincipalPolicy(statement: aws_iam.PolicyStatement): aws_iam.AddToPrincipalPolicyResult {
    const chunk = this.chunkWithRoomFor(statement);

    chunk.statements.push(statement);
    chunk.policy.addStatements(statement);

    return { statementAdded: true, policyDependable: chunk.policy };
  }

  addToPolicy(statement: aws_iam.PolicyStatement): boolean {
    return this.addToPrincipalPolicy(statement).statementAdded;
  }

  attachInlinePolicy(policy: aws_iam.Policy): void {
    policy.attachToRole(this);
  }

  addManagedPolicy(policy: aws_iam.IManagedPolicy): void {
    this.importedRole.addManagedPolicy(policy);
  }

  grant(grantee: aws_iam.IPrincipal, ...actions: string[]): aws_iam.Grant {
    return aws_iam.Grant.addToPrincipal({ grantee, actions, resourceArns: [this.roleArn] });
  }

  grantPassRole(grantee: aws_iam.IPrincipal): aws_iam.Grant {
    return this.grant(grantee, 'iam:PassRole');
  }

  grantAssumeRole(grantee: aws_iam.IPrincipal): aws_iam.Grant {
    return this.grant(grantee, 'sts:AssumeRole');
  }

  dedupeString(): string {
    return `QpqServiceRole:${this.roleArn}`;
  }

  // The current chunk if the statement fits once merged in, otherwise a fresh one.
  private chunkWithRoomFor(statement: aws_iam.PolicyStatement): ManagedPolicyChunk {
    const current = this.chunks[this.chunks.length - 1];

    if (current && this.renderedSize([...current.statements, statement]) <= MANAGED_POLICY_BYTE_BUDGET) {
      return current;
    }

    const chunk: ManagedPolicyChunk = {
      policy: new aws_iam.ManagedPolicy(this, `grants-${this.chunks.length}`, {
        roles: [this.importedRole],
        document: new aws_iam.PolicyDocument({ minimize: true }),
      }),
      statements: [],
    };

    this.chunks.push(chunk);

    return chunk;
  }

  private renderedSize(statements: aws_iam.PolicyStatement[]): number {
    const rendered = this.stack.resolve(new aws_iam.PolicyDocument({ minimize: true, statements }));

    return JSON.stringify(rendered).length;
  }
}
