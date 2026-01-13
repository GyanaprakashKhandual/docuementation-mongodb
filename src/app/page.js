import { getMarkdownContent } from '@/app/lib/mark.down'
import MarkdownRenderer from '@/app/components/Mark.down.render'
import RightSidebar from '@/app/components/Right.sidebar'

export default function Home() {
  const markdownData = getMarkdownContent('basic', 'Home')

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto px-8 py-12">
        {markdownData && <MarkdownRenderer content={markdownData.content} />}
      </div>

      {/* Right Sidebar - Contents */}
      {markdownData && <RightSidebar content={markdownData.content} />}
    </div>
  );
}
