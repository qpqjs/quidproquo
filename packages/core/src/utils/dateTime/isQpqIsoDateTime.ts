import { QpqIsoDateTime } from '../../types/QpqIsoDateTime';
import { getValidQpqIsoDateTime } from './getValidQpqIsoDateTime';

/** Whether a value is a real instant in exactly the QpqIsoDateTime form (`2026-11-09T05:12:40.118Z`): the guard form of getValidQpqIsoDateTime. */
export const isQpqIsoDateTime = (value: unknown): value is QpqIsoDateTime => typeof value === 'string' && getValidQpqIsoDateTime(value) !== undefined;
