# AI assistant — OpenAI integration

The assistant has two modes. **Mock is the default** and needs no key.

| Mode | `VITE_ASSISTANT_MODE` | Answers from | Needs key |
| --- | --- | --- | --- |
| Mock | `mock` (default) | Curated knowledge base in `src/mocks/seed/assistant.js` | No |
| Live | `live` | OpenAI, grounded in that same knowledge base | Yes |

## Why there is a server

Browsers cannot hold an API key. Any `VITE_*` variable is inlined into the
public JS bundle, so `VITE_OPENAI_API_KEY` would be readable by every visitor.
`server/` is a small Express proxy that owns the key and is the only process
that talks to OpenAI. It also keeps the product's honesty rule: it injects the
verified records into the prompt and only accepts official source links.

```
browser ──POST /api/assistant/chat──▶ vite proxy ──▶ server/index.js ──▶ api.openai.com
         (no key)                                    (holds OPENAI_API_KEY)
```

## Setup

1. Copy the env file and add your key:

   ```bash
   cp .env.example .env
   ```

   Then set in `.env`:

   ```
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
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

3. Open the assistant page and ask something. Replies stream in token by token.

To go back to offline demo mode, set `VITE_ASSISTANT_MODE=mock` (or remove the
line) and restart. The curated answers return and no key is used.

## Checking the proxy is healthy

```bash
curl http://localhost:8787/api/assistant/health
# {"ok":true,"model":"gpt-4o-mini","keyConfigured":true}
```

If `keyConfigured` is `false`, the chat endpoint returns `503 missingApiKey`
and the UI shows a "not configured" message.

## Configuration

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | server only | — | Your OpenAI key. Never commit it. |
| `OPENAI_MODEL` | server only | `gpt-4o-mini` | Any chat-completions model. |
| `OPENAI_BASE_URL` | server only | api.openai.com | Point at a compatible gateway. |
| `ASSISTANT_PORT` | server only | `8787` | Proxy port; must match the Vite proxy target. |
| `ASSISTANT_RATE_LIMIT` | server only | `20` | Requests per IP per minute. |
| `ALLOWED_ORIGINS` | server only | `http://localhost:5173` | CORS allow-list. |
| `VITE_ASSISTANT_MODE` | browser | `mock` | `mock` or `live`. Safe to expose. |

## Behaviour in live mode

- **Streaming** — SSE events `delta`, `sources`, `done`, `error`; a blinking
  caret shows while text arrives. See `src/services/assistantService.js`.
- **Grounding** — `server/prompt.js` injects the knowledge base and forbids
  inventing deadlines, fees, seat counts or eligibility rules.
- **No verified record** — the model emits `[[NO_RECORD]]`; the proxy strips it
  and returns `status: 'no_record'`, which renders the existing amber honesty
  card with official links.
- **Sources** — URLs in the reply are matched against the known official list,
  so a hallucinated link never becomes a clickable chip.
- **Rate limit** — per-IP token bucket protecting your OpenAI bill.
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

`gpt-4o-mini` is roughly $0.15 per million input tokens and $0.60 per million
output tokens. With a ~1,500-token system prompt and short answers, a typical
chat costs well under $0.01. The rate limit is the main safeguard.
