import type { Content } from '@google/genai'

const MAX_TURNS = 20
const MAX_TOOL_RESULT_LENGTH = 500

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

function truncateToolResults(history: Content[]): Content[] {
  return history.map((entry) => {
    if (!entry.parts) return entry
    const hasFunctionResponse = entry.parts.some((p) => p.functionResponse)
    if (!hasFunctionResponse) return entry
    return {
      ...entry,
      parts: entry.parts.map((part) => {
        if (!part.functionResponse) return part
        const responseStr = JSON.stringify(part.functionResponse.response)
        if (responseStr.length <= MAX_TOOL_RESULT_LENGTH) return part
        return {
          ...part,
          functionResponse: {
            ...part.functionResponse,
            response: {
              truncated: responseStr.slice(0, MAX_TOOL_RESULT_LENGTH) + '\n...(truncated)',
            },
          },
        }
      }),
    }
  })
}

export async function saveHistory(
  kv: KVNamespace,
  chatId: number,
  history: Content[]
): Promise<void> {
  let trimmed = history.slice(-MAX_TURNS)

  // Ensure first retained entry starts on a user turn
  while (trimmed.length > 0 && trimmed[0]?.role !== 'user') {
    trimmed = trimmed.slice(1)
  }

  trimmed = truncateToolResults(trimmed)
  await kv.put(historyKey(chatId), JSON.stringify(trimmed))
}
