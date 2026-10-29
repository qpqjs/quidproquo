---
description: Review every commit on the branch against docs/code-standards.md and for bugs, write a review todo list, then fix it one item per commit
argument-hint: [<start sha>]  |  fix [<review file>]
---

Two jobs in one command. **Review** goes over a run of commits, checks each one against `docs/code-standards.md` and for bugs, and writes a todo list of what is still wrong in the current code. **Fix** works through that list one item per commit, and is meant to run under `/loop`.

Arguments: `$ARGUMENTS`

## Which mode

- **Review** (default): `<start sha>`, full or short. That commit is the first one reviewed, and every commit after it up to `HEAD` is included.
- **Review, no sha**: no arguments. Review everything on the current branch since it left main: `git rev-list --reverse --no-merges $(git merge-base main HEAD)..HEAD`.
- **Fix**: `fix`, optionally followed by the path of a review file. Without a path, use the most recently modified `../qpqjs-files/future_work/review-*.md`.

Never ask a question in either mode. Both can run unattended for a long time. Every judgement call below has a default: take it, and note what you decided in the report.

## The review file

Lives outside the repo: `../qpqjs-files/future_work/review-<branch>-<short sha of the first reviewed commit>.md`, with any `/` in the branch name replaced by `-`. Running the same review again opens the same file and resumes it.

```
# Commit review: <branch>

**Branch:** <branch>
**Range:** <first short sha> (inclusive) to <last short sha>, <n> commits
**Started:** <date, absolute>
**Standards:** [docs/code-standards.md](../../quidproquo/docs/code-standards.md)

## Commits

- [x] <full sha> - <subject> - 2 findings
  - C3 packages/core/src/actions/x/askXDoThing.ts:41 - bare `yield* askErrorThrow(...)` without `return`
  - bug packages/actionprocessor-node/src/.../getXProcessor.ts:18 - error map keys `NotFound` but the SDK throws `NoSuchKey`, so the caller sees a GenericError
- [x] <full sha> - <subject> - no findings
- [ ] <full sha> - <subject>

## Fixes

- [ ] <short title> - <file>:<line> (`<symbol>`): <the problem, and what the standard wants instead>. Rule [<id>](../../quidproquo/docs/code-standards.md#<section>) (from <short sha>)
- [ ] <short title> - <file>:<line> (`<symbol>`): <what goes wrong, and when>. Bug (from <short sha>)

## Dropped

- <rule id or bug> <file> - <problem> (from <short sha>): fixed by <short sha>

## Skipped
```

`## Commits` is the progress record for the review, and its indented lines are the raw notes, kept there so an interrupted review loses nothing. `## Fixes` is built only once every commit is ticked, and it is the list the fix loop works through.

**Rule links.** Rules in the doc are bold paragraphs, so a link goes to the section and the rule id says which rule. The section is the `## ` heading the rule sits under. Its anchor is that heading lowercased, punctuation dropped, spaces turned into hyphens: `Lint, tooling and packages` becomes `#lint-tooling-and-packages`. Rule ids can carry a letter (`D4a`).

## Review

### 1. Commit checklist first

1. Resolve the range. With a sha, check it is on this branch (`git merge-base --is-ancestor <sha> HEAD`; stop if not), then list `git rev-list --reverse --no-merges <sha>^..HEAD`. If the sha is the root commit, drop the `^..` and list `<sha>` plus everything after it. With no sha, use the merge-base list above. No commits means nothing to review: say so and stop.
2. If the review file does not exist, write it with the header and one unticked `## Commits` line per commit, oldest first, before reviewing anything.
3. If it exists, resume. Keep every ticked line and its notes, add any commits that landed since as new unticked lines at the bottom, and update the `**Range:**` line.

### 2. Review each commit

Work through the unticked commits oldest first. For each one:

