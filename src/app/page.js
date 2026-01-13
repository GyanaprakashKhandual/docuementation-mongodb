import { getMarkdownContent } from '@/app/lib/mark.down'
import MarkdownRenderer from '@/app/components/Mark.down.render'
import RightSidebar from '@/app/components/Right.sidebar'

export default function Home() {
  const markdownData = getMarkdownContent('basic', 'Home')

  return (
    <div className="flex flex-1 min-h-screen">
      <div className="flex-1 max-w-4xl mx-auto">
        {markdownData && <MarkdownRenderer content={markdownData.content} />}
      </div>

      {markdownData && <RightSidebar content={markdownData.content} />}
    </div>
  )
}