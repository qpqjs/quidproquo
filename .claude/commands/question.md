---
description: Answer a question about the code, with the shortest possible read. Never writes code or starts work
argument-hint: <the question>
---

This is a question, not a request. Answer it and stop.

Question: `$ARGUMENTS`

## The one rule

**Never write, edit, create or delete any project file in response to this command.** That includes "while I'm here" fixes, scaffolding for a feature the question mentions, plan files, memory updates and notes. If the question is "should we add X" or "how would X work", the answer describes X; it does not build X. The author asks for work separately when they want it.

The only files you may create are throwaway scripts in the scratchpad directory, and only when running something is the honest way to answer (a simulation, a benchmark, a quick check of how a library behaves). Say that you ran one, give the result, and leave nothing in the repo.

Reading code, grepping, running existing tests, and read-only shell commands are all fine.

If the question cannot be answered without doing real work, say what the work would be in a line and stop. Do not start it.

## How to answer

Write for the smallest possible read. The author knows the project; skip the preamble.

- **Lead with the answer.** First line is the answer or the verdict. Reasons come after.
- **Dot points, not paragraphs.** One idea per point, short sentences, plain words. No headers unless the answer is long enough to need them, and then at most two.
- **Cite the code, briefly.** Name the file (or `file:line`) a claim rests on so the author can jump to it. One per point at most; describe the rest in words.
- **Text diagram when it helps.** A small boxes-and-arrows or sequence sketch in a fenced block beats three sentences about flow. Only when it genuinely replaces prose.
- **Say what you did not check.** If the answer rests on an assumption or a part of the code you did not read, say so in one line.
- **Give a recommendation when asked for one.** If the question is "should we", answer yes or no with the main reason, then the trade-off. Do not list every option.
- **No closing offer.** Do not end with "want me to implement this?" or a list of next steps. The author will ask.

Stop when the answer stops.
