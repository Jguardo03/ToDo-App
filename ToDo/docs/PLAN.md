# ToDo App — Implementation Plan

Stack: TypeScript · Expo SDK 57 (Expo Router, web + mobile) · Firebase (Cloud Firestore, JS SDK) · Netlify.
Companion file: [`ERD.md`](./ERD.md) (corrected data model).
Working method: agile. **Every phase is one sprint-sized increment that ends with an output you can run or test.** Each phase is written to be executed in a fresh chat context.

## Primary goal

A person opens the deployed web app, types a unique username (no password), and from then on manages their own tasks, subtasks and categories across **Home, Calendar and Categories**. The data persists in Firebase and the screens look like the mockups.

## Priorities (from the brief)

1. Database handlers (a clean data layer between the UI and Firebase).
2. Front-end layers and code organisation (thin routes, reusable components).
3. Reusable components: card, forms, chips, progress, sheets.

## Conventions used in every phase

- Install with `npx expo install <pkg>`, never `npm add` (project `AGENTS.md`). On Windows pass `--` before `--dev`.
- Before touching any Expo/RN API, read the versioned docs `https://docs.expo.dev/versions/v57.0.0/` (project `AGENTS.md`). Expo ships breaking changes each SDK.
- A phase is done only when `npx tsc --noEmit`, `npx expo lint` and `npm test` pass, plus the phase's own checks. (`AGENTS.md`: "Run lint and typecheck before declaring any task done.")
- Routes in `src/app/` stay thin: they read params, call a hook, render a screen component. No Firebase imports in `src/app/` or `src/components/`.
- Commit at the end of each phase. One phase = one reviewable change.

## Target code organisation

```
src/
  app/                      routes only (Expo Router)
    _layout.tsx             providers, fonts, splash
    sign-in.tsx
    (tabs)/_layout.tsx      Home | Calendar | Categories
    (tabs)/index.tsx        Home
    (tabs)/calendar.tsx
    (tabs)/categories.tsx
    task/new.tsx  task/[id].tsx  task/[id]/subtask-new.tsx
    category/[id].tsx  status/[status].tsx
  components/
    ui/                     Button, Chip, Card, TextField, TextArea, DateTimeField, Checkbox,
                            ProgressBar, ProgressRing, Segmented, BottomSheet, EmptyState, IconButton
    task/                   TaskCard, SubtaskRow, TaskForm, SubtaskForm, StatusPicker, PriorityPicker
    category/               CategoryCard, CategoryForm, CategoryPicker
    layout/                 ScreenHeader, TabBar, SideNav, Screen (responsive shell)
  domain/                   types.ts, derive.ts (overdue, progress), validation.ts  — pure TypeScript
  constants/                theme.ts, priorities.ts, statuses.ts
  services/firebase/        config.ts, client.ts
  repositories/             userRepository, categoryRepository, taskRepository, subtaskRepository
  hooks/                    useSession, useTasks, useTask, useCategories, useDueToday …
  context/                  SessionProvider
  utils/                    dates.ts, ids.ts
__tests__/ or *-test.tsx    unit + component tests
docs/                       PLAN.md, ERD.md, skills.md, decisions.md
firestore.rules  firestore.indexes.json  netlify.toml  public/_redirects
```

Layer rule: `app → components → hooks → repositories → services/firebase`. `domain` and `constants` are imported by everyone and import nothing from the layers above.

---

## Phase 0 — Documentation discovery (done)

**How this serves the primary goal:** it fixes the APIs and facts the later phases may rely on, so no phase invents a method that does not exist.

### Allowed APIs and facts (with sources)

