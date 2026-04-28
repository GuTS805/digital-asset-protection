# ShieldSync – Digital Asset Protection

A full-stack platform for protecting sports media and digital content from unauthorized use. Features AI-powered fingerprinting, perceptual hashing, LSB watermarking, and real-time violation detection.

**Live Demo:** https://digital-asset-protection-362q.vercel.app  
**Default credentials:** `admin` / `shieldsync123`

---

## Features

- **Asset Registration** — Upload images/videos and register them for monitoring
- **Perceptual Fingerprinting** — pHash-based similarity detection (detects cropped, resized, re-encoded copies)
- **LSB Watermarking** — Invisible ownership watermarks embedded at the bit level
- **Violation Detection** — Scan URLs for unauthorized usage with confidence scoring
- **AI Analysis** — Gemini-powered violation reports with takedown recommendations
- **Dashboard** — Real-time stats: active violations, scans, severity breakdown, platform distribution
- **Monitoring** — Scheduled scans with violation trend charts

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| AI | Google Gemini API |
| Search | Google Custom Search API |
| Fingerprinting | pHash (perceptual hashing), imagehash |
| Watermarking | LSB steganography (Pillow) |
| Deployment | Vercel (frontend) + Render (backend) |

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Fill in your API keys

uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Frontend runs at `http://localhost:3000`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing secret (any random string) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_API_KEY` | Google Custom Search API key |
| `GOOGLE_CSE_ID` | Google Custom Search Engine ID |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Deployment

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, set **Root Directory** to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in the Render dashboard

### Frontend → Vercel

1. Import repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `digital-asset-protection/frontend`
3. Add `NEXT_PUBLIC_API_URL` pointing to your Render backend URL

## Project Structure

```
digital-asset-protection/
├── backend/
│   ├── main.py           # FastAPI app + routes
│   ├── requirements.txt
│   └── .python-version   # Pins Python 3.11.9 for Render
└── frontend/
    ├── src/
    │   ├── app/          # Next.js pages
    │   └── components/   # Shared components
    └── tailwind.config.ts
```

## License

MIT
