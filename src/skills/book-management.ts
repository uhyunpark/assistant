import type { Type } from '@google/genai'
import type { Skill } from './types.ts'
import { searchBook } from '../books.ts'
import { createBookPage } from '../notion.ts'

export const bookManagementSkill: Skill = {
  name: 'book-management',
  description: 'Search and save books to Notion',
  triggers: ['책', 'book', 'isbn', '읽을', '독서'],
  tools: [
    {
      declaration: {
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
      async execute(args) {
        const results = await searchBook(args.query as string)
        return { results }
      },
    },
    {
      declaration: {
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
      async execute(args, env) {
        const page = await createBookPage(env, {
          title: args.title as string,
          author: args.author as string,
          isbn: args.isbn as string | undefined,
          coverUrl: args.cover_url as string | undefined,
          publishedDate: args.published_date as string | undefined,
        })
        return { success: true, notionPageId: page.id, notionUrl: page.url }
      },
    },
  ],
}
