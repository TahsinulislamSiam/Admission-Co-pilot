import DOMPurify from 'dompurify'

/**
 * Strip ALL raw HTML from a text before it is handed to react-markdown.
 * Markdown formatting (headings, lists, links, bold) is preserved as text
 * and rendered safely by react-markdown; any embedded HTML/script is dropped.
 */
export function sanitizeText(text) {
  if (!text) return ''
  return DOMPurify.sanitize(String(text), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}
