# 🎂 Amuche's Oven — Website

A full-featured bakery website for **Amuche's Oven**, Nairobi, Kenya.  
Built with vanilla HTML/CSS/JS, Supabase (database + auth + storage), deployed on Netlify.

---

## Project Structure

```
amuches-oven/
├── index.html              # Homepage
├── menu.html               # Cake listings
├── cake.html               # Cake detail + order
├── order.html              # Multi-step order form
├── track.html              # Order tracking
├── _env.js                 # Env var injection (Netlify replaces at build)
├── netlify.toml            # Netlify config
├── .env.example            # Env var template
│
├── admin/
│   ├── login.html          # Admin login
│   ├── index.html          # Dashboard
│   ├── orders.html         # Order management
│   ├── cakes.html          # Cake management
│   ├── schedule.html       # Baking/delivery calendar
│   └── settings.html       # Business settings
│
├── css/
│   ├── variables.css       # Design tokens
│   ├── global.css          # Reset + global styles
│   ├── nav.css             # Navigation + footer
│   ├── cart.css            # Cart drawer
│   ├── home.css            # Homepage styles
│   ├── menu.css            # Menu + cake detail styles
│   ├── order.css           # Order + track styles
│   └── admin.css           # Admin panel styles
│
├── js/
│   ├── config.js           # Supabase client + auth helpers
│   ├── utils.js            # Shared utilities
│   ├── cart.js             # Cart state management
│   ├── nav.js              # Navigation behaviour
│   ├── home.js             # Homepage logic
│   ├── menu.js             # Menu listing + filters
│   ├── cake-detail.js      # Cake detail + variant picker
│   ├── order.js            # Multi-step order form
│   ├── track.js            # Order tracking
│   ├── receipt.js          # Receipt/invoice generator
│   └── admin/
│       ├── layout.js       # Admin sidebar + auth guard
│       ├── schedule.js     # Baking calendar
│       └── settings.js     # Settings page
│
├── sql/
│   ├── 01_schema.sql       # Tables + functions + triggers
│   ├── 02_rls.sql          # Row Level Security policies
│   ├── 03_storage.sql      # Storage buckets + policies
│   └── 04_seed.sql         # Sample data
│
└── scripts/
    └── inject-env.js       # Netlify build: injects env vars into _env.js
```

---

## Quick Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run these files in order:
   - `sql/01_schema.sql`
   - `sql/02_rls.sql`
   - `sql/03_storage.sql`
   - `sql/04_seed.sql`
3. Go to **Authentication → Users → Invite user** — create your admin account
4. Copy your **Project URL** and **anon key** from **Settings → API**

### 2. Netlify

1. Push this repo to GitHub
2. Connect repo in [Netlify](https://netlify.com) → **Add new site → Import from Git**
3. Set build settings:
   - **Build command:** `node scripts/inject-env.js`
   - **Publish directory:** `.` (root)
4. Add environment variables in **Site → Environment variables**:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_ANON_KEY` = your Supabase anon key
5. Deploy!

### 3. Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Link to your Netlify site
netlify link

# Start dev server (auto-injects env vars)
netlify dev
```

---

## Admin Access

- URL: `/admin/login.html`
- Use the email/password you created in Supabase Authentication

---

## Design System

| Token | Value |
|-------|-------|
| Display font | Fraunces (variable serif) |
| Body font | Outfit (geometric sans) |
| Espresso | `#1A0A02` |
| Terracotta | `#C45A2A` |
| Caramel | `#E8935A` |
| Cream | `#FAF0E2` |
| Sage | `#6E8060` |

---

## Features

**Customer side**
- Browse cakes by category with search + sort
- Image gallery, flavour/size variant picker, quantity control
- Multi-step order form (cart → details → delivery → confirm)
- WhatsApp ordering with auto-populated reference code
- Order tracking by reference number
- Downloadable receipt/invoice (print-ready)

**Admin side**
- Dashboard with live stats (today's orders, pending, revenue)
- Full order management: status updates, payment tracking, admin notes
- Cake listing management: add/edit/delete with image upload to Supabase Storage
- Baking/delivery calendar with day-click detail view
- WhatsApp order tracking (unconverted leads)
- Business settings (phone, hours, social links, delivery fee)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (ES Modules) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Hosting | Netlify |
| Icons | Font Awesome 6 |
| Fonts | Google Fonts (Fraunces + Outfit) |
