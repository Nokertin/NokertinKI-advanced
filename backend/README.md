# Backend (Express proxy)

Install and run:

```bash
cd backend
npm install
# create a .env with OPENAI_API_KEY (optional)
# If you don't provide the key, the server will return a demo echo response.
npm start
```

The server listens on PORT (default 3000) and exposes POST /api/chat which expects `{ messages: [{role, content}, ...] }`.
