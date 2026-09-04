#!/usr/bin/env bash
# Idempotently creates the labels the triage prompts are allowed to apply.
# `--force` updates colour/description if the label already exists.
set -euo pipefail

create() {
  gh label create "$1" --color "$2" --description "$3" --force
}

create triage        'ededed' 'Re-run automated triage on this issue'
create bug           'd73a4a' 'Something is not working'
create enhancement   'a2eeef' 'New feature or request'
create question      'd876e3' 'Further information is requested'
create needs-info    'fbca04' 'Waiting on more detail from the reporter'
create not-an-issue  'cfd3d7' 'Triage decided this is not actionable'
create duplicate     'cfd3d7' 'Already tracked by another issue'
create planned       '0e8a16' 'Has a plan on its issue-{n} branch'
create start-work    '5319e7' 'Apply to have the plan implemented and a PR opened'
create in-progress   '1d76db' 'Implementation is running'
create in-review     '0052cc' 'A PR is open for this issue'
