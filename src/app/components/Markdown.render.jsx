'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-4xl font-bold text-black mb-6 mt-8" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-3xl font-semibold text-black mb-4 mt-6" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-semibold text-black mb-3 mt-4" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-black leading-relaxed mb-4" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 text-black space-y-2 mb-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 text-black space-y-2 mb-4" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-black" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-lg mb-4"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-100 text-black px-2 py-1 rounded text-sm" {...props}>
                {children}
              </code>
            )
          },
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-300" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 px-4 py-2 bg-gray-50 text-black font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 px-4 py-2 text-black" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-black underline hover:text-gray-600" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}