import { getMarkdownContent } from "@/app/lib/mark.down";
import MarkdownRenderer from "@/app/components/Mark.down.render";
import RightSidebar from "@/app/components/Right.sidebar";
import SearchBar from "./components/Search.bar";

export default function Home() {
  const markdownData = getMarkdownContent("basic", "Home");

  return (
    <>
      <SearchBar markdownData={markdownData} />

      <div className="flex flex-1 min-h-screen">
        <div className="flex-1 max-w-4xl mx-auto px-6 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12">
          {markdownData && (
            <MarkdownRenderer content={markdownData.content} />
          )}
        </div>

        {markdownData && <RightSidebar content={markdownData.content} />}
      </div>
    </>
  );
}
