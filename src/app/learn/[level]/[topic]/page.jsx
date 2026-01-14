import { notFound } from "next/navigation";
import { getMarkdownContent } from "@/app/lib/mark.down";
import MarkdownRenderer from "@/app/components/Mark.down.render";
import RightSidebar from "@/app/components/Right.sidebar";

export async function generateMetadata({ params }) {
  const { level, topic } = await params;
  const markdownData = getMarkdownContent(level, topic);

  if (!markdownData) {
    return {
      title: "Topic Not Found",
      description: "The requested MongoDB topic could not be found.",
    };
  }

  const title =
    markdownData.title ||
    topic
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const description =
    markdownData.description ||
    `Learn about ${title} in MongoDB. Comprehensive guide covering ${level} level concepts.`;

  return {
    title: `${title} | MongoDB Documentation`,
    description: description,
    openGraph: {
      title: `${title} | MongoDB Documentation`,
      description: description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | MongoDB Documentation`,
      description: description,
    },
  };
}

export default async function TopicPage({ params }) {
  const { level, topic } = await params;
  const markdownData = getMarkdownContent(level, topic);

  if (!markdownData) {
    notFound();
  }

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto px-8 py-12">
        <MarkdownRenderer content={markdownData.content} />
      </div>

      {/* Right Sidebar - Contents */}
      <RightSidebar content={markdownData.content} />
    </div>
  );
}
