import { notFound } from 'next/navigation'
import { getMarkdownContent } from '@/app/lib/mark.down'
import MarkdownRenderer from '@/app/components/Mark.down.render'
import RightSidebar from '@/app/components/Right.sidebar'

export default async function TopicPage({ params }) {
  const { level, topic } = await params
  const markdownData = getMarkdownContent(level, topic)

  if (!markdownData) {
    notFound()
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
  )
}