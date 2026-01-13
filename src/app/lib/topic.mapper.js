// Import all topic components
import Introduction from '@/components/TopicContent/BasicLevel/Introduction'
import Installation from '@/components/TopicContent/BasicLevel/Installation'
import DatabaseBasics from '@/components/TopicContent/BasicLevel/DatabaseBasics'
// ... import all other components

const topicMap = {
  basic: {
    introduction: Introduction,
    installation: Installation,
    'database-basics': DatabaseBasics,
    'crud-operations': CrudOperations,
    'data-types': DataTypes,
    querying: Querying,
  },
  intermediate: {
    'advanced-querying': AdvancedQuerying,
    indexes: Indexes,
    'aggregation-basics': AggregationBasics,
    'data-modeling': DataModeling,
    transactions: Transactions,
    'replica-sets': ReplicaSets,
    performance: Performance,
  },
  advanced: {
    aggregation: Aggregation,
    indexing: Indexing,
    sharding: Sharding,
    'schema-patterns': SchemaPatterns,
    security: Security,
    'backup-restore': BackupRestore,
    transactions: AdvancedTransactions,
    'change-streams': ChangeStreams,
  },
  'super-advanced': {
    internals: Internals,
    replication: Replication,
    'sharding-architecture': ShardingArchitecture,
    'query-optimization': QueryOptimization,
    production: Production,
    monitoring: Monitoring,
    'performance-tuning': PerformanceTuning,
    'time-series': TimeSeries,
    atlas: Atlas,
    'data-processing': DataProcessing,
    'app-patterns': AppPatterns,
    migration: Migration,
    compliance: Compliance,
    'cloud-native': CloudNative,
    'cutting-edge': CuttingEdge,
  },
  expert: {
    'core-development': CoreDevelopment,
    troubleshooting: Troubleshooting,
    'custom-solutions': CustomSolutions,
  },
}

export function getTopicComponent(level, topic) {
  return topicMap[level]?.[topic] || null
}