| Topic | Fact | Source |
|---|---|---|
| Firebase install | `npx expo install firebase`. Expo SDK supports `firebase@12.0.0` and above only; older versions cause ES-module resolution errors. JS SDK needs no config plugins and works in Expo Go and web. | docs.expo.dev/guides/using-firebase |
| Firebase init | Modular API: `import { initializeApp } from 'firebase/app'` then `initializeApp(firebaseConfig)`. The Expo page does **not** show `getFirestore()` or env vars. Phase 4 reads the Firestore quickstart: firebase.google.com/docs/firestore/quickstart | same |
| Web export | `npx expo export --platform web` → output in `dist/`. Files in `public/` are copied into `dist/`. | docs.expo.dev/router/web/static-rendering |
| Netlify | Build command `npx expo export -p web`, publish directory `dist`. For `web.output: "single"` add `public/_redirects` with `/*    /index.html   200`. For `static` output no redirect is needed, but **dynamic routes such as `[id].tsx` do not work arbitrarily** (need `generateStaticParams`). | docs.expo.dev/guides/publishing-websites, …/static-rendering |
| Fonts | `npx expo install @expo-google-fonts/sora expo-font expo-splash-screen`; `useFonts({...})` in the root layout; hide splash when loaded. Exact Sora export names must be confirmed in the installed package (`@expo-google-fonts/sora` is at 0.4.2 on npm). | docs.expo.dev/develop/user-interface/fonts |
| Testing | `npx expo install jest-expo jest @types/jest --dev` (on Windows add `--` before `--dev`), `@testing-library/react-native`; `"jest": {"preset": "jest-expo"}`; test files end in `-test.ts(x)`. Let `expo install` choose the `jest-expo` version (npm latest is 58.x, project is SDK 57). **SDK 57 correction (found in Phase 2):** Expo Router 57's `renderRouter` renders synchronously, so use `@testing-library/react-native` **13.3** with `react-test-renderer` 19.2.3; RNTL 14 (async render, `test-renderer`) is for SDK 58+. See `decisions.md`. | docs.expo.dev/develop/unit-testing |
| Local storage | `npx expo install @react-native-async-storage/async-storage`; supports Web; unencrypted, so no secrets. | docs.expo.dev/versions/v57.0.0/sdk/async-storage |
| Firestore rules | Rules match **documents** (`match /cities/{city}`), wildcards capture the doc id, unmatched paths are denied, and any matching `true` rule grants access. Field validation uses conditions (`request.resource.data`) — the structure page does not cover it; read the conditions guide in Phase 4. | firebase.google.com/docs/firestore/security/rules-structure |
| Existing project | Expo 57.0.30, React 19.2.3, RN 0.86.3, Expo Router 57, React Compiler + typed routes on, `web.output: "static"`, `@/*` → `src/*`. Template files to replace: `src/app/index.tsx`, `explore.tsx`, `components/app-tabs*.tsx`, `animated-icon*`, `hint-row`, `web-badge`, `ui/collapsible`. | repo |
| Mockups | 18 folders in `ToDo_Mockup/`: `mobile_*` (phone) plus desktop `home`, `calendar`, `categories`, `signIn`, `add_task`, `add_subtask` (side nav). All share one identical `DESIGN.md`, use **Sora** and **Material Symbols Outlined**. Updated 2026-10-18: `home`, `calendar`, `mobile_calendar` aligned to the ERD (no collaborators); `add_task`, `add_subtask` desktop added. Screen-by-screen status and what to ignore: [`mockup-coverage.md`](./mockup-coverage.md). | repo |

### Not yet verified (each is checked inside the phase that needs it — do not assume)

- Icon approach for Material Symbols on web + native (`@expo/vector-icons` vs `expo-symbols`, which is Apple-only): Phase 5.
- Firestore emulator + `@firebase/rules-unit-testing` setup on Windows (needs Java): Phase 4. Fallback: repositories sit behind an interface and are tested against an in-memory fake.
- Persistence/offline options in the Firestore web SDK: Phase 4.

### Anti-patterns to avoid

- `npm add` / `yarn add` for Expo-managed packages.
- `firebase` below 12, or Firebase Auth (the brief says no authentication).
- Importing `firebase/*` from components or routes.
- Storing `overdue` as a field; storing priority/status as free text.
- `allow read, write: if true;` left as the final rules.
- Dynamic routes (`task/[id]`) under `web.output: "static"` without handling (see Phase 6 decision).
- Editing `ios/` or `android/` by hand (generated).

### Mockup vs brief — conflicts to resolve (decisions logged in `docs/decisions.md`)

