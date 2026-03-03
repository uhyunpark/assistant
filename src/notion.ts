import type { Env } from './types.ts'

const NOTION_VERSION = '2022-06-28'
const NOTION_BASE = 'https://api.notion.com/v1'

function notionHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  }
}

export async function createArticlePage(
  env: Env,
  data: {
    title: string
    url?: string
    summary: string
    category: string
    date: string
  }
): Promise<{ id: string; url: string }> {
  const properties: Record<string, unknown> = {
    Title: { title: [{ text: { content: data.title } }] },
    Summary: {
      rich_text: [{ text: { content: data.summary.slice(0, 2000) } }],
    },
    Category: { select: { name: data.category } },
    Date: { date: { start: data.date } },
  }

  if (data.url) {
    properties.URL = { url: data.url }
  }

  const res = await fetch(`${NOTION_BASE}/pages`, {
    method: 'POST',
    headers: notionHeaders(env.NOTION_API_KEY),
    body: JSON.stringify({
      parent: { database_id: env.NOTION_ARTICLES_DB_ID },
      properties,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion API error: ${res.status} ${err}`)
  }

  const page = (await res.json()) as { id: string; url: string }
  return { id: page.id, url: page.url }
}

export async function createBookPage(
  env: Env,
  data: {
    title: string
    author: string
    isbn?: string
    coverUrl?: string
    publishedDate?: string
  }
): Promise<{ id: string; url: string }> {
  const properties: Record<string, unknown> = {
    Title: { title: [{ text: { content: data.title } }] },
    Author: { rich_text: [{ text: { content: data.author } }] },
    Status: { select: { name: 'To Read' } },
  }

  if (data.isbn) {
    properties.ISBN = { rich_text: [{ text: { content: data.isbn } }] }
  }
  if (data.coverUrl) {
    properties.Cover = { url: data.coverUrl }
  }
  if (data.publishedDate) {
    properties.Date = { date: { start: data.publishedDate } }
  }

  const pageBody: Record<string, unknown> = {
    parent: { database_id: env.NOTION_BOOKS_DB_ID },
    properties,
  }
  if (data.coverUrl) {
    pageBody.cover = { type: 'external', external: { url: data.coverUrl } }
  }

  const res = await fetch(`${NOTION_BASE}/pages`, {
    method: 'POST',
    headers: notionHeaders(env.NOTION_API_KEY),
    body: JSON.stringify(pageBody),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion API error: ${res.status} ${err}`)
  }

  const page = (await res.json()) as { id: string; url: string }
  return { id: page.id, url: page.url }
}
