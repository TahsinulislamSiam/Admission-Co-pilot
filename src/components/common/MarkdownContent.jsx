import ReactMarkdown from 'react-markdown'
import { sanitizeText } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

/**
 * Safely render AI-generated markdown (assistant answers, Bangla explanations).
 * All raw HTML is stripped by DOMPurify first; markdown is then rendered by
 * react-markdown which escapes text content — no dangerouslySetInnerHTML.
 */
export function MarkdownContent({ content, className }) {
  if (!content) return null
  const clean = sanitizeText(content)
  return (
    <div className={cn('markdown-body text-[15px] leading-relaxed', className)}>
      <ReactMarkdown
        components={{
          // Render links safely, force new tab for external URLs
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-700 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          h1: ({ children }) => <h1 className="my-2 text-lg font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="my-2 text-base font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="my-1.5 text-sm font-bold">{children}</h3>,
          p: ({ children }) => <p className="my-2">{children}</p>,
        }}
      >
        {clean}
      </ReactMarkdown>
    </div>
  )
}
