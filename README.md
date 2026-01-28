# Phase 1 Role Matcher

A collaborative tool for assigning stakeholders to roles in the "Entangled Trio" sessions for the Enterprise AI Strategy for Medical Education initiative.

## Features

- **Real-time collaboration** - Multiple users can edit simultaneously
- **Magic link authentication** - Passwordless login via email
- **Persistent storage** - All data saved to Supabase
- **Editable roles** - Customize trio names, subtitles, and role titles
- **Add/remove trios** - Create additional trios as needed
- **Stakeholder pool** - Manage a shared list of stakeholders
- **Searchable dropdowns** - Quickly assign stakeholders to roles
- **Export options** - Download as Markdown or CSV

---

## Setup Instructions

### Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and open your existing project (or create a new one)

2. **Create the database table:**
   - Go to **SQL Editor** in the left sidebar
   - Click **New query**
   - Paste the contents of `supabase-schema.sql` (included in this project)
   - Click **Run**

3. **Get your API credentials:**
   - Go to **Settings** > **API**
   - Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy the **anon/public** key

4. **Configure authentication:**
   - Go to **Authentication** > **Providers**
   - Ensure **Email** is enabled
   - Under **Email**, make sure "Enable email confirmations" is ON
   - Go to **Authentication** > **URL Configuration**
   - Add your Netlify URL to **Site URL** (after deploying, e.g., `https://your-app.netlify.app`)
   - Add the same URL to **Redirect URLs**

### Step 2: Deploy to Netlify

**Option A: Deploy via GitHub (Recommended)**

1. Push this project to a GitHub repository

2. In Netlify:
   - Click **Add new site** > **Import an existing project**
   - Connect your GitHub account and select the repository
   - Build settings should auto-detect:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click **Add environment variables** and add:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click **Deploy**

**Option B: Deploy via Netlify CLI**

1. Install Netlify CLI: `npm install -g netlify-cli`

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Supabase credentials.

3. Build and deploy:
   ```bash
   npm install
   npm run build
   netlify deploy --prod
   ```

4. Add environment variables in Netlify:
   - Go to **Site settings** > **Environment variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Trigger a redeploy

### Step 3: Update Supabase Redirect URL

After deploying, copy your Netlify URL and:
1. Go to Supabase > **Authentication** > **URL Configuration**
2. Update **Site URL** to your Netlify URL
3. Add your Netlify URL to **Redirect URLs**

---

## Inviting Users

This app uses **magic link authentication** - users don't need passwords.

1. Share your Netlify URL with collaborators
2. They enter their email address
3. They receive a login link via email
4. Clicking the link logs them in

**To restrict access to specific users:**

In Supabase, go to **Authentication** > **Users** and you can see who has signed up. If you want to limit access:

1. Go to **Authentication** > **Providers** > **Email**
2. Disable "Enable sign ups" to prevent new registrations
3. Manually invite users via **Authentication** > **Users** > **Invite user**

---

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and add your Supabase credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173`

---

## Project Structure

```
phase1-role-matcher/
├── src/
│   ├── components/
│   │   ├── Auth.jsx         # Login screen
│   │   └── RoleMatcher.jsx  # Main application
│   ├── lib/
│   │   └── supabase.js      # Supabase client
│   ├── App.jsx              # Root component with auth
│   ├── main.jsx             # Entry point
│   └── index.css            # Tailwind styles
├── supabase-schema.sql      # Database schema
├── netlify.toml             # Netlify config
├── .env.example             # Environment template
└── package.json
```

---

## Troubleshooting

**Login emails not arriving:**
- Check spam folder
- Verify Supabase email settings in Authentication > Providers > Email
- Check Supabase logs for email delivery errors

**"Invalid API key" error:**
- Ensure environment variables are set correctly in Netlify
- Redeploy after adding environment variables

**Changes not syncing between users:**
- Ensure the realtime subscription is enabled (check the SQL schema was run)
- Check browser console for WebSocket errors

**Can't delete/update data:**
- Ensure RLS policies were created (included in the SQL schema)
