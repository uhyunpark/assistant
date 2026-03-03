import { Hono } from 'hono'
import type { Env } from './types.ts'
import { parseTelegramUpdate, sendTelegramMessage } from './telegram.ts'
import { runAgent } from './agent.ts'

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => c.text('OK'))

app.post('/webhook', async (c) => {
  const body = await c.req.json()
  const update = parseTelegramUpdate(body)
  if (!update) return c.text('OK')

  const { chatId, text } = update

  try {
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
