# ShieldSync — Setup Guide

## Architecture

```
frontend/   Next.js 15 + Tailwind CSS  (Vercel free tier)
backend/    FastAPI + Python            (Render.com free tier)
database    Supabase                   (free tier — 500MB)
```

## Free APIs Used

| Service | Purpose | Free Tier |
|---|---|---|
| Supabase | Database + Storage | 500MB DB, 1GB storage |
| Google Gemini 1.5 Flash | AI violation analysis | 15 RPM, 1M TPM/day |
| Google Custom Search API | Web image search | 100 queries/day |
| Vercel | Frontend hosting | Unlimited |
| Render.com | Backend hosting | 750 hrs/month |

---

## 1. Supabase Setup

1. Go to https://supabase.com → New Project
2. Copy your **Project URL** and **anon key** from Settings > API
3. Go to **SQL Editor** → paste and run `supabase_schema.sql`
4. Go to **Storage** → create a bucket named `media` → set to **Public**

---

## 2. Google Gemini API

1. Go to https://aistudio.google.com/app/apikey
2. Create an API key (free, no credit card needed)

---

## 3. Google Custom Search API (optional but recommended)

1. Go to https://programmablesearchengine.google.com/
2. Create a new search engine → set to search the entire web → enable **Image Search**
3. Copy the **Search Engine ID**
4. Go to https://console.cloud.google.com/ → Enable **Custom Search JSON API**
5. Create an API key

---

## 4. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Fill in your keys in .env

uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## 5. Frontend Setup

```bash
cd frontend
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Open: http://localhost:3000

---

## 6. Deploy to Production

### Backend → Render.com
1. Push `backend/` to a GitHub repo
2. New Web Service → connect repo → Build: `pip install -r requirements.txt` → Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add all `.env` variables in Render dashboard

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import to Vercel → set `NEXT_PUBLIC_API_URL` to your Render URL

---

## How the Detection Works

```
Upload asset
    ↓
Generate pHash + dHash + aHash + wHash (imagehash library)
    ↓
Embed LSB watermark (watermark_id in blue channel LSBs)
    ↓
Store fingerprints in Supabase
    ↓
Every 6 hours: search Google Images for asset name + org
    ↓
Download each result → compare pHash Hamming distance
    ↓
If distance ≤ 12 bits → flag as match
    ↓
Gemini analyzes severity + usage type + takedown justification
    ↓
Violation stored → dashboard alert shown
```

## Perceptual Hash Similarity

| Hamming Distance | Interpretation |
|---|---|
| 0 | Identical |
| 1–5 | Nearly identical (resize/compress) |
| 6–12 | Very similar (cropped/color-adjusted) |
| 13–20 | Possibly related |
| > 20 | Different image |
