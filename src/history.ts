import type { Content } from '@google/genai'

const MAX_TURNS = 20

function historyKey(chatId: number): string {
  return `history:${chatId}`
}

export async function loadHistory(
  kv: KVNamespace,
  chatId: number
): Promise<Content[]> {
  const stored = await kv.get(historyKey(chatId))
  if (!stored) return []
  return JSON.parse(stored) as Content[]
}

export async function saveHistory(
  kv: KVNamespace,
  chatId: number,
  history: Content[]
): Promise<void> {
  const trimmed = history.slice(-MAX_TURNS)
  await kv.put(historyKey(chatId), JSON.stringify(trimmed))
}
