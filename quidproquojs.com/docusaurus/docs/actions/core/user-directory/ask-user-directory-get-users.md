---
title: askUserDirectoryGetUsers
description: List users in a directory, one page at a time.
---

# askUserDirectoryGetUsers

Lists the users in a [user directory](../../../config/core/user-directory.md), returning a page of attributes plus a key for fetching the next page.

- **Action type:** `UserDirectoryActionType.GetUsers`
- **On AWS:** issues Cognito `ListUsers`, paging through the pool.

```typescript
import { askUserDirectoryGetUsers } from '@qpqjs/core';

export function* askListAllUsers() {
  const users = [];
  let nextPageKey: string | undefined = undefined;

  do {
    const page = yield* askUserDirectoryGetUsers('app-users', nextPageKey);
    users.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return users;
}
```

## Signature

```typescript
function* askUserDirectoryGetUsers(
  userDirectoryName: string,
  nextPageKey?: string,
): AskResponse<QpqPagedData<UserAttributes>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `nextPageKey` | `string` | Optional. The `nextPageKey` from a previous page; omit to fetch the first page. |

## Returns

`QpqPagedData<UserAttributes>`:

```typescript
interface QpqPagedData<T> {
  nextPageKey?: string;
  items: T[];
}
```

- `items` — the [user attributes](./ask-user-directory-get-user-attributes.md#userattributes) for this page.
- `nextPageKey` — pass into the next call to continue paging; absent on the last page.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryGetUsersErrorTypeEnum.InvalidPageKey` | The supplied `nextPageKey` is malformed or no longer valid. |
| `UserDirectoryGetUsersErrorTypeEnum.LimitExceeded` | The directory is throttling requests; back off and retry later. |

## Related

- [askUserDirectoryGetUsersByAttribute](./ask-user-directory-get-users-by-attribute.md) — filter users by an attribute value.
- [askUserDirectoryGetUserAttributes](./ask-user-directory-get-user-attributes.md) — read a single user's attributes.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
