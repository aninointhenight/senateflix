# Senateflix 🎬

> *Philippine Senate — Now Streaming.*
> A satirical parody website styled like Netflix.

## Tech Stack

| Layer      | Tool                     |
|------------|--------------------------|
| Frontend   | React 18 + Vite          |
| Styling    | Tailwind CSS             |
| Database   | Supabase (PostgreSQL)    |
| Auth       | Supabase Auth            |
| Deployment | Vercel                   |

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/senateflix
cd senateflix
npm install
```

### 2. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run everything in `supabase/schema.sql`
3. Go to **Authentication > Users** and create your admin user manually

### 3. Environment variables

```bash
cp .env.example .env
```

Fill in your Supabase project URL and anon key (found in **Project Settings > API**).

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

---

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add the two env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in **Project Settings > Environment Variables**
4. Deploy

---

## Admin Panel

Go to `/admin` or click the profile icon (top right) → **Admin Login**.

Log in with the Supabase auth user you created.

### What you can manage

| Tab            | What it does                                              |
|----------------|-----------------------------------------------------------|
| Shows          | Add, edit, delete shows. All fields editable.             |
| Categories     | Add, rename, delete, reorder browse categories.          |
| Hero Carousel  | Pick which shows (up to 7) appear in the hero banner.    |

### Show fields

| Field               | Notes                                                     |
|---------------------|-----------------------------------------------------------|
| Title               | Required                                                  |
| Tagline             | Short one-liner shown in hero + modal                     |
| Description         | Full text shown in modal                                  |
| Year                | Displayed in meta row                                     |
| Category            | Which browse row it appears in                            |
| YouTube ID or URL   | Accepts full URLs or raw IDs                              |
| Thumbnail (H)       | Custom horizontal/banner image; falls back to YT thumb    |
| Thumbnail (V)       | Custom vertical/poster image; used in Top Shows row       |
| Tags                | Comma-separated keywords, shown as pills                  |
| Badge               | Manual override; auto-detects "Recently Added" (7 weeks) |
| Feature in Hero     | Whether to include in the hero carousel                   |
| Featured Order      | Position in carousel (lower = first)                      |

---

## Badge logic

- **Recently Added** — auto-applied to shows added within the last 7 weeks. No manual action needed.
- **New Episode / Leaving Soon / Coming Soon** — manually set per show in the admin.
- If you set a manual badge, it overrides the auto badge.

---

*Senateflix is a satirical parody. Not affiliated with the Philippine Senate or any broadcaster.*
