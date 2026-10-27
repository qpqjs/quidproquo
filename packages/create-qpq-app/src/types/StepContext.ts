import { CreateQpqAppAnswers } from './CreateQpqAppAnswers';

export type StepContext = {
  // Absolute path of the directory being scaffolded (<cwd>/<appName>).
  targetDirectory: string;
  // Absolute path of the bundled template snapshot (a pruned quidproquojs.com).
  templateDirectory: string;
  // create-qpq-app's own version. The generated app pins its quidproquo-*
  // dependencies to this (the packages are published in lockstep).
  ownVersion: string;
  answers: CreateQpqAppAnswers;
};
