import path from 'path';

import { replaceInFileExact } from '../lib/replaceInFileExact';
import { CreateQpqAppStep } from '../types';

// The template's domain, replaced where it's authoritative: the app's domain
// constant (everything else derives from it). One root at scaffold time; more
// can be appended later.
const TEMPLATE_DOMAIN = 'todo.quidproquojs.com';

export const applyDomain: CreateQpqAppStep = {
  name: 'Applying domain',

  run: async ({ targetDirectory, answers }) => {
    replaceInFileExact(
      path.join(targetDirectory, 'apps', answers.appName, 'packages', 'constants', 'src', 'domain.ts'),
      TEMPLATE_DOMAIN,
      answers.domain,
    );
  },
};
