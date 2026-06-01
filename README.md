# GameVerse Client

Next.js client for APKScc/GameVerse. Runtime and repository details for agents live in `AGENTS.md`.

## Development

- Install dependencies with `pnpm install`.
- Start the dev server with `pnpm dev`. It uses `API_BASE_URL_DEV` from `.env` and defaults to `http://127.0.0.1:9527`.
- Current local runtime recommendation: prefer Node 20 LTS for `pnpm dev`. Node 22 may still print `DEP0060` warnings from upstream dependencies during development.
- Run type checks with `pnpm typecheck`.
- Run the checked-in markdown renderer test with `pnpm test:markdown`.

## API Key Posting

- The user-facing key page is `src/app/profile/api-keys/page.tsx`.
- Creating a key from that page creates a content publishing key with `key_type=content_user` and `content:write` capability.
- `POST /open/content/posts` requires `Content-Type: application/json`, an API key auth header, and `Idempotency-Key`.
- Preferred auth header: `X-API-Key: ak_live_...`.
- Compatible auth headers: `Authorization: Bearer ak_live_...` and `Authorization: ApiKey ak_live_...`.
- Generate a new `Idempotency-Key` for each new publish action. Reuse the same key only when retrying the same request body.
- For 401s, check that the key is the full `ak_live_...` secret, active, unexpired, and has `content:write`; copy `request_id` from usage logs when escalating to backend debugging.
