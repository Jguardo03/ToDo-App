# Skills for this project

Phase 1 of [`PLAN.md`](./PLAN.md). Searched 2026-10-18 with `npx skills find`, installed at **project level** (no `-g`) into `.agents/skills/` at the repo root, symlinked to `.claude/skills/`. Versions are pinned by hash in `skills-lock.json`.
Each `SKILL.md` was downloaded and read before install; all six passed the installer's scan (Gen: Safe, Socket: 0 alerts, Snyk: Low Risk).

## Installed

| Skill | Source (owner, repo stars) | Installs | Use in phase | Notes |
|---|---|---|---|---|
| `find-skills` | vercel-labs/skills | (installed earlier) | 1 | Discover more skills |
| `expo-router` | expo/skills (Expo org, 2.9K stars) | 25.4K | 2, 6, 8 | Routes, groups, dynamic routes, stack, sheets, tabs |
| `expo-native-ui` | expo/skills | 28.9K | 5, 7–11 | Layout, responsiveness, code style, library preferences. Its Apple-HIG styling and SF Symbols advice **does not override the mockups**; `DESIGN.md` wins |
| `firestore-rules-creation` | firebase/agent-skills (Firebase org, 472 stars) | 20.9K | 4 | Writing and hardening `firestore.rules`. Its auth-based patterns do not apply (no authentication); validate shape and size only |
| `react-native-testing` | callstack/react-native-testing-library (Callstack, 3.4K stars) | 5.2K | 2, 5–10 | RNTL v14 (React 19, async `render`) matches this project |
| `netlify-deploy` | netlify/context-and-tools (Netlify org, 41 stars) | 3.2K | 6, final | Git-based CD, deploy contexts. Do not use `--allow-anonymous` |
| `netlify-config` | netlify/context-and-tools | 3.1K | 6 | `netlify.toml`, `_redirects`, SPA fallback `/*  /index.html  200` |

## Already available in this environment (not installed in the repo)

`firebase-basics`, `firebase-firestore` (Phase 4 data modelling, queries, SDK), `firebase-security-rules-auditor` (Phase 4 and final review).

## Changes from the original shortlist

| Original | Outcome | Why |
|---|---|---|
| `expo/skills@building-native-ui` (58.1K) | Replaced by `expo-native-ui` | The skills.sh index still lists the old name. The `expo/skills` repository no longer contains it; `expo-native-ui` is the current skill |
| `expo/skills@expo-deployment` (40.2K) | Dropped | Not in the repo any more. Its successors (`eas-hosting`, `eas-workflows`) target EAS Hosting, not Netlify |
| `expo/skills@native-data-fetching` | Not installed | Renamed `expo-data-fetching`; focused on REST/React Query. We use Firestore behind repositories |
| `mattpocock/skills@tdd` (1.1M) | Not installed | Optional; individual author. Add if you want a strict test-first workflow |

## Optional additions (not installed, say if wanted)

- `expo/skills@expo-project-structure`: folder-organisation guidance, relevant to the "code organisation standards" priority.
- `expo/skills@expo-design-system`: design-token guidance for Phase 2 and 5.
- `expo/skills@expo-data-fetching`: loading / empty / error screen-state patterns for Phase 11.

## Cautions

- Skills run with full agent permissions. Re-read a skill after `npx skills update`.
- `expo-native-ui` and `expo-router` end with a "Submitting Feedback" section that runs `npx --yes submit-expo-feedback@latest`. That sends feedback to a third party; **do not run it unless the owner asks**.
- Install counts on skills.sh can be stale after a skill is renamed. Check the source repository before installing.
