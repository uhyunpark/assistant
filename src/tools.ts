import type { FunctionDeclaration, Type } from '@google/genai'
import type { Env } from './types.ts'
import { createArticlePage, createBookPage } from './notion.ts'
import { searchBook } from './books.ts'
import { updateSoul } from './soul.ts'

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'fetch_url',
    description: 'Fetch a URL and return the text content of the page.',
    parameters: {
      type: 'OBJECT' as Type,
      properties: {
        url: {
          type: 'STRING' as Type,
          description: 'The URL to fetch',
        },
      },
      required: ['url'],
    },
  },
  {
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
  {
    name: 'search_book',
    description: 'Search for books using Google Books API.',
    parameters: {
      type: 'OBJECT' as Type,
      properties: {
        query: {
          type: 'STRING' as Type,
          description: 'Search query for the book',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'save_book',
    description: 'Save a book to the Notion books database.',
    parameters: {
      type: 'OBJECT' as Type,
      properties: {
        title: {
          type: 'STRING' as Type,
          description: 'Book title',
        },
        author: {
          type: 'STRING' as Type,
          description: 'Book author(s)',
        },
        isbn: {
          type: 'STRING' as Type,
          description: 'ISBN (optional)',
        },
        cover_url: {
          type: 'STRING' as Type,
          description: 'Cover image URL (optional)',
        },
        published_date: {
          type: 'STRING' as Type,
          description: 'Publication date (optional)',
        },
      },
      required: ['title', 'author'],
    },
  },
  {
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
]

async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
  }
  const html = await res.text()
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, 10000)
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  env: Env
): Promise<unknown> {
  switch (name) {
    case 'fetch_url':
      return { text: await fetchUrl(args.url as string) }

    case 'classify_and_save_article': {
      const today = new Date().toISOString().split('T')[0]!
      const page = await createArticlePage(env, {
        title: args.title as string,
        url: args.url as string | undefined,
        summary: args.summary as string,
        category: args.category as string,
        date: today,
      })
      return { success: true, notionPageId: page.id, notionUrl: page.url }
    }

    case 'search_book': {
      const results = await searchBook(args.query as string)
      return { results }
    }

    case 'save_book': {
      const page = await createBookPage(env, {
        title: args.title as string,
        author: args.author as string,
        isbn: args.isbn as string | undefined,
        coverUrl: args.cover_url as string | undefined,
        publishedDate: args.published_date as string | undefined,
      })
      return { success: true, notionPageId: page.id, notionUrl: page.url }
    }

    case 'update_soul': {
      await updateSoul(env.KV, args.updated_soul as string)
      return { success: true }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
