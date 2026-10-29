import { QpqFunctionRuntime } from '../../../../types';

export type EmailTemplates = {
  verifyEmail?: QpqFunctionRuntime;
  resetPassword?: QpqFunctionRuntime;
  resetPasswordAdmin?: QpqFunctionRuntime;
};

export type CustomAuthRuntime = {
  defineAuthChallenge: QpqFunctionRuntime;
  createAuthChallenge?: QpqFunctionRuntime;
  verifyAuthChallenge?: QpqFunctionRuntime;
};
