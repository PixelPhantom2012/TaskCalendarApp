# Planning / Done / Ideas

## Planning (next fixes)

_No items — add rows here when something is queued._

---

## Done

- Initial Expo app with calendar home, tasks, Supabase auth, create/edit task form, settings (*shipped earlier*).
- Supabase-backed `tasks` table with RLS (*shipped earlier*).
- Expo Go Android: notifications module deferred to avoid SDK 53+ push-token errors (*shipped earlier*).
- Email confirmation disabled in Supabase (signup without confirm email flow) (*shipped earlier*).
- **Repeat** — *2026-05-04 18:15:49 +03:00* — Recurrence (daily / weekly / monthly) is honored in the task list and calendar dots: each day shows the event with the correct projected start/end times, Supabase `repeat` is normalized on load, and notification scheduling walks upcoming occurrences.
- **Remove weather strip** — *2026-05-04 18:15:49 +03:00* — Removed the home-screen weather widget (temperature, rain %, wind, sky tiles and Open-Meteo fetch); enlarged the calendar grid (larger date numbers/month title, taller day cells, extra vertical spacing) now that strip is gone.
- **Remove tags (add/edit)** — *2026-05-04 18:17:53 +03:00* — Removed tags from the New/Edit task screen and deleted `TagChip`; saves always persist `tags: []` while the DB column and `EventCard` tag chips still support legacy rows until edited.
- **Time adjustment** — *2026-05-05 07:10:02 +03:00* — New/Edit task now opens native date/time pickers (`@react-native-community/datetimepicker`): tap Start / End to set date & time, all-day tasks get a tappable **Date** row; notify lead time still uses the existing “Notify me” list.
- **Sign out UX** — *2026-05-05 07:30:39 +03:00* — After confirming sign out, a dimmed overlay with spinner and “Signing out…” appears until navigation to login; the Sign out row shows a small spinner; failed sign out surfaces an alert and clears the loading state; local task list is cleared on successful logout.
- **First launch language from device** — *2026-05-05 12:00:00 +03:00* — On first cold start (no `@app_ui_locale`), `resolveInitialLocale()` maps `expo-localization` (`languageCode` + `languageTag`) to `he` or `en`, then persists it; later launches use storage until Settings → Language or cleared data. Full mapping in `<details>` below.
- **עברית מלאה בממשק** — *2026-05-05 18:00:00 +03:00* — Full UI localization: `i18n-js` Hebrew strings (`lib/i18n/he.ts`), English mirror (`en.ts`), RTL via `I18nManager`, Hebrew calendar labels (`LocaleConfig` / xdate), localized dates (`date-fns`), Hebrew/English toggle under Settings → Language with persisted preference and first-launch device locale (`lib/i18n/locale.ts`).
- **מצב כהה (dark mode)** — *2026-05-06 16:00:00 +03:00* — `ThemeProvider` + `useAppTheme()` (`lib/theme/`), palettes in `lib/theme/palettes.ts`, AsyncStorage `@app_theme_mode` (`light` | `dark` | `system`), default `system` via `useColorScheme()`; themed home, create, settings, auth, `EventCard`, routing splash `app/index.tsx`, calendar theme; `create` sheet styles in `lib/theme/createTaskStyles.ts`; `app.json` `userInterfaceStyle: "automatic"`.
- **Recurring exceptions (`deleted_dates`)** — *2026-05-05* — One Supabase row per series; `deleted_dates` text array on `tasks`; `deleteTaskOccurrence` appends one `yyyy-MM-dd` for “this day only”; `deleteTask` removes the row for “entire series”; `getTasksForDate` / calendar dots / notifications respect skipped days via `taskOccursOnVisibleDate` (`lib/recurrence.ts`, `lib/store.ts`).
- **Themed bottom sheets (replace OS `Alert` for product flows)** — *2026-05-05* — (**1**) **Recurring delete** — `components/RecurringDeleteSheet.tsx` on home: “this day only” vs “entire series”, backdrop dismiss, HE/EN copy with sub-labels; non-recurring delete still uses native `Alert`. (**2**) **Settings** — `components/OptionsSheet.tsx` (language + appearance), `components/ConfirmSheet.tsx` (sign out only); aligns with `modalSheet` / `overlay` theme tokens. (**3**) **Language picker glyphs** — `OptionsSheet` supports `glyphText` per row: **IL** (Hebrew) and **US** (English) in the leading circle.
- **Remove “Clear all reminders” from Settings** — *2026-05-05* — Deleted the row, confirmation sheet, and `cancelAllNotifications` call from `app/(app)/settings.tsx`; notifications section is now only the enable switch (+ Expo Go banner when relevant).
- **Task search (v1)** — *2026-05-05* — New route `app/(app)/search.tsx`: debounced (~250 ms) client-side filter over `useTaskStore().tasks` via `lib/searchTasks.ts` (title, notes, location; case-insensitive; sorted by title). Home search icon navigates here. Empty-query hint, no-results state, HE/EN strings (`search.*`). Tapping a row sets `selectedDate` from the task’s `start_at` and opens edit (`/(app)/create?taskId=`). Recurring tasks show one row with repeat label + anchor date in the subtitle.

<details>
<summary>Archived plan: first launch = phone language</summary>

On first app open (no saved UI language), pick Hebrew or English from the device locale, then persist to `@app_ui_locale`. Mapping: `he`/`iw`/tag `he*` → Hebrew; `en`/tag `en*` → English; other languages → English fallback until more locales exist. Implementation: `lib/i18n/locale.ts` (`resolveInitialLocale`, `initAppLocale` writes when storage was absent).

</details>

*(Update Planning when you retire an item from the table above; append new Done bullets with UTC offset timestamp and one clear sentence describing the change.)*

---

## Ideas

- **התראות**
- **משתמשים וביצוע משימות משותפות**
- **ווידג'טים למסך הבית**
- **מיקום כפתור ה־+ (FAB)** — לשנות את המיקום/המרווח כדי שלא יכסה את כפתור המחיקה בכרטיס המשימה (למשל הזזה למעלה, לשמאל ב־RTL, או ריווח נוסף בתחתית הרשימה). ראה `fab` ב־`app/(app)/index.tsx`.
