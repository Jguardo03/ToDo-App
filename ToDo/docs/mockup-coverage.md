# Mockup coverage

Folder: `ToDo_Mockup/` · Checked 2026-10-18 · Rule: **the ERD ([`ERD.md`](./ERD.md)) wins over the pixels.** Anything in a mockup that has no ERD field is not built.
Owner decisions: no collaboration, no attachments.

Status: ✅ matches the ERD · ⚠️ build to the ERD, ignore the listed elements.

| Mockup folder | Route (Phase) | Status | Ignore / replace |
|---|---|---|---|
| `mobile_signIn`, `signIn` | `sign-in` (6) | ✅ | "Sync engine", "cloud snapshot" copy is decoration |
| `mobile_home`, `home` (updated) | `(tabs)/index` (7) | ✅ no avatars | "Sprint 4 Cycle", "+1 since yesterday", "4 active sprints", "92% velocity" (→ completion rate), "Google Meet w/ Hiroshi & Elena", fixed `UTC+09:00`, "ONLINE" label. Tags like "Phase II Design" → category name |
| `mobile_home_empty_stage` | Home empty state (7) | ⚠️ | "assignee" wording |
| `mobile_add_task`, `add_task` (new desktop) | `task/new` (5, 7) | ⚠️ | Paperclip icon; markdown toolbar icons; copy "Create Mission" is brand voice (decide in `decisions.md`) |
| `mobile_add_subtask`, `add_subtask` (new desktop) | `task/[id]/subtask-new` (8) | ⚠️ | Paperclip; "Sprint 44"; "Team Alpha"; `TSK-0842` code (→ short id); "Save Draft & Close" (no draft feature) |
| `mobile_task` | `task/[id]` (8) | ⚠️ | Avatar chips in the date row; "TASK // 084-RUNE" code |
| `mobile_status` | `status/[status]` (8) | ⚠️ | "Active Sprint" badge; "executed by the team" copy; priority "Normal" → "Medium" |
| `mobile_categories`, `categories` | `(tabs)/categories` (9) | ⚠️ | Illustration images/avatars on cards (use a colour + icon instead; no image field in the ERD) |
| `mobile_categories_empty_stage` | Categories empty state (9) | ⚠️ | "Sprint" copy |
| `mobile_category_registry` | `category/[id]` (9) | ⚠️ | "Sprint 42" label |
| `mobile_calendar`, `calendar` (updated) | `(tabs)/calendar` (10) | ✅ no avatars | "Tokyo Sprint" (→ week number only); **THU 17 vs Wednesday 17 Jan typo** (weekday from real date); "Google Meet" chip; "PR #488"; "P1" prefix; bell; Cmd+K search; Day/Week/Month toggle; stored lunch/stand-up rows |
| `mobile_calendar_empty_stage` | Calendar empty state (10) | ⚠️ | "Sprint" copy |

## Elements that do map to the ERD (build these)

- Home: stat cards (counts per displayed status), due-today list, quick add, today's schedule from `startAt`–`dueAt`.
- Calendar: week strip, day timeline, mini month picker with task dots, category filter with counts, priority chip, subtask count + progress bar.
- Forms: name, date-time, description (markdown text), category (required), priority, inline subtasks, inherited category lock on subtasks, relative "In 3 days" badge.
- Desktop shell: side nav, "New Task", user footer with sign-out, breadcrumb/date top bar.

## Asked of the owner (optional)

Refresh `mobile_task`, `mobile_status`, `mobile_category_registry`, `categories`/`mobile_categories` the same way if the removed elements leave holes in the layout. Not blocking: Phases 7–10 can start from the table above.
