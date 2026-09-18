import { z } from 'zod';

import { isQpqPermission } from '../../permission/logic/isQpqPermission';
import { TenantMemberRolesSetRequest } from '../models/TenantMemberRolesSetRequest';

const permission = z.string().refine(isQpqPermission, { message: 'Expected a permission key such as case:approve' });

const selector = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({ kind: z.literal('ids'), ids: z.array(z.string().min(1)) }),
  z.object({ kind: z.literal('resourceKinds'), kinds: z.array(z.string().min(1)) }),
]);

/** Shape of TenantMemberRolesSetRequest; permission keys are checked for form, never against a vocabulary. */
export const tenantMemberRolesSetRequestSchema: z.ZodType<TenantMemberRolesSetRequest, z.ZodTypeDef, unknown> = z.object({
  roles: z.array(z.string().min(1)),
  grants: z.array(z.object({ permission, selector })),
});
