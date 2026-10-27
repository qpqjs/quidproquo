import { QpqFunctionRuntime } from '../../../../types';

export interface EmailTemplates {
  verifyEmail?: QpqFunctionRuntime;
  resetPassword?: QpqFunctionRuntime;
  resetPasswordAdmin?: QpqFunctionRuntime;
}

export interface CustomAuthRuntime {
  defineAuthChallenge: QpqFunctionRuntime;
  createAuthChallenge?: QpqFunctionRuntime;
  verifyAuthChallenge?: QpqFunctionRuntime;
}
