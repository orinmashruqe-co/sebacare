# SebaCare (সেবা কেয়ার)

Bilingual (Bangla & English) medicine care, prescription scanning, AI voice reminder, and emergency health card web application powered by Google Gemini and Supabase.

## Free Cardless Deployment Guide (GitHub + Render + Supabase)

### 1. Create a Free Supabase Database (No Card Required)
1. Sign up at [supabase.com](https://supabase.com) and create a new free project.
2. Open **SQL Editor** → **New Query**, paste the contents of `supabase/schema.sql`, and click **Run**.
3. Go to **Project Settings** → **API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY` *(keep server-side only — never expose in browser code)*

### 2. Get a Free Google Gemini API Key (No Card Required)
1. Go to [aistudio.google.com](https://aistudio.google.com) and create a `GEMINI_API_KEY`.

### 3. Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial SebaCare app"
git branch -M main
git remote add origin https://github.com/<your-username>/sebacare.git
git push -u origin main
```
*(Note: `.env*` and `data/` are ignored via `.gitignore` so secrets and local test records are never pushed.)*

### 4. Deploy Public Link on Render (No Card Required)
1. Sign in at [render.com](https://render.com) with GitHub.
2. Click **New +** → **Blueprint** (or **Web Service**) and select your `sebacare` repository (`render.yaml` is pre-configured).
3. Enter your environment variables:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy and share your live `.onrender.com` URL!

## Local Development
```bash
npm install
cp .env.example .env
# Fill in GEMINI_API_KEY (and optionally SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
npm run dev
```
