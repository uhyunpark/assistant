# musm

Telegram personal assistant running on Cloudflare Workers. Uses Gemini Flash for agentic tool-use with Notion as the backend store. Responds in Korean.

## Features

- **Agentic conversation** — Multi-turn tool-use loop powered by Gemini Flash function calling (up to 10 rounds per message)
- **Article research** — Fetch, classify, and save web articles to Notion
- **Book management** — Search Google Books and save to Notion
- **Soul management** — Self-editable system prompt with version history and rollback
- **Conversation history** — Per-chat history stored in Cloudflare KV (20-turn window)

## Tech Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **AI:** Google Gemini Flash (`@google/genai`)
- **Storage:** Cloudflare KV (conversation history, system prompt) + Notion (articles, books)
- **Language:** TypeScript

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Cloudflare account with Workers enabled
- API keys for Telegram Bot, Gemini, and Notion

### Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a KV namespace and update `wrangler.toml`:

   ```bash
   bunx wrangler kv namespace create KV
   ```

   Replace the `id = "PLACEHOLDER"` in `wrangler.toml` with the returned namespace ID.

3. Set secrets:

   ```bash
   bunx wrangler secret put TELEGRAM_BOT_TOKEN
   bunx wrangler secret put TELEGRAM_WEBHOOK_SECRET
   bunx wrangler secret put GEMINI_API_KEY
   bunx wrangler secret put NOTION_API_KEY
   bunx wrangler secret put NOTION_ARTICLES_DB_ID
   bunx wrangler secret put NOTION_BOOKS_DB_ID
   bunx wrangler secret put ALLOWED_CHAT_IDS
   ```

4. Register the Telegram webhook:

   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>/webhook&secret_token=<SECRET>
   ```

### Development

```bash
bun run dev          # Local dev server (wrangler dev)
bun run typecheck    # TypeScript type check
```

### Deploy

```bash
bun run deploy       # Deploy to Cloudflare Workers
```

## Architecture

```
Telegram webhook
  → Hono router (src/index.ts)
  → Allowlist check
  → runAgent() (src/agent.ts)
  → Gemini Chat API with function calling
  → Skill registry (src/skills/)
  → Telegram reply
```

### Skills

Each skill groups related tools with metadata. Located in `src/skills/`:

| Skill | Description |
|-------|-------------|
| `article-research` | Fetch, classify, and save articles to Notion |
| `book-management` | Search Google Books and save to Notion |
| `soul-management` | Update system prompt with version history |
| `fetch-url` | Standalone URL fetcher with SSRF protection |

### Adding a New Skill

```typescript
// src/skills/my-skill.ts
export const mySkill: Skill = {
  name: 'my-skill',
  description: '...',
  triggers: ['keyword1', 'keyword2'],
  tools: [{ declaration: {...}, execute(args, env) {...} }],
}

// Register in src/agent.ts:
registry.register(mySkill)
```

## License

Private
