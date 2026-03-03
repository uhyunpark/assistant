import type { Type } from '@google/genai'
import type { Skill } from './types.ts'
import { fetchUrlTool } from './fetch-url.ts'
import { createArticlePage } from '../notion.ts'

function getKSTDate(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().split('T')[0]!
}

export const articleResearchSkill: Skill = {
  name: 'article-research',
  description: 'Fetch, classify, and save articles to Notion',
  triggers: ['http', 'https', 'url', '기사', '아티클', '요약', '저장'],
  instructions:
    'URL을 받으면 fetch → 3줄 요약 → 카테고리 분류 → Notion 저장',
  tools: [
    fetchUrlTool,
    {
      declaration: {
        name: 'classify_and_save_article',
        description:
          'Classify an article and save it to the Notion articles database.',
        parameters: {
          type: 'OBJECT' as Type,
          properties: {
            title: {
              type: 'STRING' as Type,
              description: 'Article title',
            },
            url: {
              type: 'STRING' as Type,
              description: 'Article URL (optional)',
            },
            summary: {
              type: 'STRING' as Type,
              description: 'Brief summary of the article (3 lines or less)',
            },
            category: {
              type: 'STRING' as Type,
              description:
                'Category: crypto, tech, culture, philosophy, business, or other',
            },
          },
          required: ['title', 'summary', 'category'],
        },
      },
      async execute(args, env) {
        const date = getKSTDate()
        const page = await createArticlePage(env, {
          title: args.title as string,
          url: args.url as string | undefined,
          summary: args.summary as string,
          category: args.category as string,
          date,
        })
        return { success: true, notionPageId: page.id, notionUrl: page.url }
      },
    },
  ],
}
