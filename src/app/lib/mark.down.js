import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDirectory = path.join(process.cwd(), 'src/app/content')

const fileNameMap = {
  'introduction': 'Intro.md',
  'installation': 'Install.md',
  'database-basics': 'Dbc.md',
  'crud-operations': 'Crud.md',
  'data-types': 'Datatype.md',
  'querying': 'Basicquery.md',
  'core-development': 'Coredev.md',
  'troubleshooting': 'Advtro.md',
  'custom-solutions': 'Custom.md',
  'advanced-querying': 'Advancequery.md',
  'indexes': 'Indexes.md',
  'aggregation-basics': 'Aggregation.md',
  'data-modeling': 'Modeling.md',
  'transactions': 'Transactions.md',
  'replica-sets': 'Replica.md',
  'performance': 'Peropt.md',

}

export function getMarkdownContent(level, topic) {
  try {
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