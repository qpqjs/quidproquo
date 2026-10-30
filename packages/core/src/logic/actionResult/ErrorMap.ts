import { ActionProcessorResult } from '../../types/Action';

/** Error name (or OS code) to the catalogued result a processor answers for it. */
export type ErrorMap = { [key: string]: (error: Error) => ActionProcessorResult<any> };
