// G5: a value that may be absent is `Nullable<T>`, not `T | null`. Its own rule rather than a
// no-restricted-syntax selector so it can stay a warning while the selectors are errors (H1).
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Use Nullable<T> for a value that may be absent' },
    schema: [],
    messages: { nullable: 'G5: use Nullable<T> for a value that may be absent.' },
  },
  create(context) {
    return {
      'TSUnionType[types.length=2] > TSNullKeyword'(node) {
        context.report({ node, messageId: 'nullable' });
      },
    };
  },
};
