/**
 * Same name the dynamo SDK throws for a failed conditional write; the upsert
 * processors' error maps key on it.
 */
export class ConditionalCheckFailedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConditionalCheckFailedException';
  }
}
