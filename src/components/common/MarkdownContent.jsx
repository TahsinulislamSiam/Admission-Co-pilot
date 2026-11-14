import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import { sanitizeText } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

const isInternalRoute = (href) =>
  typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')

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
          // In-app routes navigate inside the SPA; external URLs open a new tab.
          a: ({ href, children }) =>
            isInternalRoute(href) ? (
              <Link
                to={href}
                className="font-medium text-brand-700 underline underline-offset-2"
              >
                {children}
              </Link>
            ) : (
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
