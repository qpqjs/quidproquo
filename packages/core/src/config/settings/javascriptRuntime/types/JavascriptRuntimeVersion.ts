// Cloud-agnostic runtime identifiers - the deploy layer maps these to
// platform specific values (e.g. aws_lambda.Runtime / aws_lambda.Architecture)
export enum JavascriptRuntimeVersion {
  Node20 = 'node20',
  Node22 = 'node22',
  Node24 = 'node24',
}
