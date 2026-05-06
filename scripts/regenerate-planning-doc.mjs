/**
 * Writes docs/planning-done-ideas.md as UTF-8.
 * Run from repo root: node scripts/regenerate-planning-doc.mjs
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dest = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'planning-done-ideas.md');

const md = `# Planning / Done / Ideas

## Planning (next fixes)

*(אין פריטים פעילים כרגע)*

---

## Done

- Initial Expo app with calendar home, tasks, Supabase auth, create/edit task form, settings (*shipped earlier*).
- Supabase-backed \`tasks\` table with RLS (*shipped earlier*).
- Expo Go Android: notifications module deferred (*shipped earlier*).
- Email confirmation disabled in Supabase (*shipped earlier*).
- **Repeat** — *2026-05-04 +03:00* — daily / weekly / monthly recurrence in UI, DB, notifications.
- **Remove weather strip** — *2026-05-04 +03:00* — Larger month grid without weather tiles.
- **Remove tags** from create/edit path — persists \`tags: []\`.
- **Time adjustment** — native date/time pickers on mobile.
- **Sign out UX** — overlay + spinner until login redirect.
- **First launch language** — \`resolveInitialLocale()\`, \`@app_ui_locale\`.
- **עברית מלאה בממשק** — HE/EN, RTL, \`LocaleConfig\`, \`date-fns\`.
- **מצב כהה** — ThemeProvider + \`@app_theme_mode\`.
- **\`deleted_dates\`** — skip one occurrence vs entire series.
- **Themed sheets** — RecurringDeleteSheet, OptionsSheet, ConfirmSheet.
- **Clear all reminders removed** from Settings.
- **Task search (v1)** — \`app/(app)/search.tsx\`.
- **דף בית חודשי מלא** — Calendar + DayTasksSheet + FAB + DrawerMenu.
- **Drawer Settings shortcut** — \`/(app)/settings\`.
- **Calendar MVP — kinds** — Task / Event / Birthday on one row; types + \`yearly\` recurrence; chips + EventCard icons; migration file \`supabase/migration_001_calendar_items.sql\`.
- **UX — טופס לפי סוג** — task timed only; birthday minimal; event unchanged pattern for all‑day/time.
- **Supabase migration (הושלם על ידך)** — Success אחרי \`migration_001_calendar_items.sql\` ⇒ \`kind\`, \`birth_year\`, \`repeat\` כולל \`yearly\`, אינדקס.
- **Fallback ב-store** — retry insert/update without \`kind\`/\`birth_year\` על DB ישן (אופציונלי להשאיר).
- **התראות מקומיות** — Persisted toggle (\`notificationPrefs\`), cancel/reschedule לפי \`taskId\`, אחרי \`fetchTasks\`/עריכה/מחיקה, גוף התראה לפי שפת האפליקציה, \`channelId\` + \`POST_NOTIFICATIONS\`; Expo Go באנדרואיד עדיין ללא scheduling (ראו שורת Done למעלה).

<details>
<summary>Archived plan: first launch = phone language</summary>

Use \`lib/i18n/locale.ts\` (\`resolveInitialLocale\`, \`initAppLocale\`).

</details>

---

## Ideas

- **משתמשים וביצוע משימות משותפות**.
- **ווידג'טים למסך הבית**.
- **אירועים — מוזמנים / קישורי פגישה** — \`attendees\`, \`meet_link\`.
- **ימי הולדת מאנשי קשר או ייבוא** (contacts / ICS).
- **תצוגות נוספות (Day / Week / 3-days)** — DrawerMenu עם UI קיים; צריך \`viewMode\` זרימות מסך.
`;

writeFileSync(dest, md, { encoding: 'utf8' });
console.log('OK', dest);