| Finding | Default decision |
|---|---|
| A **Sign-in** screen exists in the mockups; the brief says 3 main screens and no auth | Keep it as the **username entry gate** (not a main tab). No password. |
| Task detail, add task/subtask, category detail, status detail screens exist | Build them as stack routes *over* the 3 tabs. |
| Collaborators and attachments | **Decided by owner (2026-10-18): out of scope.** Not built, not rendered. The mockups already dropped avatars on `home`, `calendar`, `mobile_calendar`. |
| Leftover non-ERD content in the updated mockups: "Sprint 4 Cycle", "Tokyo Sprint", "Team Alpha", "Google Meet w/ Hiroshi & Elena", "PR #488", "4 active sprints", "+1 since yesterday", "92% velocity" | **Not built.** Where a label has a data-backed equivalent it is replaced (e.g. "92% velocity" → "completion rate" = done ÷ total). Sprint/team/meeting-link/PR number have no ERD field. Full list in `mockup-coverage.md`. |
| Paperclip (attach) icon on `add_task`, `add_subtask` (desktop and mobile) and the markdown toolbar icons | Paperclip **removed**. Description is a plain multi-line field that accepts markdown text; keep the "Markdown ok" hint, no toolbar. |
| Mockups not yet updated and still carrying collaboration/sprint content: `mobile_task` (avatars), `mobile_status`, `mobile_category_registry`, `mobile_add_task`/`mobile_add_subtask` (paperclip, "Sprint 44"), `categories`, `mobile_categories` (images/avatars) | Build to the ERD, not to the pixels, for those elements. Ask the owner to refresh these mockups only if the layout around the removed element needs redesign. |
| `mobile_calendar` selected day pill says **THU 17** while the header says **Wednesday, 17 Jan** (desktop `calendar` has WED 17) | Mockup typo. Weekday comes from the real date. |
| Calendar "free" rows (Lunch / Offline recharge, Daily stand-down) and "quick block" | Not tasks. Render only gaps between tasks as an empty "Add new subtask / quick block" row; no stored non-task blocks. |
| Bell (notifications), "Quick search (Cmd+K)", Day/Week/Month toggle, Fast Book | Bell and global search: **not now**. Fast Book = "New Task" pre-filled with the selected day. Day/Month toggle: not now (the page already has a week strip + day timeline + mini month picker). |
| `DESIGN.md` prose (bone canvas `#F7F6F2`, hard drop shadows) differs from its token block (`surface #fbf8ff`, `primary #b7004f`) and from the screenshots | Screenshots + token block win. Tokens go in `src/constants/theme.ts`. |
| Some screenshots (add task, categories) render in a serif font | Mockup rendering artefact: their `code.html` loads Sora. Use Sora everywhere. |

---

## Phase 1 — Find skills to support the project

**How this serves the primary goal:** the later phases (Firestore, Expo UI, tests, Netlify) each have an official skill; installing them first makes every sprint follow vendor guidance instead of memory.

**Already available in this environment** (no install needed): `firebase-basics`, `firebase-firestore`, `firebase-security-rules-auditor`, `find-skills` (installed in this repo at `.agents/skills/find-skills`).

**What to do** (use the `find-skills` workflow: check source reputation and install counts before recommending):

1. Run these searches and record results in `docs/skills.md` (name, source, install count, link, verdict):
   - `npx skills find expo`, `expo router`, `expo building native ui`
   - `npx skills find firebase firestore`, `firestore security rules`
   - `npx skills find react native testing`
   - `npx skills find netlify deploy`
2. Candidates already found (counts from the search run on 2026-10-16; re-check before installing):

| Skill | Why | Installs |
|---|---|---|
| `expo/skills@expo-native-ui` (was `building-native-ui`, renamed in the repo) | UI patterns for Expo apps (Phases 5–10) | 28.9K |
| `expo/skills@expo-router` | Routing/layout conventions (Phases 2, 6) | 25.4K |
| ~~`expo-deployment`~~, ~~`native-data-fetching`~~ | No longer in the repo / not a fit (Firestore, Netlify) | — |
| `firebase/agent-skills@firestore-rules-creation` | Writing rules (Phase 4) | 20.2K |
| `callstack/react-native-testing-library@react-native-testing` | Component tests (Phases 2, 5+) | 5.2K |
| `netlify/context-and-tools@netlify-deploy` and `@netlify-config` | `netlify.toml`, deploy (Phase 6) | ~3.1K |
| `mattpocock/skills@tdd` | Test-first workflow for repositories | 1.1M |

   Skip: `designed-by-ai/skills@design-mobile-apps` (829K) unless vetted — the mockups already define the design; agile/user-story skills under 500 installs.
3. Install only the approved ones at **project level** (no `-g`): `npx skills add <owner/repo@skill> -y`. Review each `SKILL.md` first — the installer warns that skills run with full agent permissions.
4. Write `docs/skills.md` with a one-line "use this skill in Phase N" per skill.

**Documentation references:** `.agents/skills/find-skills/SKILL.md` (steps 2–6), https://skills.sh/.

