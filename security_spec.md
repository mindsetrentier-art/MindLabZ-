# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Every path not explicitly matched in `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **Strict Owner Isolation (`/users/{userId}`)**: A user profile document at `/users/{userId}` can only be read (`get`), created, updated, or deleted by the authenticated user whose `request.auth.uid == userId`. Collection-wide `list` queries on `/users` are strictly forbidden (`allow list: if false;`) to prevent user enumeration and PII scraping.
3. **Verified Email Enforcement**: All write operations (`create`, `update`, `delete`) require `request.auth != null && request.auth.token.email_verified == true`.
4. **Path Variable & Identity Integrity**: `userId` must match `^[a-zA-Z0-9_\-]+$` with length `1..128`, and `request.resource.data.uid` must equal `request.auth.uid` and `userId`.
5. **Immutable Audit Fields**: `uid` and `createdAt` cannot be modified after creation (`incoming().uid == existing().uid && incoming().createdAt == existing().createdAt`).
6. **Server Timestamp Enforcement**: `createdAt` (on create) and `updatedAt` (on create and update) must equal `request.time`.
7. **Strict Key & Volumetric Boundaries**: No shadow/ghost fields are permitted (`hasAll` + `hasOnly` on create, `affectedKeys().hasOnly(...)` on update). All strings, lists, and maps have explicit `.size()` upper bounds, and numeric fields have strict range bounds.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Identity Spoofing on Create)**: Authenticated user `user_A` attempts to create `/users/user_A` with `uid: "user_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Cross-User Write)**: Authenticated user `user_A` attempts to create or update `/users/user_B`. -> `PERMISSION_DENIED`
3. **Payload 3 (Unverified Email Write)**: Authenticated user `user_A` with `email_verified: false` attempts to create `/users/user_A`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow Field Injection on Create)**: User `user_A` sends a valid payload plus `isAdmin: true` or `role: "superuser"`. -> `PERMISSION_DENIED`
5. **Payload 5 (Shadow Field Injection on Update)**: User `user_A` updates `/users/user_A` with an undeclared field `hackedXP: 999999`. -> `PERMISSION_DENIED`
6. **Payload 6 (Immutable `createdAt` Tampering)**: User `user_A` updates `/users/user_A` and modifies `createdAt` to a new timestamp. -> `PERMISSION_DENIED`
7. **Payload 7 (Immutable `uid` Tampering)**: User `user_A` updates `/users/user_A` and changes `uid` to `"user_B"`. -> `PERMISSION_DENIED`
8. **Payload 8 (Forged Client Timestamp)**: User `user_A` creates or updates `/users/user_A` with `updatedAt` set to a past/future timestamp instead of `request.time`. -> `PERMISSION_DENIED`
9. **Payload 9 (String / Resource Poisoning)**: User `user_A` submits a `name` string exceeding 100 characters (e.g. 500 chars) or `avatar` exceeding 1000 characters. -> `PERMISSION_DENIED`
10. **Payload 10 (Unbounded Array Overflow)**: User `user_A` submits `bookmarks` or `lawsMastered` with 60 items (exceeding max 50) or non-string first element. -> `PERMISSION_DENIED`
11. **Payload 11 (Value Poisoning on Numeric Stats)**: User `user_A` updates `xp` to `-500` or `"infinite"`, or sets `stats.memory` to `999`. -> `PERMISSION_DENIED`
12. **Payload 12 (Cross-User Read & Collection Scraping)**: Authenticated user `user_A` attempts `get` on `/users/user_B` or `list` on `/users`. -> `PERMISSION_DENIED`
