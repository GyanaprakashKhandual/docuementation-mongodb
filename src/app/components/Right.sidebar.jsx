"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, ChevronRight } from "lucide-react";

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]/g, "")
    .replace(/\-\-+/g, "-");
};

const extractHeadingsFromMarkdown = (markdown) => {
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const id = slugify(text);

    headings.push({
      id,
      text,
      level,
    });
  }

  return headings;
};

export default function RightSidebar({ content }) {
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);

  useEffect(() => {
    if (!content) return;

    const extractedHeadings = extractHeadingsFromMarkdown(content);
    setHeadings(extractedHeadings);

    if (extractedHeadings.length > 0) {
      setActiveHeading(extractedHeadings[0].id);
    }
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      if (headings.length === 0) return;

      let currentActive = activeHeading;

      for (let i = headings.length - 1; i >= 0; i--) {
        const element = document.getElementById(headings[i].id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        if (rect.top <= 200) {
          currentActive = headings[i].id;
          break;
        }
      }

      setActiveHeading(currentActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings, activeHeading]);

  const handleHeadingClick = useCallback(
    (id) => {
      let element = document.getElementById(id);

      if (!element) {
        let retries = 0;
        const retryInterval = setInterval(() => {
          retries++;
          element = document.getElementById(id);

          if (element || retries > 5) {
            clearInterval(retryInterval);

            if (element) {
              setActiveHeading(id);
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }, 100);
      } else {
        setActiveHeading(id);
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [headings]
  );

  return (
    <aside className="w-72 h-screen bg-white border-l border-gray-300 flex flex-col sticky top-0 dark:bg-gray-900 dark:border-gray-700 overflow-hidden">
      <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-300 dark:bg-gray-800 dark:border-gray-700 z-10">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-black dark:text-white" />
          <h2 className="text-lg font-bold text-black dark:text-white">
            Contents
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {headings.length > 0 ? (
          headings.map((heading) => (
            <motion.button
              key={heading.id}
              onClick={() => handleHeadingClick(heading.id)}
              className={`w-full flex items-start gap-2 px-4 py-3 rounded-lg transition-all text-left text-sm font-medium ${
                activeHeading === heading.id
                  ? "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              style={{
                paddingLeft: `${1 + (heading.level - 2) * 0.75}rem`,
              }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" />
              <span className="line-clamp-2">{heading.text}</span>
            </motion.button>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No headings found
          </p>
        )}
      </div>
    </aside>
  );
}
