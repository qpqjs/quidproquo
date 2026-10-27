// The `ask` prefix is reserved for qpq stories, the same way `use` is
// reserved for React hooks. Seeing `ask` tells the reader (and the
// require-yield-star rule) that the function returns a generator and must be
// invoked with `yield*`. A plain function named ask* breaks that contract:
// callers will yield* something that is not a generator.
//
// Only function literals are checked. Aliases and factory results such as
//   const askLog = askLogTemplateLiteral;
//   const askRead = createContextReader(ctx);
// stay legal because the right-hand side already is (or produces) a story.

const ASK_NAME = /^ask[A-Z0-9_]/;

// Find the name a function expression/arrow is bound to, if any.
function getFunctionNameNode(node) {
  if (node.id && node.id.type === 'Identifier') {
    return node.id;
  }

  const parent = node.parent;
  if (!parent) {
    return null;
  }

  if (parent.type === 'VariableDeclarator' && parent.init === node && parent.id.type === 'Identifier') {
    return parent.id;
  }

  const isNamedMember =
    (parent.type === 'Property' || parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') &&
    parent.value === node &&
    !parent.computed &&
    parent.key.type === 'Identifier';
  if (isNamedMember) {
    return parent.key;
  }

  if (parent.type === 'AssignmentExpression' && parent.right === node) {
    if (parent.left.type === 'Identifier') {
      return parent.left;
    }
    if (parent.left.type === 'MemberExpression' && !parent.left.computed && parent.left.property.type === 'Identifier') {
      return parent.left.property;
    }
  }

  return null;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'reserve the ask* name prefix for generator functions (qpq stories)',
    },
    schema: [],
    messages: {
      askPrefixNonGenerator:
        "'{{name}}' is not a generator; the 'ask' prefix is reserved for qpq stories. Make it a generator (function*) or rename it.",
    },
  },

  create(context) {
    function checkFunction(node) {
      if (node.generator) {
        return;
      }

      const nameNode = getFunctionNameNode(node);
      if (!nameNode || !ASK_NAME.test(nameNode.name)) {
        return;
      }

      context.report({
        node: nameNode,
        messageId: 'askPrefixNonGenerator',
        data: { name: nameNode.name },
      });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};
