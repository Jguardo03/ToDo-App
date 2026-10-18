# Firestore rules audit (prototype)

File audited: [`firestore.rules`](../firestore.rules) · Method: the `firebase-security-rules-auditor` checklist, applied by hand on 2026-10-18 · **Verification status (2026-10-18):** the rules compile and are deployed to `todo-e618b`, and the 29-case repository contract passes against them on the real project. The security statements below remain a hand review, not a guarantee; the rules have no tests of their own that try to break them.

## Result

**Score 1 of 5 (Critical) for any public or multi-user use. Accepted for the current scope.**

The rules are a prototype. The one critical finding follows directly from the brief ("no authentication"): without a signed-in identity the rules cannot tell one visitor from another, so they cannot protect one user's list from another visitor. Everything else below is minor or moderate and comes from the same cause.

> I've set up prototype Security Rules to keep the data in Firestore well-formed. They enforce the data shape, types, enum values, size limits and allowed paths, and they stop the list of usernames from being enumerated. They do **not** protect any user's data from someone who knows that username. You should review and verify them before broadly sharing the app.

## Findings

| # | Check | Severity | Issue | Recommendation |
|---|---|---|---|---|
| 1 | Authority source / unauthorized access | **Critical** (accepted) | Anyone who knows a username and the public project config can read, change and delete that user's categories, tasks, subtasks and user document. Usernames are guessable handles, not secrets. | Accepted by the owner (no authentication). If this ever matters: add Firebase Anonymous Auth plus an owner field, or real sign-in, and switch the rules to ownership checks. |
| 2 | Storage abuse | **Moderate** | Text fields have size limits and ids are restricted, but nothing limits how many users or documents can be created, or how fast. A script can fill the database and run up the bill. | Turn on **Firebase App Check** (reCAPTCHA for web) so only the real app can call Firestore. Set a **budget alert** in Google Cloud. Neither can be done from this repository. |
| 3 | Update bypass | Minor | Create and update use the same validators, and `createdAt` is immutable. However, `subtaskTotal` / `subtaskDone` on a task are client-written: a modified client can set counters that do not match the subtasks. Impact: wrong progress on that user's own task. | Accept. The counters are a performance denormalisation, not a security boundary. |
| 4 | Business logic vs. rules | Minor | No status-transition rules (a task can jump from `pending` to `done`); intended, the UI allows it. `completedAt` is not tied to `status` in the rules. | Accept. |
| 5 | Type safety | Pass | Every field is type-checked (`is string`, `is int`, `is timestamp`), enums are whitelisted, unknown fields are rejected (`hasOnly`), required fields are enforced (`hasAll`) on create and update. | — |
| 6 | Data integrity across documents | Minor | There is no cascade delete in rules. A modified client could delete a task and leave its subtasks, or delete a user document and leave its collections. The real app deletes subtasks with the task. | Accept; orphaned data is only reachable by someone who knows the ids. |
| 7 | Time fields | Minor | `createdAt` / `updatedAt` come from the client clock and are not compared with `request.time`. | Accept. Using server timestamps would complicate the offline-friendly repository tests. |
| 8 | Username probing | Minor | `get` on `users/{username}` is allowed so sign-in can check a name, which also lets anyone test whether a handle exists. Listing users is denied. | Accept; required by the sign-in design. |
| 10 | Found by running, not by review | Minor (fixed) | List queries were denied because `read` rules referenced the document id, which is not bound for a list. Fixed by splitting `get` and `list`. | Keep the real-Firestore contract run (`npm run test:firestore`) as the check for every rules change. |
| 9 | Cost | Minor | Creating a task or category runs one `exists()` read on the user (and the category), and updating a task's category runs one more. | Accept for this scale. |

## What would change the score

Only an identity. With Firebase Authentication (even anonymous) and an owner check on every path, findings 1 and 2 drop to minor and the score would be 4. That is a product decision (it conflicts with "no authentication"), so it is not done here.

## How to verify the rules (needs JDK 21+ or a Firebase project)

1. **Syntax and deploy check:** `npx firebase-tools deploy --only firestore:rules --dry-run` (needs `firebase login`). Done: compiles.
2. **Behaviour against the real project:** `npm run test:firestore` (29 cases; creates and deletes `ct...` users) and `npm run db:smoke` (14 checks). Done: both pass.
3. **Behaviour in an emulator (optional, JDK 21+):** set `EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` and run the same suite.
