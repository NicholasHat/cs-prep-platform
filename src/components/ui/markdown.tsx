import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders GitHub-flavored markdown with explicit element styling — the project
 * has no typography plugin, and the handbook leans on tables and fenced code
 * heavily enough to be worth styling deliberately.
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-8 mb-3 text-xl font-semibold tracking-tight first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-2 text-base font-semibold first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-2 text-sm font-semibold first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="my-3 first:mt-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-3 ml-5 list-disc space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-5 list-decimal space-y-1.5">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-primary/40 pl-4 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-border" />,
          // Wide code and tables scroll inside their own box so the page never
          // scrolls sideways.
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-md border bg-muted/60 p-3 text-xs leading-relaxed">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const isBlock = /language-/.test(className ?? "");
            if (isBlock) {
              return <code className="font-mono">{children}</code>;
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-md border">
              <table className="w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/60">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b px-3 py-2 font-medium whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b px-3 py-2 align-top last:border-0">
              {children}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
