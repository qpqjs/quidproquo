---
description: Propose an ambitious 12-month moonshot for part of the stack, write it to a plan file, then build it one phase at a time
argument-hint: <X> / <description>  |  next  |  phase <n>
---

Moonshot prompt. Small iterations on an ugly part of the stack stay small; this asks for the big version instead, writes it down, then builds it phase by phase with a review stop after each one.

Arguments: `$ARGUMENTS`

## Which mode

Read the arguments and pick one:

- **Propose** (default): `<X>` or `<X> / <description>`. X is the thing to improve (a package, feature, subsystem, workflow). Everything after the first ` / ` is the author's description of what is wrong with it today or what they wish it did. Produce the moonshot plan file. Do not write any code.
- **Build next**: the single word `next`. Open the most recently modified `issues/plans/moonshot-*.md`, find the first phase whose heading still has an empty box (`### [ ]`), and build it.
- **Build a phase**: `phase <n>` (optionally `phase <n> <plan-slug>`). Build that phase of the named plan, or of the most recently modified moonshot plan.
- No arguments: list the moonshot plan files under `issues/plans/` with each one's next unticked (`[ ]`) phase, and stop.

## Propose

Think about X as if you had unlimited developers and twelve months, and were told to be ambitious. Spend real effort on this; do not reach for the first idea. Before writing anything:

1. Read the code behind X. Know what it does now, what it costs (complexity, performance, dependencies, operational pain), and what everyone has quietly accepted as "just how it is".
2. Look at how X is used across the repo and, where relevant, by the site app and the platforms that consume quidproquo. The moonshot has to fit where the framework is going, not just be impressive.
3. Generate at least three genuinely different moonshots (replace it, remove the need for it, invert who does the work, change the abstraction level). Pick the one with the best ratio of ambition to real payoff. The rejected ones get a line each in the plan so the choice is visible.

Then write `issues/plans/moonshot-<slug>.md`, where the slug is X in kebab-case. If that file already exists, write `moonshot-<slug>-2.md` and say so. The file holds, in this order:

```
# Moonshot: <title>

**Target:** <X>, <one line on the author's description if given>
**Date:** <today, absolute>

## Today
What X is and does now, the cost of it, and why incremental fixes have not moved the needle. Short. Cite files.

## The moonshot
The big idea in a paragraph a newcomer to the repo could follow. Then what becomes possible that is not possible today.

## Why not sooner
Why this never got suggested: what makes it look too expensive in human time, and why that no longer applies.

## Alternatives considered
One line each for the other moonshots and why they lost.

## Risks and unknowns
What could sink it. Security, data handling and compatibility concerns go here explicitly (this repo ships to regulated clients; call out anything that touches auth, tenant isolation, logs, secrets or stored data).

## Phases
Four to six phases, each independently shippable and leaving main releasable. Every phase has:
### [ ] Phase N: <name> (~<weeks>)
- **Goal:** one sentence.
- **Done when:** the observable result, testable.
- **Work:** the concrete steps, with the files and packages involved.
- **Breaking:** none, or what goes in `breaking-changes.md`.

## Open questions
Decisions only the author can make. Keep going on everything else.
```

Every phase heading starts with an empty box, `### [ ] Phase 1: ...`. Building a phase flips it to `### [x] Phase 1: ...`; that box is the only record of progress, so never leave it off.

Finish with a short summary in chat: the one-line moonshot, the path of the plan file, and the open questions. Do not start building.

## Build (next, or phase n)

1. Read the whole plan, not just the phase. Then read the current code behind X again; it may have moved since the plan was written.
2. If an earlier phase still has an empty box but its work is clearly already in the tree, tick it (`[ ]` to `[x]`) and say so. If the phase depends on an unresolved open question, choose the sensible default, record the choice under the phase in the plan, and continue.
3. Build the phase in full on the current branch: code, tests, barrels, `breaking-changes.md` if the phase is breaking. Follow `CLAUDE.md` for structure, naming, comments and story conventions. Run the tests, typecheck and lint for every package touched, and report the real results.
4. When the phase is done and verified, change its heading from `[ ]` to `[x]` and append a `**Built:** <date>, <one line on what shipped and anything that deviated from the plan>` line under it.
5. Stop at the code change. Do not commit, push or deploy; the author reviews and then runs `/moonshot next` for the following phase. If a phase turns out to be wrong in the light of what the code actually looks like, rewrite the remaining phases in the plan and say what changed rather than forcing the original.

Report: what was built, how it was verified, what the next phase is.