- Read `git show --stat <sha>`, then the diff. When a check needs more than the diff (one export per file, barrels, layering, a type's other users), read the file **as it was at that commit** with `git show <sha>:<path>`. Never `git checkout` or otherwise move the working tree.
- Judge only what the commit added or changed, plus problems it created in code it touched (a second export added to a file, a caller left pointing at a moved file). Old problems in lines the commit did not touch are out of scope; they belong in `code-standards-todo.md`, not here.
- **Standards:** check every rule in `docs/code-standards.md` that applies to the touched files. Read the whole doc before the first commit. Rules marked **lint** still get checked by eye, because lint does not run at historical commits.
- **Bugs:** wrong conditions, missing `return` or `yield*`, unawaited promises, error names mapped to the wrong catalog entry, dev-server and AWS behaving differently, auth or tenant checks skipped, paging that drops or repeats pages, tests that assert nothing or test a mock. A bug needs a concrete way it goes wrong; "might be fragile" is not a finding.
- Skip lockfiles, `lib/` output, and generated files.
- For a big mechanical commit (a rename, a move, a sweep across many packages), work out the intended pattern, check a sample, and hunt for places that did not follow it, rather than reading every file the same way.

Write each finding as an indented line under that commit, in the form `<rule id or bug> <file>:<line> - <problem in one sentence>`, then tick the commit with the finding count (`- 2 findings`, or `- no findings`). Update the file after every commit (or every batch, below) so progress survives an interruption.

**Ten commits or fewer:** review them yourself, in this session.

**More than ten:** give each commit to its own helper (Agent tool, `general-purpose`), up to five in one message so they run at the same time. Write each batch's results into the file before starting the next batch. Brief each helper with:

> Review commit `<full sha>` in the repo at `<absolute repo root>` against the code standards in `docs/code-standards.md` (read the whole doc first) and for bugs. Read-only: do not edit files, stage, commit, or `git checkout`. Use `git show <sha>` for the diff and `git show <sha>:<path>` to read a file as it was at that commit. Judge only what this commit added or changed, plus problems it created in code it touched; ignore older problems in lines it did not touch. Skip lockfiles, `lib/` and generated files. A bug needs a concrete way it goes wrong. Return only finding lines, one per line, in the form `<rule id or bug> <file>:<line> - <problem in one sentence>`, or the single word `none`.

Read what each helper returns before you write it in. Drop anything that is not really a breach of the rule it cites, or that is outside the commit's own changes.

### 3. Check the list against the current code

A mistake made in one commit is often fixed in a later one, so before any work starts, every raw finding gets checked against the code as it stands now (the working tree, which is what the fix loop will edit).

For each raw note under `## Commits`:

- **Still there:** it becomes a `## Fixes` line in the format above, with the file, line and symbol as they are now, the problem, and the rule link. Bugs are written `Bug` instead of a rule link.
- **Gone:** it becomes a `## Dropped` line. Find the commit that fixed it (`git log -L`, or `git log -S '<text>' -- <path>`) and name it; if the code was simply deleted, say `gone at HEAD`.
- The same problem noted under several commits becomes one `## Fixes` line, citing the first commit.

Order `## Fixes` with bugs first, then by rule, in the order the rules appear in the doc. When resuming a review that already had a `## Fixes` list, add new items to it and leave existing ones (ticked or not) as they are.

### 4. Report

Short, in chat:

```
Reviewed <n> commits (<first short sha> to <last short sha>).
Findings: <raw> raw, <dropped> already fixed by a later commit, <open> to fix.
  Bugs: <n>
  Standards: <n> (G <n>, A <n>, B <n>, C <n>, D <n>, E <n>, P <n>, T <n>, H <n>)
Review file: <path>

Fix them one commit at a time with:
/loop /checkcommits fix <path>
```

Leave out any rule letter with zero findings. Then add one line for anything worth reading first (the worst bug, or a rule broken over and over). Do not start fixing.

## Fix

Each pass fixes one item and makes one commit. The loop calls this over and over until the list is empty.

1. **Check the ground.** Open the review file. If any `## Commits` line is still unticked, the review is not finished: say so, print the `/checkcommits <sha>` that resumes it, and stop. If the current branch is not the file's `**Branch:**`, stop and say so; never switch branches.
2. **Pick the first unticked line** under `## Fixes`. If there is none, the list is done: report how many items were fixed, already fixed and skipped, and end the loop.
3. **Check it is still real.** Look at the code as it is now. Your own earlier fixes, or Joe's work, may already have dealt with it. If so, tick it with `already fixed: <why>` and go back to step 2 in the same pass.
4. **Check the files are free.** If a file the fix needs to touch has uncommitted changes that are not yours, move the line to `## Skipped` with `skipped: <file> has uncommitted changes` and go back to step 2.
5. **Fix it.** Read the cited rule in the doc first, and make the fix itself follow the doc too. Keep the diff small and in the style of the surrounding code. Do only what the line says: anything else you notice becomes a new unticked line at the end of `## Fixes`, not part of this commit. If the line turns out to be more than one reviewable change, split it into several lines in the file and fix the first.
6. **Breaking changes.** If the fix changes anything a consumer imports, follow the "Breaking changes" section of `.claude/commands/commit.md` (judge against the last release tag) and update `breaking-changes.md` in the same commit.
7. **Prove it.** Lint the touched files (`npx eslint <files>` inside each touched package) and run the touched packages' tests (`npx vitest run <paths>` from the repo root). Make sure the tests actually ran: "No test files found" is not a pass. If the fix changes a type, signature or export, also typecheck the package (`npx tsc -p packages/<pkg>/tsconfig.json`); only errors in files you touched count. Never run `npm run build`.
8. **Red means fix or drop.** If you cannot get it green, undo your edits to those files, move the line to `## Skipped` with `skipped: <why>`, and end the pass without a commit. Never commit red.
9. **Commit only your files:** `git add` any new files you created, by name, then `git commit -m "review fix: <rule id or bug>: <what changed>" -- <files>`. Naming the paths commits just those files and leaves anything else already staged alone. One line, lowercase-leaning, like the recent `cleanup:` commits. No `Co-Authored-By`, no mention of Claude or AI. Never `--no-verify`, never amend, never push.
10. **Tick it:** `- [x] ... done: <short sha> <one line on what changed>`. The review file is outside the repo, so this edit is not part of the commit.

Report one line per pass: what was fixed, the commit sha, and how many lines are left under `## Fixes`.
