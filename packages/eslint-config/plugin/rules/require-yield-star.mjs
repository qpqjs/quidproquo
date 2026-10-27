// Calls to qpq action requesters and stories (any function whose name starts
// with `ask`), including tagged-template forms like `askLog\`...\``, return
// generators, they don't do the work themselves. Inside a
// story the only way to actually run one is to delegate to it with `yield*`.
// A bare call silently produces a generator object that never executes, and a
// plain `yield` hands the generator to the runtime as a value instead of
// running it. Both are almost always bugs, so this rule enforces `yield*`.
//
// The rule only fires inside generator functions. Outside a generator you
// cannot yield at all, and un-yielded ask calls are how generators are
// legitimately created for composition, for example:
//   yield* askRunParallel([askA(), askB()]);   // args build generators
//   runStory(askDateNow(), mocks);             // tests drive them manually
//   return askFunction(deps, ...args);         // non-generator forwarding

const ASK_NAME = /^ask[A-Z0-9_]/;

// Wrapper nodes that sit between an expression and the code that consumes it
// without changing how the value is used (TS casts, optional chains).
const TRANSPARENT_WRAPPERS = new Set([
  'ChainExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
  'TSInstantiationExpression',
]);

// Parents where `yield* expr` can be substituted for `expr` without parens,
// because the position accepts a full AssignmentExpression.
const NO_PARENS_PARENTS = new Set([
  'ExpressionStatement',
  'VariableDeclarator',
  'AssignmentExpression',
  'ReturnStatement',
  'ArrayExpression',
  'SpreadElement',
  'Property',
  'TemplateLiteral',
]);

// Works for both a call's callee and a tagged template's tag.
function getAskName(callee) {
  if (callee.type === 'Identifier') {
    return callee.name;
  }
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    return callee.property.name;
  }
  return null;
}

function isFunctionNode(node) {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
}

// The nearest enclosing function decides whether yielding is even possible.
// A callback inside a generator is its own (non-generator) function scope.
function getEnclosingFunction(node) {
  let current = node.parent;
  while (current && !isFunctionNode(current)) {
    current = current.parent;
  }
  return current;
}

// Climb past casts/chains to the node whose parent actually consumes the value.
function getOutermostWrapped(node) {
  let current = node;
  while (current.parent && TRANSPARENT_WRAPPERS.has(current.parent.type)) {
    current = current.parent;
  }
  return current;
}

// An ask call used (possibly nested in array/object literals) as an argument
// to another call is the composition pattern: the generator is handed to
// something like askRunParallel or askCatch which will run it.
function isPassedAsCallArgument(node) {
  let child = node;
  let parent = child.parent;

  while (parent) {
    if (parent.type === 'CallExpression' || parent.type === 'NewExpression') {
      return parent.arguments.includes(child);
    }

    const climbsThroughLiteral = parent.type === 'ArrayExpression' || parent.type === 'ObjectExpression' || parent.type === 'SpreadElement';
    const climbsThroughProperty = parent.type === 'Property' && parent.value === child;
    const climbsThroughBranch = parent.type === 'ConditionalExpression' && parent.test !== child;
    const climbsThroughWrapper = TRANSPARENT_WRAPPERS.has(parent.type);

    if (!climbsThroughLiteral && !climbsThroughProperty && !climbsThroughBranch && !climbsThroughWrapper) {
      return false;
    }

    child = parent;
    parent = child.parent;
  }

  return false;
}

function isSafeWithoutParens(effectiveNode) {
  const parent = effectiveNode.parent;
  if (!NO_PARENS_PARENTS.has(parent.type)) {
    // yield in a ternary branch is assignment-position, in the test it is not
    return parent.type === 'ConditionalExpression' && parent.test !== effectiveNode;
  }
  if (parent.type === 'VariableDeclarator') return parent.init === effectiveNode;
  if (parent.type === 'AssignmentExpression') return parent.right === effectiveNode;
  if (parent.type === 'Property') return parent.value === effectiveNode;
  return true;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'require qpq ask* calls inside generators to be delegated with yield*',
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingYieldStar: "Call to '{{name}}' returns a qpq story generator; delegate it with 'yield*' to actually run it.",
      missingStar: "'yield {{name}}(...)' passes the generator as a value; use 'yield*' to delegate to it.",
      awaitedAsk: "'await' does not run a qpq story; use 'yield*' instead.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    // Insert `yield* ` in front of the consumed expression, adding parens
    // when the surrounding position does not accept a bare yield expression.
    const buildInsertFix = (effectiveNode) => (fixer) => {
      if (isSafeWithoutParens(effectiveNode)) {
        return fixer.insertTextBefore(effectiveNode, 'yield* ');
      }
      return fixer.replaceText(effectiveNode, `(yield* ${sourceCode.getText(effectiveNode)})`);
    };

    // Shared for plain calls (askDateNow()) and tagged templates (askLog`...`);
    // both produce a generator that must be delegated with yield*.
    const checkAskExpression = (node, name) => {
      const enclosingFunction = getEnclosingFunction(node);
      if (!enclosingFunction || !enclosingFunction.generator) {
        return;
      }

      const effective = getOutermostWrapped(node);
      const parent = effective.parent;

      if (parent.type === 'YieldExpression') {
        if (parent.delegate) {
          return;
        }
        const yieldToken = sourceCode.getFirstToken(parent);
        context.report({
          node,
          messageId: 'missingStar',
          data: { name },
          fix: (fixer) => fixer.insertTextAfter(yieldToken, '*'),
        });
        return;
      }

      if (parent.type === 'AwaitExpression') {
        const awaitToken = sourceCode.getFirstToken(parent);
        context.report({
          node,
          messageId: 'awaitedAsk',
          data: { name },
          fix: (fixer) => fixer.replaceText(awaitToken, 'yield*'),
        });
        return;
      }

      if (isPassedAsCallArgument(effective)) {
        return;
      }

      context.report({
        node,
        messageId: 'missingYieldStar',
        data: { name },
        fix: buildInsertFix(effective),
      });
    };

    return {
      CallExpression(node) {
        const name = getAskName(node.callee);
        if (!name || !ASK_NAME.test(name)) {
          return;
        }
        checkAskExpression(node, name);
      },

      TaggedTemplateExpression(node) {
        const name = getAskName(node.tag);
        if (!name || !ASK_NAME.test(name)) {
          return;
        }
        checkAskExpression(node, name);
      },
    };
  },
};
