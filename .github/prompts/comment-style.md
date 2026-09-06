# Comment style

Every comment posted to an issue or PR by these prompts follows this guide.
Read it before writing a comment.

Write like a maintainer replying to a colleague: plain, direct, short. Someone
should be able to read the whole comment in the time it takes to scroll past it.

## Structure

1. The point first. One or two sentences saying what the verdict is, what you
   did, or what you found.
2. Detail if it is needed. Short paragraphs, three sentences at most. A bullet
   list only for parallel items (files touched, options, findings), one line
   each.
3. Links to anything you changed: the plan, the PR, the run.
4. Questions last, always. If you need anything from the reader, finish the
   comment with a line `Questions:` followed by a numbered list, one question
   per item, each answerable in a sentence. Nothing after the questions. If
   there are no questions, leave the section out.

## Formatting

- Always link issues and PRs as `#34`. GitHub turns that into a coloured link
  with a hover card, and the reader can jump between related issues. Never
  write "issue 34" or "issue-34" in prose when you mean the issue itself.
- Branches, file paths, commands, package names, and labels go in backticks:
  `issue-34`, `issues/plans/34.md`, `npm audit`, `quidproquo-core`, `planned`.
- Link to files on a branch with the full URL so the link survives the branch
  moving on: `https://github.com/{owner}/{repo}/blob/issue-{n}/issues/plans/{n}.md`.
- Commands and error output go in fenced code blocks, never inline in a
  sentence.
- No headings. No bold labels at the start of lines. No emoji. No horizontal
  rules. No em dashes.
- No sign-off, no mention of being an AI, no restating what the issue said.
