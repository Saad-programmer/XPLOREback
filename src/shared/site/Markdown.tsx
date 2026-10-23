import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';

/**
 * Renders a content Markdown file (server component: no Markdown code reaches the browser).
 * Raw HTML is not rendered, and `npm run content` rejects it anyway.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        'prose prose-invert max-w-none prose-sm sm:prose-base',
        'prose-headings:font-pixel prose-headings:font-semibold prose-headings:text-foreground',
        'prose-h2:mt-10 prose-h2:border-b prose-h2:border-border prose-h2:pb-2 first:prose-h2:mt-0',
        'prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-code:rounded prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-ok prose-code:before:content-none prose-code:after:content-none',
        'prose-blockquote:border-l-warn prose-blockquote:bg-warn/5 prose-blockquote:py-1 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-foreground',
        'prose-table:text-sm prose-th:text-foreground prose-td:text-muted-foreground prose-tr:border-border prose-thead:border-border',
        'prose-li:marker:text-primary',
        // No automatic quote marks around blockquotes.
        '[&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
