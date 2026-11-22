# SebaCare (সেবা কেয়ার)

Bilingual (Bangla & English) medicine care, prescription scanning, AI voice reminder, and emergency health card web application powered by Google Gemini and Supabase.

## Free Cardless Deployment Guide (GitHub + Vercel + Supabase)

### 1. Create a Free Supabase Database (No Card Required)
1. Sign up at [supabase.com](https://supabase.com) and create a new free project.
2. Open **SQL Editor** → **New Query**, paste the contents of `supabase/schema.sql`, and click **Run**.
3. Go to **Project Settings** → **Integrations → Data API** and copy your **Project URL** (`https://xxxx.supabase.co`).
4. Go to **Project Settings** → **API Keys**, scroll down to **Secret keys** (or click **View legacy API keys** → `service_role`), and copy your **Secret key** (`sb_secret_...` or `service_role`). *(Do not use `sb_publishable_...`.)*

### 2. Get a Free Google Gemini API Key (No Card Required)
1. Go to [aistudio.google.com](https://aistudio.google.com) and create a `GEMINI_API_KEY`.

### 3. Deploy Public Link on Vercel (No Card Required)
1. Push this repo to GitHub (or use the **GitHub** button in AI Studio).
2. Sign in at [vercel.com](https://vercel.com) with **GitHub**.
3. Click **Add New…** → **Project** → **Import** your `sebacare` repository.
4. Expand **Environment Variables** and add:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (any random text/passphrase you make up)
5. Click **Deploy** and share your live `.vercel.app` link!
