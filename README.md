# CTonTour

**Real-time relay management app for sport events.**  
Built for teams who want to track who is running, who is next, and how the event is progressing - all from their phones.


## What it does

CTonTour lets a team manage a 24-hour relay (or any relay format) in real time, from any device. Key features:

- **Live relay tracking** / see who is currently running, how long they have been out, and who is next
- **Smart queue** / drag-and-drop queue with auto-fill based on who ran the longest ago
- **Team management** / invite members via QR code or join code, manage rider status (active / resting / absent), claim pre-created rider profiles
- **Stats per rider** / average pace, speed, total distance, elevation, lap history and pace evolution chart
- **Team-wide stats** / aggregated distance, elevation, average pace and speed across all riders
- **Export / import** / export stats as CSV for post-event analysis, re-import if needed
- **Real-time sync** / all connected devices update instantly via Supabase Realtime when a lap is logged or the queue changes
- **PWA** / installable on iOS and Android, runs without a browser bar, works like a native app
- **Translated** / French and English, device-language detected, manually switchable
- **Dark mode** / system-preference aware


## Stack

| Layer | Technology |
|---|---|
| Frontend | [Next.js 15](https://nextjs.org) (App Router) + React |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Database | [Supabase](https://supabase.com) (Postgres + Realtime + Auth + Storage) |
| Email | [Resend](https://resend.com) via Supabase SMTP |
| Hosting | [Vercel](https://vercel.com) |
| Drag and drop | [@dnd-kit](https://dndkit.com) |
| Charts | [Recharts](https://recharts.org) |
| Icons | [Lucide React](https://lucide.dev) |
| QR codes | [react-qr-code](https://github.com/rosskhanas/react-qr-code) |


## Project structure

```
src/
  app/                    # Next.js App Router pages
    (auth)/               # login, signup, reset-password
    auth/callback/        # Supabase auth redirect handler
    verify-email/         # Email confirmation waiting screen
    email-confirmed/      # Post-confirmation screen
    team-setup/           # Create or join a team
    profile-setup/        # Avatar setup after signup
    join/[code]/          # QR/link invite landing page
    guide/                # In-app help and FAQ
    legal/                # Legal documents hub + sub-pages
  components/             # Reusable UI components
    BottomNav.js
    LanguageSwitcher.js
    OfflineBanner.js
    OnboardingPopup.js
    QueueItem.js
    RiderDetailPopup.js
    RiderRow.js
    legal/
      BackButton.js
      LegalLayout.js
      MarkdownRenderer.js
  lib/                    # Logic, context and utilities
    auth.js               # Supabase Auth functions
    profile.js            # Profile and team membership functions
    queue.js              # Queue, lap, stats and event functions
    supabase.js           # Supabase client singleton
    LanguageContext.js    # i18n context and t() hook
    TeamContext.js        # Current user's team context
    translations.js       # All FR/EN strings
    useOnlineStatus.js
    useLockBodyScroll.js
    useRouteGuard.js
    useLongPress.js
    constants.js          # Circuit specs (length, elevation)
  content/
    legal/                # Markdown legal documents
supabase/
  functions/
    delete-account/       # Edge Function for account deletion
```


## Database schema

```
profiles          — one row per account (id = auth.users.id)
teams             — one row per team
team_riders       — riders on a team (may or may not have an account)
team_memberships  — links auth users to teams (enforces one team per user)
laps              — one row per relay leg logged
run_queue         — ordered queue of upcoming riders
```

Row Level Security is enabled on all tables. Public read is open (for the public stats page). Write access requires membership via `team_memberships`.


## Local setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [Resend](https://resend.com) account with a verified domain (optional — needed for email verification)

### 1. Clone and install

```bash
git clone https://github.com/french-coral/ctontour.git
cd ctontour
npm install
```

### 2. Environment variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in your Supabase dashboard under **Settings → API**.

### 3. Database

Run the following in your Supabase SQL Editor to create all tables, enable RLS and set up the required policies. Refer to the schema section above and the policy definitions in the codebase.

The app also requires:

```sql
-- Enable realtime on the relevant tables
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table run_queue;
alter publication supabase_realtime add table team_riders;
alter publication supabase_realtime add table laps;

-- Replica identity for correct delete events
alter table run_queue replica identity full;
alter table teams replica identity full;
alter table team_riders replica identity full;
alter table laps replica identity full;
```

### 4. Supabase Auth settings

In your Supabase dashboard → *Authentication → URL Configuration*:

- **Site URL:** `http://localhost:3000` (change to your domain in production)
- **Redirect URLs:** add `http://localhost:3000/auth/callback`

In *Authentication → Providers → Email*, turn off *Confirm email* for local development to skip the email flow, or set up Resend SMTP if you want to test the full flow.

### 5. Storage

Create a storage bucket named `avatars` (public) in your Supabase dashboard. The storage RLS policies are documented in `supabase/migrations/`. (If not here, I simply gave up on it sorry)

### 6. Edge Function (account deletion)

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy delete-account
```

### 7. Run locally

```bash
npm run dev
```


## Deployment

The app deploys to Vercel automatically on every push to `main`.

1. Import the repository on [vercel.com](https://vercel.com) (or any host you want)
2. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in *Project Settings → Environment Variables*
3. Update your Supabase Auth redirect URLs to include your production domain
4. Update `resetPassword` in `src/lib/auth.js` to use your production domain
5. Update the `delete-account` Edge Function fetch URL in `src/app/profile/page.js`

Custom domains work out of the box on Vercel — add yours in *Project Settings → Domains* and update your DNS accordingly.


## Circuit constants

Default values are set for the event this app was built for. Update them in `src/lib/constants.js` before your event:

```javascript
export const CIRCUIT_LENGTH_METERS = 4185   // circuit length in meters
export const CIRCUIT_ELEVATION_METERS = 33.93 // upward elevation per lap in meters
```

These values are used to calculate speed (km/h), total distance and total elevation for all stats.


## Contributing

This is a purpose-built event app. If you want to adapt it for your own relay event, fork it and update the circuit constants.
If you are completly lost, give this README.md to your favorite LLM, it will know what to do.


## License

GPLv3 - Exception made on the visual identity.
Read the legal document associated for more details : `src/content/legal/open-source-and-branding.md`
