import { GoogleGenAI } from '@google/genai'
import type { Env } from './types.ts'
import { getSoul } from './soul.ts'
import { loadHistory, saveHistory } from './history.ts'
import { toolDeclarations, executeTool } from './tools.ts'

export async function runAgent(
  userMessage: string,
  chatId: number,
  env: Env
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
  const soul = await getSoul(env.KV)
  const history = await loadHistory(env.KV, chatId)

  const chat = ai.chats.create({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: soul,
      tools: [{ functionDeclarations: toolDeclarations }],
    },
    history,
  })

  let response = await chat.sendMessage({ message: userMessage })

  while (response.functionCalls?.length) {
    const results = []
    for (const fc of response.functionCalls) {
      const result = await executeTool(
        fc.name!,
        (fc.args ?? {}) as Record<string, unknown>,
        env
      )
      results.push({
        functionResponse: {
          name: fc.name!,
          response: { result },
        },
      })
    }
    response = await chat.sendMessage({ message: results })
  }

  const allHistory = chat.getHistory()
  await saveHistory(env.KV, chatId, allHistory)
  return response.text ?? ''
}
