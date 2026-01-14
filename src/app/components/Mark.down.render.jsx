"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Tooltip } from "./Tooltip.util";

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]/g, "")
    .replace(/\-\-+/g, "-");
};

const extractText = (children) => {
  if (typeof children === "string") {
    return children;
  }
  if (Array.isArray(children)) {
    return children
      .map((child) => {
        if (typeof child === "string") return child;
        if (child?.props?.children) return extractText(child.props.children);
        return "";
      })
      .join("");
  }
  if (children?.props?.children) {
    return extractText(children.props.children);
  }
  return String(children || "");
};

const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mb-6">
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5 rounded-t-lg border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-all duration-200"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Tooltip content="Copied" position="bottom">
                <Check className="w-3.5 h-3.5" />
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip content="Copy" position="bottom">
                <Copy className="w-3.5 h-3.5" />
              </Tooltip>
            </>
          )}
        </button>
      </div>
      <div className="bg-zinc-950 rounded-b-lg overflow-x-auto">
        <pre className="p-4 m-0 text-sm leading-relaxed">
          <code className="font-mono text-zinc-100 block whitespace-pre">
            {String(children).replace(/\n$/, "")}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default function MarkdownRenderer({ content }) {
  const [activeHeading, setActiveHeading] = useState(null);
  const [headingIds, setHeadingIds] = useState({});

  // Initialize heading ID map to match Right.sidebar
  useEffect(() => {
    if (!content) return;

    const headingRegex = /^(#{1,4})\s+(.+)$/gm;
    const idCounts = {};
    const ids = {};
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const text = match[2];
      let id = slugify(text);

      if (idCounts[id] !== undefined) {
        idCounts[id]++;
        id = `${id}-${idCounts[id]}`;
      } else {
        idCounts[id] = 0;
      }

      ids[text] = id;
    }

    setHeadingIds(ids);
  }, [content]);

  const getHeadingId = (text) => {
    return headingIds[text] || slugify(text);
  };

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll("[data-heading]");
      if (headings.length === 0) return;

      let currentActive = null;

      for (let i = headings.length - 1; i >= 0; i--) {
        const rect = headings[i].getBoundingClientRect();
        if (rect.top <= 200) {
          currentActive = headings[i].id;
          break;
        }
      }

      setActiveHeading(currentActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="markdown-content max-w-4xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, children, ...props }) => {
            const headingText = extractText(children);
            const slug = getHeadingId(headingText);
            return (
              <h1
                id={slug}
                data-heading="true"
                className="text-4xl font-bold text-gray-900 mb-6 mt-8 pb-3 border-b-2 border-gray-200 scroll-mt-24 transition-all duration-200"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2: ({ node, children, ...props }) => {
            const headingText = extractText(children);
            const slug = getHeadingId(headingText);
            return (
              <h2
                id={slug}
                data-heading="true"
                className="text-3xl font-semibold text-gray-900 mb-4 mt-8 pb-2 border-b border-gray-200 scroll-mt-24 transition-all duration-200"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3: ({ node, children, ...props }) => {
            const headingText = extractText(children);
            const slug = getHeadingId(headingText);
            return (
              <h3
                id={slug}
                data-heading="true"
                className="text-2xl font-semibold text-gray-900 mb-3 mt-6 scroll-mt-24 transition-all duration-200"
                {...props}
              >
                {children}
              </h3>
            );
          },
          h4: ({ node, children, ...props }) => {
            const headingText = extractText(children);
            const slug = getHeadingId(headingText);
            return (
              <h4
                id={slug}
                data-heading="true"
                className="text-xl font-semibold text-gray-900 mb-2 mt-4 scroll-mt-24"
                {...props}
              >
                {children}
              </h4>
            );
          },
          p: ({ node, ...props }) => (
            <p
              className="text-gray-700 leading-relaxed mb-4 text-base"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-none pl-0 text-gray-700 space-y-2 mb-6"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal pl-6 text-gray-700 space-y-2 mb-6 marker:text-gray-500"
              {...props}
            />
          ),
          li: ({ node, children, ...props }) => {
            const isUnordered = node?.parent?.tagName === "ul";

            return (
              <li
                className={`text-gray-700 ${
                  isUnordered ? "flex items-start gap-3" : ""
                }`}
                {...props}
              >
                {isUnordered && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                )}
                <span className="flex-1">{children}</span>
              </li>
            );
          },
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <CodeBlock language={match[1]}>{children}</CodeBlock>
            ) : (
              <code
                className="bg-gray-100 text-pink-600 px-2 py-0.5 rounded font-mono text-sm border border-gray-200"
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-blue-500 bg-blue-50 pl-6 pr-4 py-4 italic text-gray-700 my-6 rounded-r-lg"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200 shadow-sm">
              <table
                className="min-w-full divide-y divide-gray-200"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="bg-white divide-y divide-gray-200" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="px-6 py-4 text-sm text-gray-700" {...props} />
          ),
          a: ({ node, href, children, ...props }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-700 underline decoration-blue-400 decoration-2 underline-offset-2 transition-colors inline-flex items-center gap-1 group"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            >
              {children}
              {href?.startsWith("http") && (
                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              )}
            </a>
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-t-2 border-gray-200" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-gray-900" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-700" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}