# AI assistant — Google Gemini integration

The assistant has two modes. **Mock is the default** and needs no key.

| Mode | `VITE_ASSISTANT_MODE` | Answers from | Needs key |
| --- | --- | --- | --- |
| Mock | `mock` (default) | Curated knowledge base in `src/mocks/seed/assistant.js` | No |
| Live | `live` | Google Gemini, grounded in that same knowledge base | Yes |

## Why there is a server

Browsers cannot hold an API key. Any `VITE_*` variable is inlined into the
public JS bundle, so `VITE_GEMINI_API_KEY` would be readable by every visitor.
`server/` is a small Express proxy that owns the key and is the only process
that talks to Gemini. It also keeps the product's honesty rule: it injects the
verified records into the prompt and only accepts official source links.

```
browser ──POST /api/assistant/chat──▶ vite proxy ──▶ server/index.js ──▶ generativelanguage.googleapis.com
         (no key)                                    (holds GEMINI_API_KEY)
```

## Setup

1. Get a free key at <https://aistudio.google.com/apikey>, copy the env file and
   add it:

   ```bash
   cp .env.example .env
   ```

   Then set in `.env`:

   ```
   GEMINI_API_KEY=AIza...
   GEMINI_MODEL=gemini-flash-lite-latest,gemini-3.5-flash
   VITE_ASSISTANT_MODE=live
   ```

2. Run both processes:

   ```bash
   npm run dev:all      # proxy on :8787 + vite on :5173
   ```

   Or separately, in two terminals:

   ```bash
   npm run dev:server
   npm run dev
   ```

3. Open the assistant page and ask something.

To go back to offline demo mode, set `VITE_ASSISTANT_MODE=mock` (or remove the
line) and restart. The curated answers return and no key is used.

## Checking the proxy is healthy

```bash
curl http://localhost:8787/api/assistant/health
# {"ok":true,"provider":"gemini","models":["gemini-flash-lite-latest","gemini-3.5-flash"],"keyConfigured":true}
```

If `keyConfigured` is `false`, the chat endpoint returns `503 missingApiKey`
and the UI shows a "not configured" message.

## Configuration

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | server only | — | Your Google AI Studio key. Never commit it. |
| `GEMINI_MODEL` | server only | `gemini-flash-lite-latest,gemini-3.5-flash` | Comma-separated models, tried in order. |
| `ASSISTANT_PORT` | server only | `8787` | Proxy port; must match the Vite proxy target. |
| `ASSISTANT_RATE_LIMIT` | server only | `20` | Requests per IP per minute. |
| `ALLOWED_ORIGINS` | server only | `http://localhost:5173` | CORS allow-list. |
| `VITE_ASSISTANT_MODE` | browser | `mock` | `mock` or `live`. Safe to expose. |

## Behaviour in live mode

- **Grounding** — `server/prompt.js` injects the knowledge base and forbids
  inventing deadlines, fees, seat counts or eligibility rules.
- **Model fallback** — if the first model in `GEMINI_MODEL` is overloaded or
  retired, the next one in the list is tried.
- **No verified record** — if the model returns an empty/`no_record` answer the
  proxy serves the curated record when keywords match, otherwise the existing
  amber honesty card with official links.
- **Sources** — record ids the model used are mapped back to their official
  URLs, so a hallucinated link never becomes a clickable chip.
- **Rate limit** — per-IP token bucket protecting your Gemini quota.
- **MSW** — `src/mocks/browserWorker.js` drops the assistant handlers in live
  mode so the proxy is actually reached.

## Deploying beyond localhost

The proxy is a dev tool. Before shipping:

1. Put it behind your real auth — require a valid session token, not just CORS.
2. Set `ALLOWED_ORIGINS` to your production domain.
3. Lower `ASSISTANT_RATE_LIMIT` and add a global daily spend cap.
4. Serve it over HTTPS.
5. Set `VITE_API_BASE_URL` to the public API base so the browser calls your
   backend instead of `/api`.

## Cost

Gemini's Flash / Flash-Lite models have a free tier with generous limits, and
paid usage is billed per million tokens (see the
[Gemini pricing page](https://ai.google.dev/gemini-api/docs/pricing)). The rate
limit is the main safeguard.
