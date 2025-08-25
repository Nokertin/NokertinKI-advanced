# AI Chat — Fullstack Demo (Frontend + Backend)

This archive contains two parts:
- `frontend/` — React + Vite + Tailwind SPA (login, chat UI, sidebar history saved to localStorage).
- `backend/` — Node/Express proxy to OpenAI (if OPENAI_API_KEY is provided) or falls back to a demo echo response.

Quick start (run both):
1. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Backend (in separate terminal):
   ```bash
   cd backend
   npm install
   # create .env with OPENAI_API_KEY=sk-...
   npm start
   ```
3. For local development, set the frontend dev server to proxy `/api` to the backend (or run the backend and use a reverse proxy).

Security notes:
- Keep your OPENAI_API_KEY secret and run the proxy server on backend to avoid exposing the key to browsers.
- This is a demo scaffold. For production, add authentication, rate limiting, input validation and content moderation.

Enjoy!
