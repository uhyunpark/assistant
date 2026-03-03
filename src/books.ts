export interface BookResult {
  title: string
  authors: string
  isbn: string | null
  thumbnail: string | null
  publishedDate: string | null
}

interface VolumeInfo {
  title?: string
  authors?: string[]
  publishedDate?: string
  imageLinks?: { thumbnail?: string }
  industryIdentifiers?: { type: string; identifier: string }[]
}

interface VolumesResponse {
  items?: { volumeInfo: VolumeInfo }[]
}

export async function searchBook(query: string): Promise<BookResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Google Books API error: ${res.status}`)
  }

  const data = (await res.json()) as VolumesResponse
  if (!data.items) return []

  return data.items.map((item) => {
    const info = item.volumeInfo
    const isbn =
      info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')
        ?.identifier ??
      info.industryIdentifiers?.[0]?.identifier ??
      null

    return {
      title: info.title ?? 'Unknown',
      authors: info.authors?.join(', ') ?? 'Unknown',
      isbn,
      thumbnail: info.imageLinks?.thumbnail ?? null,
      publishedDate: info.publishedDate ?? null,
    }
  })
}
