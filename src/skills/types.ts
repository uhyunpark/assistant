import type { FunctionDeclaration } from '@google/genai'
import type { Env } from '../types.ts'

export interface Tool {
  declaration: FunctionDeclaration
  execute(args: Record<string, unknown>, env: Env): Promise<unknown>
}

export interface Skill {
  name: string
  description: string
  triggers: string[]
  instructions?: string
  tools: Tool[]
}
