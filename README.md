# Chiki

Owner-only, production-focused AI Telegram assistant foundation with secure tool approvals, OpenAI-compatible provider abstraction, and deploy-ready backend APIs.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy?repo=https://github.com/SayCrazyy2/Chiki)

## Milestone 1 Features

### Implemented now
- Async TypeScript backend with strict typing and structured logging
- Health/ready endpoints (`/healthz`, `/readyz`)
- OpenAPI + Swagger UI (`/openapi.json`, `/docs`)
- Telegram bot core (`/start`, `/help`, `/status`) with owner-only guard
- Streaming-style Telegram response updates
- Provider abstraction + OpenAI-compatible adapter with retry/fallback hooks
- Tool framework with risk metadata + approval workflow + audit logs
- Built-in tools:
  - Terminal (timeout, allowlist/denylist, stdout/stderr capture, cancellation scaffold)
  - File manager (workspace-constrained read/write/list/search, traversal protection)
  - Web search abstraction (DuckDuckGo provider)
- REST endpoints for approvals and sessions/messages retrieval
- WebSocket event stream endpoint (`/ws/events`)
- Prisma PostgreSQL schema baseline (pgvector-ready field via `Unsupported("vector")`)
- Docker, Docker Compose, Railway, and GitHub Actions CI baseline

### Roadmap (next milestones)
- Persistent approval/session stores backed by PostgreSQL
- Additional providers (Anthropic/OpenRouter/Groq/Together/Gemini)
- Dashboard and advanced multi-agent orchestration

## Architecture Overview

- `src/api`: Fastify HTTP + WebSocket + OpenAPI routes
- `src/bot`: Telegram bot and owner auth logic
- `src/providers`: AI provider contracts and adapters
- `src/tools`: Tool interfaces, registry, and built-in tools
- `src/approvals`: Approval domain and store interface
- `src/storage`: Persistence interfaces and baseline adapters
- `prisma`: PostgreSQL schema and migration-ready data model

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open:
- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development`, `test`, or `production` |
| `PORT` | No | HTTP port |
| `HOST` | No | Bind host |
| `LOG_LEVEL` | No | `fatal/error/warn/info/debug/trace` |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token |
| `TELEGRAM_OWNER_ID` | Yes | Single owner Telegram user ID |
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `WORKSPACE_DIR` | No | File tool workspace root |
| `OPENAI_BASE_URL` | Yes | OpenAI-compatible endpoint base URL |
| `OPENAI_API_KEY` | Yes | Provider API key |
| `OPENAI_MODEL` | Yes | Primary model |
| `OPENAI_FALLBACK_MODEL` | No | Fallback model |
| `PROVIDER_RETRY_ATTEMPTS` | No | Provider retry count |
| `TERMINAL_TIMEOUT_MS` | No | Terminal command timeout |
| `TERMINAL_ALLOWLIST` | No | Comma-separated allowed commands |
| `TERMINAL_DENYLIST` | No | Comma-separated denied commands |

## Telegram Setup
1. Create a bot via BotFather.
2. Set `TELEGRAM_BOT_TOKEN`.
3. Set your numeric Telegram user ID as `TELEGRAM_OWNER_ID`.
4. Run app and send `/start`.

## OpenAI-compatible Provider Setup
1. Set `OPENAI_BASE_URL` (for OpenAI/OpenRouter/compatible gateway).
2. Set `OPENAI_API_KEY`.
3. Choose `OPENAI_MODEL` (+ optional fallback model).

## Approvals & Security Model
- High-risk tools require explicit owner decision (`approve_once` or `reject`).
- Approval requests include risk, reason, command/files preview, rollback hint.
- All tool attempts and approval decisions are audit-logged.
- Unauthorized Telegram users are rejected and logged.

## API and OpenAPI Usage
- `GET /healthz`, `GET /readyz`
- `GET /api/status`
- `GET /api/approvals`
- `POST /api/approvals/:approvalId/decision`
- `GET /api/sessions`
- `GET /api/sessions/:sessionId/messages`
- `GET /openapi.json`
- `GET /docs`
- `WS /ws/events`

## Docker

```bash
docker build -t chiki .
docker run --env-file .env -p 3000:3000 chiki
```

## Docker Compose

```bash
docker compose up --build
```

## Railway Deployment
1. Click the Railway button near the top of this README.
2. Set required environment variables.
3. Deploy (health check uses `/healthz`).

## Troubleshooting
- Validate env vars against `.env.example`.
- Check startup logs for config errors.
- Verify `/readyz` before sending Telegram messages.

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License
[MIT](./LICENSE)
