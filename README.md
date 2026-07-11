# Autonomous Portfolio CMS

A lightweight, server-side rendered portfolio website built with **Astro** and configured to run as a standalone Node.js server, designed for deployment behind an Nginx reverse proxy. Data is powered by a headless **Supabase** backend, with a secure webhook endpoint for n8n to post new achievements.

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Framework    | [Astro](https://astro.build) 5 (SSR, `output: 'server'`) |
| Adapter      | [`@astrojs/node`](https://docs.astro.build/en/guides/integrations-guide/node/) — `mode: 'standalone'` |
| Styling      | [Tailwind CSS](https://tailwindcss.com) v4 (via `@tailwindcss/vite`) |
| Database     | [Supabase](https://supabase.com) (PostgreSQL) — headless data layer |
| Language     | TypeScript (strict)                             |
| Runtime      | Node.js 18.20.8+ / 20.3+ / 22+                  |

## Features

- **Dark-mode-preferred UI** — clean, minimal slate/sky theme with a sticky top navigation bar.
- **About section** — short introduction to Chris, an IT administrator specializing in cloud identity and endpoint management.
- **Skills grid** — skills fetched from Supabase, grouped by category.
- **Achievements feed** — latest 5 achievement posts fetched from Supabase, ordered by date descending, rendered as a timeline.
- **Projects stub** — placeholder section for future project highlights.
- **JSON health endpoint** — `GET /api/test` returns `{"status":"Node SSR is active"}` to verify server endpoints.
- **n8n webhook endpoint** — `POST /api/webhooks/achievement` accepts authorized POST requests to insert new achievements into Supabase.

## Prerequisites

- **Node.js** — 18.20.8, 20.3+, or 22+ (developed on Node 24)
- **npm** — 10+ (developed on npm 11)
- **Supabase project** — a Supabase project with `skills` and `posts` tables (see [Database Schema](#database-schema))

## Environment Variables

Create a `.env` file in the project root (do not commit it — it's in `.gitignore`):

```env
PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
WEBHOOK_SECRET="your-secret-key-for-n8n"
```

| Variable                      | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| `PUBLIC_SUPABASE_URL`         | Supabase project URL (public, safe for client)  |
| `PUBLIC_SUPABASE_ANON_KEY`    | Supabase anon key (public, used for SSR reads)  |
| `WEBHOOK_SECRET`              | Shared secret for n8n webhook authorization      |

## Getting Started

```bash
# install dependencies
npm install

# start the dev server (http://localhost:4321)
npm run dev

# build for production
npm run build

# preview the production build locally
npm run preview
```

## Production & Nginx Deployment

This project is configured with `output: 'server'` and the `@astrojs/node` adapter in `standalone` mode. After building, a self-contained Node server is emitted:

```
dist/
└── server/
    └── entry.mjs
```

Run the production server:

```bash
node ./dist/server/entry.mjs
```

By default it listens on `0.0.0.0:4321`. Override with environment variables:

```bash
HOST=127.0.0.1 PORT=3000 node ./dist/server/entry.mjs
```

### Example Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name portfolio.example.com;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

## Project Structure

```
portfolio/
├── astro.config.mjs        # Astro config: server output + Node standalone adapter + Tailwind
├── tsconfig.json           # TypeScript strict config (extends astro/tsconfigs/strict)
├── package.json
├── .env                    # Environment variables (not committed)
├── .gitignore
└── src/
    ├── styles/
    │   └── global.css      # Tailwind v4 import + dark mode variant
    ├── lib/
    │   ├── supabase.ts     # Supabase client initialization
    │   └── mockData.ts     # Legacy mock data (no longer imported)
    ├── layouts/
    │   └── Layout.astro    # Dark-mode shell + top nav (About, Skills, Feed, Projects)
    └── pages/
        ├── index.astro     # Home: SSR fetch from Supabase (skills + achievements feed)
        └── api/
            ├── test.ts              # GET /api/test → {"status":"Node SSR is active"}
            └── webhooks/
                └── achievement.ts   # POST /api/webhooks/achievement → insert to Supabase
```

## API Endpoints

| Method | Route                          | Auth                          | Response                          | Description                                      |
| ------ | ------------------------------ | ----------------------------- | --------------------------------- | ------------------------------------------------ |
| `GET`  | `/api/test`                    | None                          | `{"status":"Node SSR is active"}` | Health check / SSR verification                  |
| `POST` | `/api/webhooks/achievement`    | `Authorization` header        | `{"success":true}`                | Insert a new achievement into Supabase (for n8n) |

### Webhook Usage

```bash
curl -X POST http://localhost:4321/api/webhooks/achievement \
  -H "Content-Type: application/json" \
  -H "Authorization: your-webhook-secret" \
  -d '{"title":"New Certification","content":"Chris earned a new certification today."}'
```

## Database Schema

The Supabase project requires two tables:

### `skills`
| Column     | Type    | Description                |
| ---------- | ------- | -------------------------- |
| `id`       | int     | Primary key                |
| `name`     | text    | Skill name                 |
| `category` | text    | Category (e.g., "Cloud")   |

### `posts`
| Column    | Type    | Description                                  |
| --------- | ------- | -------------------------------------------- |
| `id`      | int     | Primary key                                  |
| `title`   | text    | Achievement title                            |
| `content` | text    | Achievement description (3rd person)         |
| `date`    | date    | Date of achievement (defaults to now)        |
| `type`    | text    | Post type (e.g., `'achievement'`)            |

### Row-Level Security (RLS)

Enable RLS and allow the `anon` role to read and insert:

```sql
-- Skills: allow read
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read on skills" ON skills FOR SELECT TO anon USING (true);

-- Posts: allow read + insert
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read on posts" ON posts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert on posts" ON posts FOR INSERT TO anon WITH CHECK (true);
```

## Roadmap

- [x] ~~Replace mock data with a real data layer (database/API)~~ — **Done: Supabase integration**
- [x] ~~Secure webhook endpoint for n8n achievement posts~~ — **Done**
- [ ] Add authentication & admin middleware for content management
- [ ] Build out the Projects section with detail pages
- [ ] Add RSS/Atom feed for achievements
- [ ] CI/CD pipeline for automated deployment

## License

MIT