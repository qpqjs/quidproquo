// Comments describe the code as it is now (G7): no em dashes, and no narrating what the
// code used to do. Git holds the history.
const EM_DASH = /—/;
// The narrative past tense only, not the passive "a value used to derive the key".
const HISTORY =
  /\b(used to (be|have|do|call|run|return|live|sit|hold|point|take|get|make|need|mean|work|exist|require|keep|store|read|write|throw|skip|check|handle|send|load|invoke)|no longer|previously|moved from)\b/i;

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Comments carry no em dashes and do not narrate history' },
    schema: [],
    messages: {
      emDash: 'Comments use a period, comma, colon or parentheses instead of an em dash.',
      history: 'Comments describe the code as it is now, not what it used to do ("{{phrase}}").',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (EM_DASH.test(comment.value)) {
            context.report({ loc: comment.loc, messageId: 'emDash' });
          }
          const history = HISTORY.exec(comment.value);
          if (history) {
            context.report({ loc: comment.loc, messageId: 'history', data: { phrase: history[0] } });
          }
        }
      },
    };
  },
};
