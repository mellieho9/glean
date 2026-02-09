# Glean

Extract structured data from YouTube videos into your databases. Glean uses AI agents to watch videos, extract information based on user-defined schemas, and write the results directly to connected databases (e.g. Notion).

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   Backend    │     │  Supabase    │
│  React/Vite  │────▶│   FastAPI    │────▶│  (Auth + DB) │
│  :5173       │     │  :8000       │     │              │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
┌──────────────┐            │              ┌──────────────┐
│  Chrome      │────────────┘              │  Notion API  │
│  Extension   │   (API calls)             │  (Composio)  │
└──────────────┘                           └──────────────┘
```

- **Frontend** — React SPA with Tailwind CSS. Handles onboarding (sign in, connect database, select & configure schemas) and a dashboard to view extraction jobs.
- **Backend** — FastAPI server. Manages auth (Google OAuth via Supabase), database connections (Notion via Composio), schema configuration, and AI-powered video extraction (Google ADK agents).
- **Chrome Extension** — Manifest V3 extension. Lets users trigger extraction on any YouTube video from their browser.
- **Supabase** — Handles authentication, user sessions, and stores job/schema data.
- **Composio** — Third-party integration toolkit that connects to Notion for reading/writing data.

## Prerequisites

- Python 3.11+
- Node.js 18+
- Google Chrome (for the extension)

## Environment Variables

Create a `backend/.env` file with the following keys:

```env
# Supabase (https://supabase.com — create a project)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API (https://aistudio.google.com/apikey)
GOOGLE_API_KEY=your-google-api-key
GOOGLE_GENAI_USE_VERTEXAI=FALSE

# Composio (https://composio.dev — for Notion integration)
COMPOSIO_API_KEY=your-composio-api-key
```

### Where to get each key

| Key | Where |
|-----|-------|
| `SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `SUPABASE_KEY` | Supabase dashboard → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → `service_role` key |
| `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create API key |
| `COMPOSIO_API_KEY` | [Composio](https://app.composio.dev) → Settings → API Keys |

### Supabase Setup

Your Supabase project needs Google OAuth enabled:

1. Go to Supabase dashboard → Authentication → Providers → Google
2. Enable Google provider and add your Google OAuth client ID / secret
3. Set the redirect URL to `http://localhost:8000/auth/oauth/callback`

## Running the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

The API server starts at `http://localhost:8000`.

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`.

## Loading the Chrome Extension

1. Open `chrome://extensions` in Google Chrome
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from this repo
5. Navigate to any YouTube video and click the Glean extension icon to extract data

## Usage Flow

1. **Sign in** — Open `http://localhost:5173` and sign in with Google
2. **Connect a database** — Link your Notion workspace via Composio
3. **Select schemas** — Choose which Notion databases to use as extraction targets
4. **Configure extraction** — Answer questions to fine-tune what data gets extracted
5. **Extract** — Go to a YouTube video, open the Glean Chrome extension, and click Extract
6. **View results** — Check the dashboard for job status and extracted data
