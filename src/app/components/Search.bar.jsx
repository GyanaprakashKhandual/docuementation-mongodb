"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

export default function SearchBar({ markdownData }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        setSearchQuery("");
      }

      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const highlightSearchText = (text) => {
    if (!searchQuery.trim()) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts
      .map((part) =>
        part.toLowerCase() === searchQuery.toLowerCase()
          ? `<mark class="bg-yellow-300 dark:bg-yellow-600 rounded px-1">${part}</mark>`
          : part
      )
      .join("");
  };

  return (
    <>
      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-start justify-center pt-20">
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-300 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 outline-none bg-transparent text-black dark:text-white text-lg placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto p-4">
              {searchQuery.trim() ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Search results for "{searchQuery}"
                  </p>
                  <div
                    className="text-black dark:text-white text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: markdownData?.content
                        ? markdownData.content
                            .split("\n")
                            .filter((line) =>
                              line
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            )
                            .map(highlightSearchText)
                            .join("<br/>") || "No results found"
                        : "No results found",
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Start typing to search documentation...
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Press <span className="font-semibold">ESC</span> to close
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}