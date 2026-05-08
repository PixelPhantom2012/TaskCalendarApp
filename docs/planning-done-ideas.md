# Planning / Done / Ideas

## Planning (next fixes)

*(אין פריטים פעילים כרגע)*

---

## Done

- **תצוגות Day / Week / 3-days + Drawer** — *2026-05-08* — מצבי `calendarViewMode`: חודש / יום / 3 ימים / שבוע; **AsyncStorage** (`@app_calendar_view_mode`); **Schedule + Month** = תצוגת חודש; ציר זמן 24 שעות, שורת **כל היום**, מסלולי חפיפה, קו זמן **עכשיו**, פס תאריכים; **RTL עברית**: ימים ב־`daysLogical` סדר Sun→Sat קבוע לפי מפתחות משימות — רק מיכל `flexDirection` מתהפך (בלי היפוך כפול למערך); טקסטי Drawer ב־`t('drawer.*')`; שבוע מיום ראשון עם `selectedDate`; 3 ימים מתאריכים עוקבים מ־`selectedDate`; לחיצה על אירוע → עריכה.

<details>
<summary>תכנון מאוחסן: Day / Week / 3-days — נכסים והמשך</summary>

**מימוש (קבצים ומצב):** רפרנס עיצוב בשורטים בשיחה; בתוספת הקוד: `calendarViewMode` בזוסטנד, `@app_calendar_view_mode`, `lib/calendarViewMode.ts`, `components/timeline/TimelineView.tsx`, `DrawerMenu`, `app/(app)/index.tsx`.

**להמשך (אופציונלי):** לחיצה על משבצת ריקה → `create` עם שעה; חפיפות מתוחכמות כמו Google; **Schedule** כ־Agenda אמיתי במקום כפילות ל־חודש.

</details>

- **אייקון אפליקציה (לוח שנה / 31)** — *2026-05-08* — PNG מקור 1024×768; נוצר **1024×1024** עם ריפוד אנכי צבע מדוגם מפינה; `assets/icon.png`, `adaptive-icon.png` (זהה); `splash-icon.png` מיושר לאייקון; `app.json` → `android.adaptiveIcon.backgroundColor` + `splash.backgroundColor` **#8AC7FF**. `expo-notifications` → `icon.png`. נדרש **`eas build`** לשינוי במכשיר.

<details>
<summary>תכנון מפורט: אייקון (לפני יישום — ארכיון)</summary>

- **מקור:** PNG מהצ&apos;אט; נתיב מקור ארוך תחת Cursor `projects/.../assets/...image-fd4ee8dc....png`.
- **מגבלה:** מימדים **1024×768** ⇒ חובה ריבוע ל־`icon`/`adaptive` בלי עיוות.
- **החלטות:** קנבס 1024×1024 + ריפוד אנכי 128px למעלה/למטה, מילוי מצבע מהפיקסל (0,0); רקע adaptive + splash מצבע מרכז הקנבס (**#8AC7FF**).
- **נכסים:** `icon.png`, `adaptive-icon.png` (אותו קובץ), `splash-icon.png` (אותו); plugin התראות משתמש באייקון.

</details>

- Initial Expo app with calendar home, tasks, Supabase auth, create/edit task form, settings (*shipped earlier*).
- Supabase-backed `tasks` table with RLS (*shipped earlier*).
- Expo Go Android: notifications module deferred (*shipped earlier*).
- Email confirmation disabled in Supabase (*shipped earlier*).
- **Repeat** — *2026-05-04 +03:00* — daily / weekly / monthly recurrence in UI, DB, notifications.
- **Remove weather strip** — *2026-05-04 +03:00* — Larger month grid without weather tiles.
- **Remove tags** from create/edit path — persists `tags: []`.
- **Time adjustment** — native date/time pickers on mobile.
- **Sign out UX** — overlay + spinner until login redirect.
- **First launch language** — `resolveInitialLocale()`, `@app_ui_locale`.
- **עברית מלאה בממשק** — HE/EN, RTL, `LocaleConfig`, `date-fns`.
- **מצב כהה** — ThemeProvider + `@app_theme_mode`.
- **`deleted_dates`** — skip one occurrence vs entire series.
- **Themed sheets** — RecurringDeleteSheet, OptionsSheet, ConfirmSheet.
- **Clear all reminders removed** from Settings.
- **Task search (v1)** — `app/(app)/search.tsx`.
- **דף בית חודשי מלא** — Calendar + DayTasksSheet + FAB + DrawerMenu.
- **Drawer Settings shortcut** — `/(app)/settings`.
- **Calendar MVP — kinds** — Task / Event / Birthday on one row; types + `yearly` recurrence; chips + EventCard icons; migration file `supabase/migration_001_calendar_items.sql`.
- **UX — טופס לפי סוג** — task timed only; birthday minimal; event unchanged pattern for all‑day/time.
- **Supabase migration (הושלם על ידך)** — Success אחרי `migration_001_calendar_items.sql` ⇒ `kind`, `birth_year`, `repeat` כולל `yearly`, אינדקס.
- **Fallback ב-store** — retry insert/update without `kind`/`birth_year` על DB ישן (אופציונלי להשאיר).
- **התראות מקומיות** — Persisted toggle (`notificationPrefs`), cancel/reschedule לפי `taskId`, אחרי `fetchTasks`/עריכה/מחיקה, גוף התראה לפי שפת האפליקציה, `channelId` + `POST_NOTIFICATIONS`; Expo Go באנדרואיד עדיין ללא scheduling (ראו שורת Done למעלה).

<details>
<summary>Archived plan: first launch = phone language</summary>

Use `lib/i18n/locale.ts` (`resolveInitialLocale`, `initAppLocale`).

</details>

---

## Ideas

- **משתמשים וביצוע משימות משותפות**.
- **ווידג'טים למסך הבית**.
- **אירועים — מוזמנים / קישורי פגישה** — `attendees`, `meet_link`.
- **ימי הולדת מאנשי קשר או ייבוא** (contacts / ICS).
- **ציר זמן — ליטוש מתקדם** — משבצת ריקה → יצירה עם שעה; חפיפות UI כמו Google; **Schedule / Agenda**.
