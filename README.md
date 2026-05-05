# TaskCalendar — Expo React Native App

A beautiful task & reminders calendar app built with Expo, React Native, and Supabase.

## Features

- Monthly calendar view with event dots
- Create/edit tasks with title, time, repeat, location, color, and notifications
- Push notifications for task reminders
- Email/password authentication
- Cloud sync via Supabase

## Getting Started

### 1. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. In **Authentication → Providers**, enable **Email** (already on by default)
4. Copy your project URL and `anon` key from **Settings → API**

### 2. Environment Variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android/iOS device.

## GitHub

Your Supabase URL and anon key stay in `.env` (gitignored — never commit secrets).

1. On [GitHub](https://github.com/new), create a **new empty** repository (no README/license), e.g. `TaskCalendarApp`.
2. In the project folder, connect and push (use your username and repo name):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If GitHub shows different instructions (SSH or `main` vs `master`), follow those; this repo’s default branch is **`main`**.

## Project Structure

```
app/
  _layout.tsx         Root layout with auth init
  index.tsx           Auth redirect
  (auth)/
    login.tsx         Login screen
    register.tsx      Register screen
  (app)/
    _layout.tsx       App layout with auth guard
    index.tsx         Home / Calendar screen
    create.tsx        Create / Edit task screen
    settings.tsx      Settings screen
components/
  EventCard.tsx       Task card component
lib/
  supabase.ts         Supabase client
  types.ts            TypeScript types
  store.ts            Zustand global store
  notifications.ts    Expo push notifications
supabase/
  schema.sql          Database schema + RLS policies
```

## Tech Stack

- **Expo SDK 54** (managed workflow)
- **Expo Router v6** (file-based routing)
- **Supabase** (Postgres + Auth)
- **Zustand** (state management)
- **react-native-calendars** (calendar grid)
- **expo-notifications** (push notifications)
