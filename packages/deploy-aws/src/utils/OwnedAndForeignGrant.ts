/** One resource-kind grant on the service role: a pattern over what the service owns plus exact ARNs for what others own. */
export type OwnedAndForeignGrant = {
  // Prefix for the managed policies the foreign ARNs are attached under.
  idPrefix: string;
  actions: string[];
  // The ARN patterns covering every resource of this kind the service owns.
  ownedResourceArns: string[];
  // Whether the owned statement is narrowed by the service's resource tags. True where IAM
  // can see them (DynamoDB, SSM, Secrets Manager); false for S3, whose bucket tags IAM ignores,
  // where the naming convention in the ARN pattern is the whole boundary.
  ownedByTag: boolean;
  // Exact ARNs of the resources other services own, from the same naming path that names them.
  foreignArns: string[];
};
