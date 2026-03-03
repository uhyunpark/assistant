import { Hono } from 'hono'
import type { Env } from './types.ts'
import {
  parseTelegramUpdate,
  sendTelegramMessage,
  sendTypingAction,
} from './telegram.ts'
import { runAgent } from './agent.ts'

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => c.text('OK'))

app.post('/webhook', async (c) => {
  const secret = c.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret) {
    console.warn('TELEGRAM_WEBHOOK_SECRET is not set — webhook is unprotected')
  }
  if (secret) {
    const token = c.req.header('X-Telegram-Bot-Api-Secret-Token')
    if (token !== secret) {
      return c.text('Unauthorized', 403)
    }
  }

  const body = await c.req.json()
  const update = parseTelegramUpdate(body)

  // Silently ignore non-text messages (photos, stickers, etc.)
  if (!update) return c.text('OK')

  const { chatId, text } = update

  // Check chat ID allowlist
  const allowed = c.env.ALLOWED_CHAT_IDS?.split(',').map(Number) ?? []
  if (allowed.length > 0 && !allowed.includes(chatId)) {
    return c.text('OK') // silently ignore unauthorized users
  }

  try {
    await sendTypingAction(c.env.TELEGRAM_BOT_TOKEN, chatId)
    const reply = await runAgent(text, chatId, c.env)
    await sendTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, chatId, reply)
  } catch (err) {
    console.error('Agent error:', err)
    const errorMsg =
      err instanceof Error ? err.message : 'Unknown error occurred'
    await sendTelegramMessage(
      c.env.TELEGRAM_BOT_TOKEN,
      chatId,
      `오류가 발생했습니다: ${errorMsg}`
    )
  }

  return c.text('OK')
})

export default app
