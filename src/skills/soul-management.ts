import type { Type } from '@google/genai'
import type { Skill } from './types.ts'
import { updateSoul } from '../soul.ts'

export const soulManagementSkill: Skill = {
  name: 'soul-management',
  description: 'Update the system prompt (soul.md)',
  triggers: ['soul', '규칙', '설정', '바꿔', '변경'],
  tools: [
    {
      declaration: {
        name: 'update_soul',
        description:
          'Update the soul.md system prompt. Always show the changes to the user before calling this.',
        parameters: {
          type: 'OBJECT' as Type,
          properties: {
            updated_soul: {
              type: 'STRING' as Type,
              description: 'The full new soul.md content',
            },
          },
          required: ['updated_soul'],
        },
      },
      async execute(args, env) {
        await updateSoul(env.KV, args.updated_soul as string)
        return { success: true }
      },
    },
  ],
}
