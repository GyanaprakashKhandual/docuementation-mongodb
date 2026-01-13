import { notFound } from 'next/navigation'
import { getMarkdownContent } from '@/app/lib/mark.down'
import MarkdownRenderer from '@/app/components/Markdown.render'
export default async function TopicPage({ params }) {
  const { level, topic } = await params
  const markdownData = getMarkdownContent(level, topic)

  if (!markdownData) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <MarkdownRenderer content={markdownData.content} />
    </div>
  )
}