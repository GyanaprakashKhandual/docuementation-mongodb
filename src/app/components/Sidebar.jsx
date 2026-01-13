'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, ChevronRight, ExternalLink,
  BookOpen, Database, Layers, Zap, Cpu, Moon, Sun
} from 'lucide-react'

const topicsData = [
  {
    id: 'basic',
    title: 'Basic Level',
    icon: BookOpen,
    children: [
      { id: 'intro', title: 'Introduction to MongoDB', slug: 'basic/introduction' },
      { id: 'install', title: 'Installation and Setup', slug: 'basic/installation' },
      { id: 'db-basics', title: 'Database and Collection Basics', slug: 'basic/database-basics' },
      { id: 'crud', title: 'CRUD Operations', slug: 'basic/crud-operations' },
      { id: 'data-types', title: 'Data Types', slug: 'basic/data-types' },
      { id: 'basic-query', title: 'Basic Querying', slug: 'basic/querying' },
    ]
  },
  {
    id: 'intermediate',
    title: 'Intermediate Level',
    icon: Database,
    children: [
      { id: 'adv-query', title: 'Advanced Querying', slug: 'intermediate/advanced-querying' },
      { id: 'indexes', title: 'Indexes', slug: 'intermediate/indexes' },
      { id: 'agg-basics', title: 'Aggregation Framework Basics', slug: 'intermediate/aggregation-basics' },
      { id: 'data-model', title: 'Data Modeling', slug: 'intermediate/data-modeling' },
      { id: 'transactions', title: 'Transactions', slug: 'intermediate/transactions' },
      { id: 'replica-basics', title: 'Replica Sets Basics', slug: 'intermediate/replica-sets' },
      { id: 'perf-opt', title: 'Performance Optimization', slug: 'intermediate/performance' },
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Level',
    icon: Layers,
    children: [
      { id: 'adv-agg', title: 'Advanced Aggregation', slug: 'advanced/aggregation' },
      { id: 'adv-index', title: 'Advanced Indexing', slug: 'advanced/indexing' },
      { id: 'sharding', title: 'Sharding', slug: 'advanced/sharding' },
      { id: 'schema-patterns', title: 'Advanced Schema Design Patterns', slug: 'advanced/schema-patterns' },
      { id: 'security', title: 'Security', slug: 'advanced/security' },
      { id: 'backup', title: 'Backup and Restore', slug: 'advanced/backup-restore' },
      { id: 'adv-trans', title: 'Advanced Transactions', slug: 'advanced/transactions' },
      { id: 'change-streams', title: 'Change Streams', slug: 'advanced/change-streams' },
    ]
  },
  {
    id: 'super-advanced',
    title: 'Super Advanced Level',
    icon: Zap,
    children: [
      { id: 'internals', title: 'MongoDB Internals', slug: 'super-advanced/internals' },
      { id: 'adv-replication', title: 'Advanced Replication', slug: 'super-advanced/replication' },
      { id: 'adv-sharding', title: 'Advanced Sharding Architecture', slug: 'super-advanced/sharding-architecture' },
      { id: 'query-opt', title: 'Query Optimization Deep Dive', slug: 'super-advanced/query-optimization' },
      { id: 'prod-deploy', title: 'Production Deployment Architecture', slug: 'super-advanced/production' },
      { id: 'monitoring', title: 'Monitoring and Diagnostics', slug: 'super-advanced/monitoring' },
      { id: 'perf-tuning', title: 'Advanced Performance Tuning', slug: 'super-advanced/performance-tuning' },
      { id: 'time-series', title: 'Time Series Collections', slug: 'super-advanced/time-series' },
      { id: 'atlas', title: 'Advanced Atlas Features', slug: 'super-advanced/atlas' },
      { id: 'data-process', title: 'Advanced Data Processing', slug: 'super-advanced/data-processing' },
      { id: 'app-patterns', title: 'Advanced Application Patterns', slug: 'super-advanced/app-patterns' },
      { id: 'migration', title: 'Migration and Upgrades', slug: 'super-advanced/migration' },
      { id: 'compliance', title: 'Compliance and Governance', slug: 'super-advanced/compliance' },
      { id: 'cloud-native', title: 'Cloud-Native MongoDB', slug: 'super-advanced/cloud-native' },
      { id: 'cutting-edge', title: 'Cutting-Edge Features', slug: 'super-advanced/cutting-edge' },
    ]
  },
  {
    id: 'expert',
    title: 'Expert Level',
    icon: Cpu,
    children: [
      { id: 'core-dev', title: 'MongoDB Internals Development', slug: 'expert/core-development' },
      { id: 'troubleshoot', title: 'Advanced Troubleshooting', slug: 'expert/troubleshooting' },
      { id: 'custom-solutions', title: 'Custom Solutions', slug: 'expert/custom-solutions' },
    ]
  },
]

export default function Sidebar() {
  const [expandedSections, setExpandedSections] = useState({})
  const [clickedTopic, setClickedTopic] = useState(null)
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const savedExpanded = localStorage.getItem('expandedSections')
    const savedTopic = localStorage.getItem('clickedTopic')
    const savedTheme = localStorage.getItem('theme')
    
    if (savedExpanded) {
      setExpandedSections(JSON.parse(savedExpanded))
    }
    if (savedTopic) {
      setClickedTopic(savedTopic)
    }
    if (savedTheme) {
      setIsDark(JSON.parse(savedTheme))
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', JSON.stringify(newTheme))
  }

  const toggleSection = (sectionId) => {
    const newExpandedSections = {
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId]
    }
    
    if (newExpandedSections[sectionId]) {
      Object.keys(newExpandedSections).forEach(key => {
        if (key !== sectionId) {
          newExpandedSections[key] = false
        }
      })
    }
    
    setExpandedSections(newExpandedSections)
    localStorage.setItem('expandedSections', JSON.stringify(newExpandedSections))
  }

  const handleTopicClick = (slug, topicId) => {
    setClickedTopic(topicId)
    localStorage.setItem('clickedTopic', topicId)
    router.push(`/learn/${slug}`)
  }

  return (
    <div className="flex">
      <aside className="w-80 h-screen bg-white border-r border-gray-300 flex flex-col sticky top-0 dark:bg-gray-900 dark:border-gray-700">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between gap-3 z-10 border-b border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Database className="w-7 h-7 text-black dark:text-white" />
            <h1 className="text-xl font-bold text-black dark:text-white">MongoDB</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {topicsData.map((section) => {
            const Icon = section.icon
            const isExpanded = expandedSections[section.id]
            
            return (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all dark:text-white"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-black dark:text-white" />
                    <span className="font-semibold text-black dark:text-white text-sm">
                      {section.title}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-black dark:text-white" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 space-y-1 py-1">
                        {section.children.map((topic) => (
                          <button
                            key={topic.id}
                            onClick={() => handleTopicClick(topic.slug, topic.id)}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all text-left ${
                              clickedTopic === topic.id
                                ? 'bg-gray-200 dark:bg-gray-700'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm text-black dark:text-white">
                              {topic.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-300 px-4 py-4 dark:bg-gray-800 dark:border-gray-700">
          <a
            href="https://your-portfolio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium transition-all"
          >
            <span className="text-sm">Visit My Portfolio</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </aside>
    </div>
  )
}