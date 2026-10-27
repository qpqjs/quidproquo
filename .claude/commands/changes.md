---
description: Build the CHANGELOG.md entry for the version being released
---

Build the changelog entry for the release that is about to be published, and do the release-time bookkeeping in `breaking-changes.md`. This command runs right after the version bump (from the `go` script, or from the release workflow in `.github/workflows/release.yml`), so the new version numbers are sitting in the working tree uncommitted. It must work non-interactively: never stop to ask a question, make the sensible call and note it in the final report instead.

## Steps

### 1. Work out the new version (V)

Read `"version"` from the working-tree `packages/core/package.json`. That is V, the version this entry is for.

### 2. Work out the previous release (P) and the commit range

Every release is tagged with its bare version (`0.1.34`), so P is the newest tag reachable from `HEAD`: `git describe --tags --abbrev=0`. If that tag is V itself (a rerun after the bump was already tagged), use the one before it: `git describe --tags --abbrev=0 <V>^`. `/commit` judges breaking changes against the same tag, so the two always agree on what "the last release" is.

The release range is `<P>..HEAD`, minus any commit that is itself the bump for V.

### 3. Read the commits

Run `git log --format='%h %s' <P>..HEAD`. For anything whose subject doesn't tell you what it means for a consumer, look closer with `git show --stat <sha>` or the diff. Then turn the range into feature bullets:

- Write for someone who uses the packages, not someone reading the repo. Say what they can now do or what got fixed.
- **Group related commits into one bullet.** A feature that landed across five commits (e.g. tenant branding, or a cli command plus its follow-up fixes) is one line, not five.
- Drop noise entirely: `wip`, formatting-only commits, bump commits, lockfile-only changes, tweaks to commits that are already covered by another bullet.
- Keep each bullet short, lowercase-leaning, and in the same terse voice as the commit subjects. One line each.
- Order roughly by significance, biggest features first, small fixes last.

### 4. Collect breaking changes

Read `breaking-changes.md` and take the bullets under `## vNext`. Those are detailed migration notes; condense each one to a single short line for the changelog (what broke and the one-word gist of the fix, e.g. `defineTenant now requires an owner module`). The full migration detail stays in `breaking-changes.md`, so don't repeat it.

If a commit in the range is clearly breaking but has no vNext bullet, include it in the changelog's breaking section anyway and mention the gap in your final report.

### 5. Write the CHANGELOG.md entry

Insert the new entry into `CHANGELOG.md` directly below the top `# Changelog` heading, above any existing version entries:

```
## <V>

- feature bullet
- feature bullet

### Breaking changes

- condensed one-liner
- condensed one-liner
```

- Omit the `### Breaking changes` section entirely if there are none.
- If a `## <V>` section already exists (a rerun after a failed `go`), replace that whole section with the freshly built one instead of stacking a duplicate.

### 6. Roll breaking-changes.md forward

In `breaking-changes.md`, rename the `## vNext` heading to `## <V>` and add a fresh empty `## vNext` heading above it. Edge cases on rerun:

- `## <V>` already exists and `## vNext` is empty: nothing to do.
- `## <V>` already exists and `## vNext` has bullets: move those bullets into the existing `## <V>` section and leave `## vNext` empty.

### 7. Report

Do not commit anything; the release bump commit picks these files up later. Finish by reporting: V, P, how many commits were summarized into how many bullets, and the paths you edited.

## Hard rules

- **Never** use em dashes anywhere. Use a period, comma, colon, or parentheses.
- No AI tells in the writing: no "leverage", "seamless", "robust", "enhanced", no rule-of-three sentences, no forced symmetry. It should read like the person who wrote the commit messages also wrote the changelog.
- Never invent a feature you can't point at a commit for, and never pad thin releases. Two honest bullets beat six vague ones.
- Never mention Claude, AI, or any tool attribution anywhere in the output.
- Only edit `CHANGELOG.md` and `breaking-changes.md`. Do not touch package files, do not build, do not commit, do not push.
