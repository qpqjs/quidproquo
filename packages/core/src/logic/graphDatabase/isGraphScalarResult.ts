import { GraphScalarResult } from '../../config/settings/graphDatabase/types/GraphScalarResult';

/** A cell that is a plain value rather than a node or relationship entity; the same test for every graph vendor. */
export const isGraphScalarResult = (value: unknown): value is GraphScalarResult => typeof value !== 'object' || value === null;
