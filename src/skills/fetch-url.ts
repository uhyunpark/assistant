import type { Type } from '@google/genai'
import type { Tool } from './types.ts'

const BLOCKED_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']

function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return true
    if (BLOCKED_HOSTNAMES.includes(parsed.hostname)) return true
    // Block private IP ranges
    if (
      parsed.hostname.startsWith('10.') ||
      parsed.hostname.startsWith('192.168.') ||
      parsed.hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)
    )
      return true
    return false
  } catch {
    return true
  }
}

async function fetchUrl(url: string): Promise<string> {
  if (isBlockedUrl(url)) {
    throw new Error('URL blocked: private/local addresses are not allowed')
  }
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

export const fetchUrlTool: Tool = {
  declaration: {
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
  async execute(args) {
    const text = await fetchUrl(args.url as string)
    return { text }
  },
}