**Testable output (verification):**
- `docs/skills.md` exists and lists every installed skill with source and install count.
- `npx skills list` (or the entries in `skills-lock.json`) shows exactly the approved skills.
- Each installed skill folder contains a `SKILL.md` that was read before install.

**Anti-patterns:** installing globally; installing anything under ~100 installs or from an unknown owner without telling the owner; adding a skill that duplicates one already available.

---

## Phase 2 — Foundations: tooling, folders, theme, empty 3-tab shell

> **Status: done 2026-10-18.** Typecheck, lint and 9 tests pass; verified in the browser at 390 px and 1280 px. Decisions and deviations: `decisions.md` ("Phase 2"). Not yet committed.

**How this serves the primary goal:** every later screen needs the same test setup, folder rules, design tokens and navigation frame; doing it once keeps the rest consistent.

**What to implement:**
1. Install test tooling exactly as in Phase 0 (jest-expo, jest, @types/jest, @testing-library/react-native) and add `"test": "jest"` (keep `--watchAll` for a separate `test:watch`).
2. Create the folder tree above (empty `index.ts` barrels only where needed).
3. Remove the template demo files listed in Phase 0 ("Existing project").
4. Port design tokens from `ToDo_Mockup/home/DESIGN.md` (colour block, typography scale, radius, spacing) into `src/constants/theme.ts`. **Copy** token values; keep the existing `Spacing`/`Colors` export shape where it still fits.
5. Load Sora with `useFonts` in `src/app/_layout.tsx` (pattern in Phase 0, fonts page).
6. Replace tabs with **Home / Calendar / Categories** plus the centred "+" action (route `task/new`), following `mobile_home/screen.png` bottom bar. Each tab renders a titled placeholder.
7. Add `docs/decisions.md` with the conflict table from Phase 0.

**Documentation references:** Phase 0 table (testing, fonts); `ToDo_Mockup/home/DESIGN.md`; Expo Router docs for the installed SDK (tabs).

**Verification checklist (testable output):**
- `npm test` runs and passes one smoke test per tab ("renders title").
- `npx tsc --noEmit`, `npx expo lint` pass.
- `npx expo start --web` shows three tabs in Sora with the theme colours; "+" navigates to a placeholder `task/new`.
- `grep -r "explore" src/` returns nothing.

**Anti-patterns:** leaving template components; hard-coding colours inside components; putting logic in route files.

---

## Phase 3 — Data contract: corrected ERD → TypeScript domain

> **Status: done 2026-10-18.** 60 new unit tests (69 in total) pass; typecheck and lint clean. Decisions: `decisions.md` ("Phase 3"). Not yet committed.

**How this serves the primary goal:** one agreed data model means the database layer and the screens cannot drift apart.

**What to implement:**
1. Owner reviews `docs/ERD.md` and confirms the one still-open point (4, no per-user protection without auth; default applies). Log answers in `docs/decisions.md`.
2. `src/domain/types.ts`: `User`, `Category`, `Task`, `Subtask`, `Priority`, `Status`, plus `NewTask`/`NewSubtask`/`NewCategory` input types (no ids or timestamps).
3. `src/constants/priorities.ts` and `statuses.ts`: the fixed lookup entities (`key`, `name`, `color`, `description`) — values from the mockups' chips.
4. `src/domain/derive.ts`: `isOverdue(task, now)`, `progress(task)`, `displayStatus(task, now)` (adds `overdue`), `categoryStats(tasks)`.
5. `src/domain/validation.ts`: username rule (`^[a-z0-9_]{3,20}$` after lowercasing — confirm in decisions), name length, colour as hex.
6. Pure functions take `now` as a parameter so tests need no clock mocking.

**Documentation references:** `docs/ERD.md` (all tables), mockups `mobile_task`, `mobile_category_registry`, `mobile_status` for the derived values.

**Verification checklist (testable output):**
- Unit tests: overdue boundary (due exactly `now`, done tasks never overdue), progress with 0/3/5 subtasks, username accepted/rejected cases, `displayStatus` mapping.
- `npm test` green; no import of `firebase` or `react-native` anywhere under `src/domain` (`grep` check).

**Anti-patterns:** adding an `overdue` stored status; `any` types; Firestore `Timestamp` types leaking into `domain` (domain uses `Date`).

---

## Phase 4 — Firebase setup and database handlers (repositories)

> **Status: done 2026-10-18.** Repositories (Firestore and in-memory), prototype rules, smoke script. The same 29-case contract passes against the in-memory fake (`npm test`) and against the real project `todo-e618b` (`npm run test:firestore`); `npm run db:smoke` passes 14 checks; rules are deployed. Not run on an emulator. Decisions: `decisions.md` ("Phase 4"). Not yet committed.

