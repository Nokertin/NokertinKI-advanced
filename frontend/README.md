# Frontend (Vite + React + Tailwind)

Install dependencies and run dev server:

```bash
cd frontend
npm install
npm run dev
```

The app expects an API backend at `/api/chat`. For local development, run the provided backend server (see ../backend). The frontend proxies calls to `/api/chat` on the same origin if you run it behind the backend or use a dev proxy.
