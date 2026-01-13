"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

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

export default function MarkdownRenderer({ content }) {
  const [activeHeading, setActiveHeading] = useState(null);

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
    <div className="markdown-content dark:text-white">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, children, ...props }) => {
            const headingText = extractText(children);
            const slug = slugify(headingText);
            return (
              <h1
                id={slug}
                data-heading="true"
                className="text-4xl font-bold text-black dark:text-white mb-6 mt-8 scroll-mt-24 py-3 px-4 rounded-lg transition-all duration-200"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2: ({ node, children, ...props }) => {
            const headingText = extractText(children);
            const slug = slugify(headingText);
            return (
              <h2
                id={slug}
                data-heading="true"
                className="text-3xl font-semibold text-black dark:text-white mb-4 mt-6 py-3 px-4 rounded-lg scroll-mt-24 transition-all duration-200"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3: ({ node, children, ...props }) => {
            const headingText = extractText(children);
            const slug = slugify(headingText);
            return (
              <h3
                id={slug}
                data-heading="true"
                className="text-2xl font-semibold text-black dark:text-white mb-3 mt-4 py-3 px-4 rounded-lg scroll-mt-24 transition-all duration-200"
                {...props}
              >
                {children}
              </h3>
            );
          },
          p: ({ node, ...props }) => (
            <p
              className="text-black dark:text-white leading-relaxed mb-4"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc pl-6 text-black dark:text-white space-y-2 mb-4"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal pl-6 text-black dark:text-white space-y-2 mb-4"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="text-black dark:text-white" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-lg mb-4"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code
                className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-2 py-1 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 my-4"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table
                className="min-w-full border border-gray-300 dark:border-gray-600"
                {...props}
              />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-black dark:text-white font-semibold"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-black dark:text-white"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-black dark:text-blue-400 underline hover:text-gray-600 dark:hover:text-blue-300"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