**How this serves the primary goal:** this is the persistence layer — without it nothing a user types survives a refresh.

**What to implement:**
1. Owner creates the Firebase project and a Cloud Firestore database, and supplies the web app config (the agent does not create cloud resources or paste secrets). Config goes in `.env.local` as `EXPO_PUBLIC_FIREBASE_*`; commit `.env.example`; confirm `.env*.local` is git-ignored. (Expo env-var behaviour: confirm in https://docs.expo.dev/guides/environment-variables/ before use.)
2. `npx expo install firebase` (must resolve to ≥12). `src/services/firebase/config.ts` + `client.ts` exporting a single `db` (`initializeApp`, then `getFirestore` — signature confirmed from the Firestore quickstart, see Phase 0).
3. Repositories (one file each, all functions take `username`), each exposing an interface so a fake can replace it in tests:
   - `userRepository`: `exists(username)`, `create(username)`, `touch(username)`.
   - `categoryRepository`: `list`, `get`, `create`, `update`, `remove` (blocked or re-homed when tasks exist — decide and log), `subscribe`.
   - `taskRepository`: `create`, `get`, `update`, `remove`, `setStatus`, `listByDay(day)`, `listByCategory(id)`, `listByStatus(status)`, `listDueToday`, `subscribe…`.
   - `subtaskRepository`: `create`, `toggle`, `update`, `remove`, `list` — **each write updates the parent's `subtaskTotal`/`subtaskDone` in the same transaction/batch.**
   - Mapping functions Firestore document ⇄ domain type (Timestamp ⇄ Date) live next to each repository.
4. `firestore.rules`: only the four paths in `ERD.md` match; validate field types, enums and size limits; everything else denied. State plainly in `docs/decisions.md` that without auth the rules cannot restrict by user.
5. `firestore.indexes.json`: **empty by design.** Category and status lists use an equality filter and are sorted in code, so no composite index is needed (see `decisions.md`).
6. Tests: preferred = Firestore emulator + `@firebase/rules-unit-testing` (verify Windows/Java setup first using the installed `firebase-firestore` skill). Fallback = in-memory fake of the repository interfaces, plus rules reviewed with the `firebase-security-rules-auditor` skill.

**Documentation references:** Phase 0 (Firebase, Firestore rules rows); Firestore quickstart; Firestore "data model" and "query" docs; skills `firebase-firestore`, `firestore-rules-creation`, `firebase-security-rules-auditor`.

**Verification checklist (testable output):**
- Repository tests: create → read → update → delete for each entity; subtask toggle changes the parent counters; `listByDay` returns only that day.
- A script (`npm run db:smoke`) writes and reads one user + category + task + subtask against the real Firebase project, then deletes them.
- Rules tests (or auditor report): a write with a bad `priority`, a missing `name`, or an unknown path is rejected.
- `grep -rn "firebase/" src/ | grep -v "services/firebase\|repositories"` returns nothing.

**Anti-patterns:** Firebase Auth; Firestore calls inside components; storing `overdue`; one read per subtask to compute progress; leaving `allow read, write: if true`.

---

## Phase 5 — Reusable component library (with a visual test page)

> **Status: done 2026-10-18.** 20 components, `/__gallery` and `/__gallery/forms`, 62 new tests (184 in total); typecheck and lint clean; checked in the browser at 390 px and 1280 px. Decisions: `decisions.md` ("Phase 5"). Not yet committed.

**How this serves the primary goal:** the cards, forms and chips are reused on every screen; building them once against the mockups gives the "looks like the mockups" result cheaply.

**What to implement** (each component: typed props, theme tokens only, no data fetching):
1. `ui/`: `Button` (primary / accent / ghost), `Chip`, `Card`, `TextField`, `TextArea`, `DateTimeField`, `Checkbox`, `ProgressBar`, `ProgressRing`, `Segmented`, `BottomSheet`, `EmptyState`, `IconButton`.
2. `task/`: `TaskCard` (variants: home row with ring, category row with bar, status row), `SubtaskRow`, `PriorityPicker`, `StatusPicker`, `TaskForm`, `SubtaskForm`; `category/`: `CategoryCard`, `CategoryForm`, `CategoryPicker`.
3. Forms use controlled props and `validation.ts` from Phase 3; they emit `NewTask`/`NewSubtask`/`NewCategory`. **Forms are responsive:** one column on phones (`mobile_add_task`, `mobile_add_subtask`); on desktop (`add_task`, `add_subtask`) a two-column layout — main card (name, description, subtasks), side card (date & time, category, priority) and an action card (Cancel / Save), with the same Cancel / primary buttons repeated in the page header. Build this as `FormLayout` in `components/layout/` so Task, Subtask and Category forms share it.
   - `TaskForm`: inline subtasks list shows name, due date, category chip (inherited), description; inline subtasks inherit the task's priority (editable in the full subtask form).
   - `SubtaskForm`: top "Parent task" card shows parent name, due date, category and a **short id** (first 6 characters of the Firestore id; the mockup's `TSK-0842` code has no ERD field); category chip is locked ("Inherited from parent"); due-date field shows a relative badge ("In 3 days") computed in `utils/dates.ts`.
   - No attachment control, no markdown toolbar (see Phase 0 conflicts).
   - Add `QuickAddCard` (Home desktop "Quick Execution"): text input + date / priority / category icon buttons + "Fast Submit". Submit stays disabled until a name **and** a category are chosen (category is required by the ERD; owner-confirmed 2026-10-18).
4. Icons: **decided:** `expo-symbols` `SymbolView` behind our `Icon` component (Material Symbols on web and Android, SF Symbols on iOS); verified on web.
5. A dev-only route `src/app/__gallery.tsx` rendering every component in every state (hidden in production builds).

**Documentation references:** `ToDo_Mockup/*/code.html` for the exact structure of each component; `DESIGN.md` "Components" section; skill `building-native-ui`.

**Verification checklist (testable output):**
- Component tests (React Native Testing Library): `TaskCard` shows title, due text, progress; `TaskForm` blocks submit with empty name and emits the right payload; `Checkbox` toggles; `PriorityPicker` selects one value.
- Open `/__gallery` on web at 375 px and 1280 px and compare against `screen.png` files side by side.
- No component file imports from `repositories/` or `firebase` (grep).

**Anti-patterns:** copying HTML/Tailwind class strings from `code.html` as-is (use RN `StyleSheet` + tokens); per-screen one-off cards.

---

## Phase 6 — Username session, sign-in screen, and first Netlify deploy

> **Status: code done 2026-10-18; the Netlify deploy is yours.** Config committed in `532091f`. Sign-in, session, route guard and sign-out are built and tested (212 tests); checked in the browser against the real Firebase project. Remaining: push to GitHub, create the Netlify site with the three environment variables, and check `/calendar` refreshes without a 404 on the live URL. Not yet committed (sign-in code).

**How this serves the primary goal:** this is the "access your list by a unique username" requirement, and deploying now proves the whole chain (Expo → Firebase → Netlify) before the feature screens exist.

**What to implement:**
1. `SessionProvider` + `useSession`: holds `username`, restores it from AsyncStorage on load, exposes `signIn(username, mode)` and `signOut()`. Keeps a list of recent usernames on the device (the mockup's "Previously active on this device").
2. `sign-in.tsx` per `mobile_signIn` / `signIn`: **Returning User** requires the username to exist; **New User** requires it to be free (`userRepository.exists`) then creates it. Show validation errors from Phase 3.
3. Route guard in `_layout.tsx`: no session → `/sign-in`; session → tabs. Sign-out action available (settings icon / desktop sidebar footer).
4. **Decision — routing mode.** `task/[id]` and `category/[id]` are runtime ids, which do not work under `web.output: "static"` (Phase 0). Default: change `app.json` → `web.output: "single"` and add `public/_redirects` with `/*    /index.html   200`. Log in `decisions.md`.
5. Netlify: `netlify.toml` with build `npx expo export -p web`, publish `dist`; connect the repo in Netlify; set the `EXPO_PUBLIC_FIREBASE_*` variables in the Netlify UI (owner action).

**Documentation references:** Phase 0 Netlify rows; skills `netlify-deploy`, `netlify-config`, `expo-deployment`; mockups `signIn`, `mobile_signIn`.

**Verification checklist (testable output):**
- Tests: new username → created and session set; taken username as New User → error; unknown username as Returning User → error; session survives reload (storage mock).
- `npx expo export -p web` succeeds locally; `npx serve dist` opens, and a hard refresh on `/calendar` does not 404.
- Public Netlify URL loads, sign-in works end to end, and the new user document is visible in the Firebase console.

**Anti-patterns:** passwords or Firebase Auth; storing the username only in memory; leaving `static` output with dynamic routes.

---

## Phase 7 — Home screen and Add Task

> **Status: done 2026-10-18.** Home (phone and desktop), the Add Task flow with an in-form category sheet, data hooks, and a placeholder status page. 261 tests pass (49 new); checked in the browser against the real Firebase project (new user, new category, task with subtask, tick to done), then the test user was deleted. Decisions: `decisions.md` ("Phase 7"). Not yet committed.

**How this serves the primary goal:** Home is where users see what is due; Add Task is how data gets in. Together they make the app usable for the first time.

**What to implement:**
1. Home per `mobile_home` / `home`: greeting + remaining count; four stat cards (Overdue, In Process, Completed, Pending) that link to `status/[status]`; "Due today" list of `TaskCard`s with progress rings; empty state per `mobile_home_empty_stage`.
   - Stat-card secondary lines use only derivable values: Completed → completion rate (done ÷ total); In Process → count; Pending → "queued". Drop "+1 since yesterday", "active sprints" and the "Sprint 4 Cycle" label.
   - Desktop only: "Due Today" has Priority sort and All-Categories filter; right column has `QuickAddCard` and "Today's Schedule" (today's tasks with `startAt`–`dueAt`, a "Current" badge when now is inside the range, category name as the right-hand tag, device time-zone label instead of the hard-coded `UTC+09:00`). Task cards show priority and category chips, description (truncated), "N subtasks", ring and "done / total finished" — no assignees.
2. Hooks `useDueToday`, `useStatusCounts` on top of repositories; counts use `displayStatus` from Phase 3.
3. Add Task (`task/new`, from "+" and the empty state) per `mobile_add_task`: name, due date-time, markdown description, category picker (with inline "New" → `CategoryForm` sheet), priority, optional inline subtasks.
4. Checking a task on Home marks it done (`setStatus`).

**Documentation references:** mockups above; `TaskCard`, `TaskForm`, `Checkbox` from Phase 5; `taskRepository` from Phase 4.

**Verification checklist (testable output):**
- Component tests with a fake repository: loading → list → empty state; completing a task updates the counters.
- Manual script: sign in → "Add First Task" → fill form → task appears in Home → refresh → still there → visible in Firestore.
- Responsive check at 375 px and 1280 px (desktop uses the side nav layout of `home/screen.png`).

**Anti-patterns:** calling repositories from the screen file; computing "overdue" in the component instead of `derive.ts`.

---

## Phase 8 — Task detail, subtasks and Status detail

> **Status: done 2026-10-18** (with optimistic ticks folded in, as agreed). Task page, edit and delete with confirmation, subtask add/edit/delete/tick, status lists, Home rows open tasks. 313 tests pass (52 new); typecheck and lint clean. Checked in the browser against the real Firebase project (open task, tick a subtask, reload, delete with confirmation), then the test user was deleted. Decisions: `decisions.md` ("Phase 8"). Not yet committed.

**How this serves the primary goal:** breaking a task into subtasks and moving it through its states is the core daily loop.

**What to implement:**
1. `task/[id]` per `mobile_task`: tags, due date, description, execution progress, lifecycle selector, subtask list with checkboxes (strike-through and "Completed hh:mm" when done), "Add" subtask, "Finish Task".
2. `task/[id]/subtask-new` per `mobile_add_subtask` and desktop `add_subtask`: category shown locked/inherited from the parent; parent summary card without "Sprint"/"Team" fields.
3. Edit and delete task; edit and delete subtask (confirm before delete).
4. `status/[status]` per `mobile_status`: list of tasks in that state + "Add Task to Status".
5. Rule: finishing the last subtask offers "Finish Task"; "Finish Task" sets `status=done` and `completedAt`.

**Verification checklist (testable output):**
- Tests: toggling a subtask updates progress 3/5 → 4/5 and the percent; "Finish Task" sets `done`; delete asks confirmation; subtask category equals the parent's.
- Manual: create a task with 5 subtasks, complete 3, reload → 60% persists.

**Anti-patterns:** storing category on the subtask; recomputing progress by re-reading all subtasks in list screens (use the counters).

---

## Phase 9 — Categories

**How this serves the primary goal:** categories are one of the three required screens and organise every task.

**What to implement:**
1. Categories grid per `mobile_categories` (with "New Category" card; empty state per `mobile_categories_empty_stage`); search icon filters by name.
2. `category/[id]` per `mobile_category_registry`: header, done ratio, urgent/overdue count, task list (`TaskCard` bar variant), "Add Task to Category" (pre-selects the category).
3. Create / edit / delete category with `CategoryForm` (name, description, colour); define the delete behaviour from Phase 4.

**Verification checklist (testable output):**
- Tests: card counts equal task counts; done ratio math; create → appears; delete with tasks follows the logged rule.
- Manual: create "Design", add two tasks, mark one done → ratio 50%.

**Anti-patterns:** hard-coding the four sample categories; per-category screens built separately instead of reusing the list component.

---

## Phase 10 — Calendar

**How this serves the primary goal:** Calendar is the third required screen and the only time-based view of the user's work.

**What to implement:**
1. Calendar per `mobile_calendar` / `calendar`: week strip with selected day, previous/next week, timeline of the selected day built from `listByDay`; tasks with `startAt`/`dueAt` show as time blocks (category tag, title, description, time range, "N subtasks" + progress bar, priority chip), others listed at their due time; empty state per `mobile_calendar_empty_stage`. Header subtitle shows the week number only (no "Tokyo Sprint").
   - Desktop only: mini month picker (dot under days that have tasks) and **Filter Category** list with per-category task counts and checkboxes (filters the timeline). "Fast Book" opens `task/new` with the selected day pre-filled. Skip: bell, Cmd+K search, Day/Week/Month toggle, "Google Meet" and "PR #" chips, stored lunch/stand-up blocks.
2. Tapping a block opens `task/[id]`; "Add new subtask…" row opens the subtask form for that task.
3. Day/time helpers live in `utils/dates.ts` (week start, same-day, time ranges) with tests; decide week start (Mon, per mockup) and time-zone handling (device local) in `decisions.md`.

**Verification checklist (testable output):**
- Tests: `dates.ts` edge cases (week start, midnight boundary, DST day); a task at 23:30 appears on the right day.
- Manual: create tasks for today and tomorrow → each appears only on its own day; empty day shows the empty state.

**Anti-patterns:** loading all tasks and filtering client-side for a single day; UTC-vs-local mixups.

---

## Phase 11 — Responsive layout, states, accessibility

**How this serves the primary goal:** the product is a web app; it must work on a phone-sized browser and on a desktop, with loading and error states instead of blank screens.

**What to implement:**
1. `Screen` shell: bottom bar below ~768 px, side nav (as in `home/screen.png`) above; content width capped (`MaxContentWidth` in theme). Side nav = brand, "New Task" button, Home / Calendar / Categories, and the signed-in `@username` with a sign-out button at the bottom (replaces the "ONLINE" label with nothing or a real sync indicator). Top bar = breadcrumb + today's date.
2. Shared loading skeleton, error banner with retry, and offline notice for every list.
3. Accessibility pass: labels on icon buttons, 44–48 px touch targets (mockup requires 48 px), contrast of chips, keyboard focus on web.

**Verification checklist (testable output):**
- Screenshots of all three tabs at 375 px and 1280 px stored in `docs/screenshots/` and compared with the mockups.
- Disconnect network → error/offline state shows, no crash.
- Lighthouse accessibility score reported (target set in `decisions.md`).

---

## Final phase — Verification

**How this serves the primary goal:** it proves the deployed app does what the primary goal says, against documentation and the mockups.

1. `npx tsc --noEmit`, `npx expo lint`, `npm test`, `npx expo-doctor` all pass.
2. Grep guards: no `firebase/` import outside `src/services/firebase` and `src/repositories`; no `overdue` written to Firestore; no template leftovers (`explore`, `animated-icon`); no hard-coded hex colours in `src/components` (all from theme).
3. Walk the golden path on the **Netlify URL** from a clean browser profile: sign in as a new user → add category → add task with subtasks → see it on Home, Calendar, Categories → complete subtasks → reload → data persists → sign out → sign in as returning user.
4. Compare each screen with its `screen.png`; list any deliberate differences in `decisions.md`.
5. Re-run the rules tests / auditor and confirm the deployed Firestore rules match `firestore.rules`.
6. Update `README.md` (run, test, deploy) and tag the release.

## Not in scope

Authentication/passwords · collaborators and assignees (owner decision 2026-10-18) · attachments (owner decision 2026-10-18) · notifications bell and push · global search · Day/Month calendar toggle · sprints/teams/projects as separate entities · native store builds (EAS) · per-user data protection (needs auth — see `ERD.md` open point 4).
