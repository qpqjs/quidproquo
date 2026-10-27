---
title: askUserDirectoryGetUsersByAttribute
description: Find users in a directory by matching a profile attribute value.
---

# askUserDirectoryGetUsersByAttribute

Finds users in a [user directory](../../../config/core/user-directory.md) whose given attribute matches a value, returning a page of results.

- **Action type:** `UserDirectoryActionType.GetUsersByAttribute`
- **On AWS:** issues Cognito `ListUsers` with a filter on the requested attribute.

```typescript
import { askUserDirectoryGetUsersByAttribute } from '@qpqjs/core';

export function* askFindByEmail(email: string) {
  const page = yield* askUserDirectoryGetUsersByAttribute('app-users', 'email', email);
  return page.items;
}
```

## Signature

```typescript
function* askUserDirectoryGetUsersByAttribute(
  userDirectoryName: string,
  attribueName: keyof UserAttributes,
  attribueValue: string,
  limit?: number,
  nextPageKey?: string,
): AskResponse<QpqPagedData<UserAttributes>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `attribueName` | `keyof UserAttributes` | The attribute to filter on (e.g. `'email'`). Must be a searchable [UserAttributes](./ask-user-directory-get-user-attributes.md#userattributes) key. |
| `attribueValue` | `string` | The value to match. |
| `limit` | `number` | Optional. Maximum number of users to return in this page. |
| `nextPageKey` | `string` | Optional. The `nextPageKey` from a previous page; omit to fetch the first page. |

## Returns

`QpqPagedData<UserAttributes>` — a page of matching [user attributes](./ask-user-directory-get-user-attributes.md#userattributes) plus an optional `nextPageKey`. See [QpqPagedData](./ask-user-directory-get-users.md#returns).

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryGetUsersByAttributeErrorTypeEnum.InvalidSearchParameters` | The attribute name/value, limit, or page key is invalid, or the attribute is not searchable. |
| `UserDirectoryGetUsersByAttributeErrorTypeEnum.LimitExceeded` | The directory is throttling requests; back off and retry later. |

## Related

- [askUserDirectoryGetUsers](./ask-user-directory-get-users.md) — list all users without a filter.
- [askUserDirectoryGetUserAttributes](./ask-user-directory-get-user-attributes.md) — read a single user's attributes.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
