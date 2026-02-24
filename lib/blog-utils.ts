// Convert title to URL-friendly slug
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Parse comma-separated tags into array
export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

// Format tags array back to comma-separated string
export function formatTags(tags: string[]): string {
  return tags.join(', ')
}

// Estimate read time from HTML content
export function estimateReadTime(content: string): string {
  const text = content.replace(/<[^>]+>/g, '')
  const words = text.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}