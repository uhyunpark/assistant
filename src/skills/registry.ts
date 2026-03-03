import type { FunctionDeclaration } from '@google/genai'
import type { Env } from '../types.ts'
import type { Skill } from './types.ts'

export class SkillRegistry {
  private skills: Skill[] = []
  private toolIndex = new Map<string, Skill>()

  register(skill: Skill): void {
    this.skills.push(skill)
    for (const tool of skill.tools) {
      this.toolIndex.set(tool.declaration.name!, skill)
    }
  }

  resolve(_userMessage: string): Skill[] {
    // For now: return all skills. Trigger-based filtering is a future optimization.
    return this.skills
  }

  getToolDeclarations(skills: Skill[]): FunctionDeclaration[] {
    return skills.flatMap((s) => s.tools.map((t) => t.declaration))
  }

  async executeTool(
    name: string,
    args: Record<string, unknown>,
    env: Env
  ): Promise<unknown> {
    const skill = this.toolIndex.get(name)
    if (!skill) {
      return { error: `Unknown tool: ${name}` }
    }
    const tool = skill.tools.find((t) => t.declaration.name === name)
    if (!tool) {
      return { error: `Tool not found in skill: ${name}` }
    }
    try {
      return await tool.execute(args, env)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Tool ${name} error:`, message)
      return {
        error: message,
        hint: '[Analyze the error and try a different approach.]',
      }
    }
  }
}
