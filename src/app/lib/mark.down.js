import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDirectory = path.join(process.cwd(), 'src/app/content')

// Map topic names to actual file names
const fileNameMap = {
  'introduction': 'Intro.md',
}

export function getMarkdownContent(level, topic) {
  try {
    // Get the actual filename, default to topic with .md extension if not in map
    const fileName = fileNameMap[topic] || `${topic}.md`
    const fullPath = path.join(contentDirectory, level, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    
    return {
      content,
      frontmatter: data
    }
  } catch (error) {
    return null
  }
}

export function getAllTopics(level) {
  const levelPath = path.join(contentDirectory, level)
  const files = fs.readdirSync(levelPath)
  
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace('.md', ''))
}