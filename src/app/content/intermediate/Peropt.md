# Performance Optimization

MongoDB performance optimization requires understanding query execution, indexing strategies, and systematic profiling. This comprehensive guide covers advanced optimization techniques and tools.

## Query Optimization

Query optimization focuses on reducing execution time and resource consumption.

### Query Optimization Principles

```bash
# Principle 1: Return only needed fields
# BAD: Returns entire document
db.users.find({ status: "active" })

# GOOD: Projects only needed fields
db.users.find(
  { status: "active" },
  { name: 1, email: 1, _id: 0 }
)

---

# Principle 2: Filter as early as possible
# BAD: Matches many documents then limits
db.orders.find({ status: "completed" }).limit(10)

# GOOD: Combine match with limit in $match
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $limit: 10 }
])

---

# Principle 3: Use indexes for filtering
# BAD: Collection scan
db.users.find({ email: "john@example.com" })

# GOOD: Indexed field lookup
db.users.createIndex({ email: 1 })
db.users.find({ email: "john@example.com" })

---

# Principle 4: Avoid field transformations in filters
# BAD: Cannot use index
db.users.find({
  joinDate: {
    $gte: new Date("2024-01-01")
  }
})
// If date stored as string, needs transformation

# GOOD: Store dates properly
db.users.find({
  joinDate: {
    $gte: new Date("2024-01-01")
  }
})
// Date type enables index usage

---

# Principle 5: Minimize data transfer
# BAD: Large documents
db.posts.find({ status: "published" })
// Returns entire post with huge text

# GOOD: Limit to necessary fields
db.posts.find(
  { status: "published" },
  { title: 1, summary: 1, _id: 1 }
)
```

### Common Query Optimization Patterns

```bash
# Pattern 1: Compound filters
db.products.find({
  category: "Electronics",
  price: { $lte: 1000 },
  inStock: true
})

# Create compound index
db.products.createIndex({
  category: 1,
  price: 1,
  inStock: 1
})

---

# Pattern 2: Range + equality
db.orders.find({
  customerId: ObjectId("..."),
  createdAt: {
    $gte: new Date("2024-01-01"),
    $lt: new Date("2024-02-01")
  }
})

# Index: equality first, then range
db.orders.createIndex({
  customerId: 1,
  createdAt: 1
})

---

# Pattern 3: Sorting with filtering
db.users.find(
  { status: "active" }
).sort({ createdAt: -1 }).limit(10)

# Index to support both filter and sort
db.users.createIndex({
  status: 1,
  createdAt: -1
})

---

# Pattern 4: Array element matching
db.posts.find({
  tags: "mongodb",
  status: "published"
})

# Index for array field
db.posts.createIndex({
  tags: 1,
  status: 1
})
```

---

## explain() and executionStats

The explain() method reveals how MongoDB executes queries.

### Basic explain() Usage

```bash
# Simple explain
db.users.find({ email: "john@example.com" }).explain("executionStats")

# Output structure:
{
  executionStages: {
    stage: "COLLSCAN",  // Collection scan
    nReturned: 1,       // Documents returned
    totalKeysExamined: 0,  // Index keys examined
    totalDocsExamined: 50000,  // Documents scanned
    executionTimeMillis: 123,   // Time spent
    inputStage: {...}
  },
  executionStats: {
    executionStages: {...},
    nReturned: 1,
    executionTimeMillis: 123,
    totalKeysExamined: 0,
    totalDocsExamined: 50000,
    serverInfo: {...}
  }
}
```

### Understanding executionStats

```bash
# Query without index
db.users.find({ email: "john@example.com" }).explain("executionStats")

# Problematic output:
{
  executionStages: {
    stage: "COLLSCAN",
    nReturned: 1,
    totalDocsExamined: 50000,  // Examined all documents!
    executionTimeMillis: 234
  }
}
// COLLSCAN = Bad, slow query

---

# Query with index
db.users.createIndex({ email: 1 })
db.users.find({ email: "john@example.com" }).explain("executionStats")

# Good output:
{
  executionStages: {
    stage: "IXSCAN",  // Index scan
    nReturned: 1,
    totalKeysExamined: 1,  // Only examined 1 index entry
    totalDocsExamined: 1,
    executionTimeMillis: 2
  }
}
// IXSCAN = Good, fast query
```

### Verbose Explain Modes

```bash
# queryPlanner: Shows query plan without execution
db.users.find({ email: "john@example.com" }).explain("queryPlanner")

# Returns:
{
  queryPlanner: {
    namespace: "myapp.users",
    indexFilterSet: false,
    parsedQuery: { email: { $eq: "..." } },
    winningPlan: {
      stage: "IXSCAN",
      keyPattern: { email: 1 },
      indexName: "email_1"
    },
    rejectedPlans: [...]  // Other plans considered
  }
}

---

# executionStats: Actual execution statistics
db.users.find({ email: "john@example.com" }).explain("executionStats")

# Returns full execution details with timing

---

# allPlansExecution: All possible plans and their stats
db.users.find({ email: "john@example.com" }).explain("allPlansExecution")

# Shows winner and all rejected plans with stats
```

### Analyzing explain() Output

```bash
# Key metrics to examine:

1. executionStages.stage
   - IXSCAN: Good (index scan)
   - COLLSCAN: Bad (collection scan)
   - FETCH: Reading full document
   - SORT: In-memory sort (expensive)

2. totalDocsExamined vs nReturned
   # Should be close (ideally same)
   # Large difference = examining too many docs

   // BAD: examined 10000, returned 5
   totalDocsExamined: 10000
   nReturned: 5

   // GOOD: examined 5, returned 5
   totalDocsExamined: 5
   nReturned: 5

3. executionTimeMillis
   # How long query took
   # Should be < 100ms for most queries

4. totalKeysExamined vs totalDocsExamined
   # For covered queries, should equal totalKeysExamined
```

### Practical explain() Examples

```bash
# Example 1: Inefficient query without index
db.orders.find({
  customerId: ObjectId("..."),
  status: "completed"
}).explain("executionStats")

# Output shows COLLSCAN - BAD

# Add index
db.orders.createIndex({
  customerId: 1,
  status: 1
})

# Rerun explain - shows IXSCAN - GOOD

---

# Example 2: Examining with sorting
db.users.find({ status: "active" })
  .sort({ createdAt: -1 })
  .explain("executionStats")

# Might show SORT stage (in-memory)
# Solution: Add index supporting sort
db.users.createIndex({
  status: 1,
  createdAt: -1
})

# Rerun explain - SORT stage gone

---

# Example 3: Comparing plans
db.products.find({
  category: "Electronics",
  price: { $lt: 500 }
}).explain("allPlansExecution")

# Shows multiple plans MongoDB considered
# Winner is most efficient
# Use this to optimize compound indexes
```

---

## Query Planner

The query planner evaluates multiple index strategies and chooses the best one.

### How Query Planner Works

```
Query Planner Process:

1. Parse Query
   MongoDB parses the query filter

2. Identify Candidate Indexes
   Finds indexes that could satisfy query

3. Generate Plans
   Creates execution plan for each index

4. Execute Plans
   Tries each plan briefly (100 docs)

5. Select Winner
   Chooses plan with best metrics
   - Fewest docs examined
   - Fastest execution

6. Cache Plan
   Caches winner for future use

7. Re-evaluate
   Periodically rechecks if plan still best
   Every 1000+ executions or index changes
```

### Forcing Index Usage

```bash
# Let planner choose
db.users.find({ email: "john@example.com" })

# Force specific index
db.users.find({ email: "john@example.com" }).hint({ email: 1 })

# Or with index name
db.users.find({ email: "john@example.com" }).hint("email_1")

# Force specific plan (advanced)
db.users.findOne({
  email: "john@example.com"
}, {
  hint: { email: 1 }
})
```

### Plan Caching

```bash
# View cached plans
db.collection.getPlanCache().listQueryShapes()

# Clear plan cache
db.collection.getPlanCache().clear()

# Clear specific plan
db.collection.getPlanCache().clearPlansByQuery({
  query: { email: "john@example.com" }
})

# Monitor plan cache
db.collection.getPlanCache().getPlansByQuery({
  query: { email: "john@example.com" }
})
```

### Analyzing Plan Cache

```bash
# Get detailed plan info
const plans = db.users.getPlanCache().getPlansByQuery({
  query: { status: "active" },
  sort: { createdAt: -1 }
})

plans.forEach(plan => {
  console.log("Winner:", plan.isActive)
  console.log("Works:", plan.works)
  console.log("Created:", plan.createdDate)
})
```

---

## Index Selectivity

Selectivity measures how effectively an index filters documents.

### Understanding Selectivity

```bash
# High Selectivity (Good)
# Index eliminates many documents

db.users.find({ email: "john@example.com" })
// 50,000 documents total
// Email is unique (or nearly)
// Returns 1 document
// Selectivity: 1/50,000 = 0.00002 (excellent)

---

# Low Selectivity (Bad)
# Index doesn't filter much

db.users.find({ gender: "M" })
// 50,000 documents total
// Returns 25,000 documents
// Selectivity: 25,000/50,000 = 0.5 (poor)
// Should not use index if this is only filter
```

### Improving Selectivity

```bash
# BAD: Low selectivity index on boolean
db.users.find({ isActive: true })
// Returns 40,000 of 50,000 documents
// Selectivity: 0.8 (terrible)

# SOLUTION: Add more selective field
db.users.find({
  isActive: true,
  email: "john@example.com"
})

# Create compound index
db.users.createIndex({
  email: 1,      // High selectivity first
  isActive: 1
})

---

# BAD: Low selectivity on enum
db.orders.find({ status: "completed" })
// Returns 30,000 of 100,000
// Selectivity: 0.3

# BETTER: Add date range
db.orders.find({
  status: "completed",
  createdAt: { $gte: new Date("2024-01-01") }
})

db.orders.createIndex({
  createdAt: 1,  // More selective
  status: 1
})
```

### Measuring Selectivity

```bash
# Calculate from explain() output
db.users.find({ email: "john@example.com" }).explain("executionStats")

const stats = db.users.find({
  email: "john@example.com"
}).explain("executionStats").executionStats

const selectivity = stats.nReturned / stats.totalDocsExamined
console.log("Selectivity:", selectivity)
// If < 0.1: excellent
// If < 0.5: good
// If > 0.5: consider index
```

---

## Covered Queries

Covered queries return results using only index, never accessing collection.

### What Makes a Query Covered

```bash
# Requirements:
# 1. All fields in query filter are in index
# 2. All fields in projection are in index
# 3. No fields in projection are excluded (_id: 0)
# 4. Cannot examine fields not in index

---

# Example 1: Covered query
db.users.createIndex({ email: 1, name: 1 })

db.users.find(
  { email: "john@example.com" },
  { email: 1, name: 1, _id: 0 }
)

// explain() output:
// stage: IXSCAN
// executionStages.stage: "IXSCAN"
// // Indicates covered query - no FETCH stage

---

# Example 2: NOT covered (has _id in projection)
db.users.find(
  { email: "john@example.com" },
  { email: 1, name: 1 }  // Includes _id by default
)

// explain() output:
// Shows FETCH stage - not covered
// Must access collection for _id

---

# Example 3: NOT covered (projects field not in index)
db.users.find(
  { email: "john@example.com" },
  { email: 1, name: 1, phone: 1 }  // Phone not indexed
)

// Shows FETCH stage
// Must access collection for phone
```

### Creating Covered Query Indexes

```bash
# Index strategy for covered queries
# Include all projected fields in index

# Query: Find user email and name by id
db.users.find(
  { _id: ObjectId() },
  { email: 1, name: 1, _id: 1 }
)

# Covered index (includes all fields)
db.users.createIndex({
  _id: 1,
  email: 1,
  name: 1
})

# Now covered - no collection access needed

---

# Complex covered query
db.orders.find(
  { customerId: ObjectId(), status: "completed" },
  { amount: 1, createdAt: 1 }
)

db.orders.createIndex({
  customerId: 1,
  status: 1,
  amount: 1,
  createdAt: 1
})
```

### Performance Impact of Covered Queries

```bash
# Non-covered query
db.users.find({ email: "john@example.com" })

// Without index covering
// IXSCAN: 1ms (index lookup)
// FETCH: 50ms (read document from disk)
// Total: 51ms

---

# Covered query
db.users.find(
  { email: "john@example.com" },
  { email: 1, _id: 0 }
)

// With index covering
// IXSCAN: 1ms (index lookup only)
// FETCH: 0ms (not needed)
// Total: 1ms

// 50x faster!
```

### Identifying Opportunities for Covered Queries

```bash
# Check for FETCH stage in explain
db.collection.find(query, projection).explain("executionStats")

// If executionStages has FETCH child:
// Opportunity for covering

// Solution:
// Add missing projected fields to index

---

# Example optimization
// Original query
db.products.find(
  { category: "Electronics" },
  { name: 1, price: 1 }
)

// Original explain shows FETCH

// Add price to index
db.products.createIndex({
  category: 1,
  price: 1,
  name: 1
})

// Still might have FETCH for name

// Better: Covered index
db.products.createIndex({
  category: 1,
  name: 1,
  price: 1,
  _id: 1  // Needed if _id in projection
})
```

---

## Profiling Slow Queries

Systematic profiling identifies performance problems.

### Enabling Database Profiler

```bash
# Turn on profiling
# 0 = off, 1 = slow queries, 2 = all

# Profile all queries
db.setProfilingLevel(2)

# Profile slow queries (100ms default)
db.setProfilingLevel(1, { slowms: 100 })

# Profile slow queries for specific operation
db.setProfilingLevel(1, { slowms: 50 })

# Get current level
db.getProfilingLevel()

# Turn off
db.setProfilingLevel(0)
```

### Viewing Profiled Queries

```bash
# Profiler stores in system.profile collection

# Find all slow queries
db.system.profile.find().pretty()

# Find by operation
db.system.profile.find({ op: "query" }).pretty()

# Find slowest queries
db.system.profile.find()
  .sort({ millis: -1 })
  .limit(5)

# Find queries taking > 100ms
db.system.profile.find({ millis: { $gt: 100 } }).pretty()

# Queries by collection
db.system.profile.find({ ns: "myapp.users" }).pretty()

# Failed queries
db.system.profile.find({ errCode: { $exists: true } })
```

### Analyzing Profile Data

```bash
# Get statistics on slow queries
db.system.profile.aggregate([
  { $group: {
    _id: "$ns",  // Group by collection
    count: { $sum: 1 },
    totalTime: { $sum: "$millis" },
    avgTime: { $avg: "$millis" },
    maxTime: { $max: "$millis" }
  } }
])

# Slowest operations by type
db.system.profile.aggregate([
  { $group: {
    _id: "$op",
    count: { $sum: 1 },
    totalTime: { $sum: "$millis" },
    avgTime: { $avg: "$millis" }
  } },
  { $sort: { totalTime: -1 } }
])

# Top 10 slowest queries
db.system.profile.find()
  .sort({ millis: -1 })
  .limit(10)
  .project({
    ns: 1,
    millis: 1,
    execStats: 1,
    command: 1
  })
```

### Profile Entry Structure

```bash
// Example slow query profile entry
{
  op: "query",
  ns: "myapp.users",
  command: {
    find: "users",
    filter: { status: "active" },
    projection: { name: 1, email: 1 },
    batchSize: 1000
  },
  millis: 234,       // Duration
  planSummary: "COLLSCAN",  // Execution plan
  execStats: {
    executionStages: {
      stage: "COLLSCAN",
      nReturned: 500,
      totalKeysExamined: 0,
      totalDocsExamined: 50000
    }
  },
  ts: ISODate("2024-01-15T10:30:00Z"),
  client: "192.168.1.100",
  appName: "MyApp",
  user: "app_user"
}
```

---

## Database Profiler Configuration

Advanced profiling configuration for production.

### Profiler Settings

```bash
# Profile with custom filter
db.setProfilingLevel(1, {
  slowms: 100,
  sampleRate: 0.5  // Profile 50% of slow queries
})

# Profile specific operations
db.setProfilingLevel(1, {
  slowms: 100,
  filter: {
    op: { $in: ["query", "update"] }
  }
})

# Profile specific collections
db.setProfilingLevel(1, {
  slowms: 50,
  filter: {
    ns: "myapp.users"
  }
})

# Profile by application
db.setProfilingLevel(1, {
  slowms: 100,
  filter: {
    appName: "MyApp"
  }
})
```

### Profiler Management

```bash
# Check profiling configuration
db.getProfilingStatus()

// Returns:
// {
//   was: 1,          // Current level
//   slowms: 100,     // Slow query threshold
//   sampleRate: 1.0
// }

---

# Get profile size
db.system.profile.stats().size

// Profile collection has size limit
// Default: 1% of RAM
// Old entries removed automatically

---

# Resize profile collection
db.setProfilingLevel(0)  // Turn off first

// Drop and recreate
db.system.profile.drop()

// Restart with new size
db.setProfilingLevel(1, { slowms: 100 })
```

---

## mongotop and mongostat Utilities

Command-line tools for monitoring MongoDB performance.

### mongostat

Displays MongoDB server statistics in real-time.

```bash
# Basic usage
mongostat

# Output shows:
# insert query update delete getmore command flushes vsize  res
# 2     100  5      1      0       1       0        100mb  50mb
#
# Each column updated every second

---

# Connect to specific server
mongostat --host localhost:27017

---

# Specify interval (every 5 seconds)
mongostat --interval 5

---

# Sample output columns:
# insert: Inserts per second
# query: Queries per second
# update: Updates per second
# delete: Deletes per second
# getmore: Getmore operations (cursor continuation)
# command: Commands per second
# flushes: Fsyncs per second
# vsize: Virtual memory size
# res: Resident memory size
# locked: % time locked (if journaling enabled)
# conn: Number of connections
# qr|qw: Read/write queue length
# ar|aw: Active read/write connections
```

### mongotop

Shows database and collection statistics.

```bash
# Basic usage
mongotop

# Output shows time spent reading/writing per collection:
# ns                          read    write
# admin.system.version        0ms     0ms
# myapp.users                 100ms   50ms
# myapp.orders                150ms   75ms
# myapp.products              50ms    25ms

---

# Interval in seconds
mongotop 5

# Refreshes every 5 seconds

---

# Connect to specific server
mongotop --host localhost:27017

---

# Watch specific database
mongotop --db myapp

---

# Sample interpretation:
# High read time on collection: Frequent reads, optimize with index
# High write time on collection: Many writes, consider sharding
# Imbalanced read/write: May indicate slow queries
```

### Practical Monitoring Session

```bash
# Terminal 1: Start mongostat
mongostat --interval 2

# Monitor overall server health
# Watch for:
# - High insert/query/update rates
# - Memory usage growth
# - Connection spikes

---

# Terminal 2: Start mongotop
mongotop 5

# Monitor per-collection activity
# Watch for:
# - Collections with high read/write time
# - Unbalanced access patterns
# - Unexpected spikes

---

# Terminal 3: Identify slow queries
db.setProfilingLevel(1, { slowms: 100 })

// Run slow queries and examine profile
db.system.profile.find().sort({ millis: -1 }).limit(5).pretty()

---

# Combine insights:
# 1. mongostat shows high query rate
# 2. mongotop shows high read time on users collection
# 3. Profile shows COLLSCAN on users.find({ email: ... })
# 4. Solution: Add index on email field
```

---

## Complete Performance Optimization Example

```bash
# Scenario: Slow user queries application

# Step 1: Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

# Step 2: Monitor with mongostat and mongotop
mongostat --interval 2
mongotop 5

# Step 3: Run application load, observe high activity

# Step 4: Examine slow queries
db.system.profile.find({ ns: "myapp.users" })
  .sort({ millis: -1 })
  .limit(5)
  .pretty()

# Output shows slow queries:
// op: "query",
// command: { find: "users", filter: { email: "...", status: "..." } },
// millis: 450,
// planSummary: "COLLSCAN"

# Step 5: Analyze with explain
db.users.find({
  email: "john@example.com",
  status: "active"
}).explain("executionStats")

// Shows:
// stage: "COLLSCAN"
// totalDocsExamined: 50000
// nReturned: 1

# Step 6: Create index
db.users.createIndex({
  email: 1,
  status: 1
})

# Step 7: Verify improvement
db.users.find({
  email: "john@example.com",
  status: "active"
}).explain("executionStats")

// Now shows:
// stage: "IXSCAN"
// totalKeysExamined: 1
// nReturned: 1
// executionTimeMillis: 2  // Was 450ms!

# Step 8: Monitor improvement
// mongostat now shows lower query times
// mongotop shows less time on users collection

# Step 9: Disable profiler
db.setProfilingLevel(0)

# Result: 225x faster queries! (450ms → 2ms)
```

---

## Performance Optimization Checklist

```bash
□ Enable profiling for slow queries
□ Use mongostat/mongotop to identify bottlenecks
□ Run explain() on slow queries
□ Look for COLLSCAN in execution plans
□ Create indexes on filter fields
□ Use compound indexes for multi-field queries
□ Add sort fields to indexes
□ Create covered query indexes where beneficial
□ Project only needed fields
□ Monitor index selectivity
□ Check for FETCH stages in explain output
□ Optimize index field order
□ Monitor replication lag
□ Review query planner caching
□ Regular index maintenance (remove unused)
□ Profile application with realistic load
□ Test index changes in staging first
```

---

MongoDB performance optimization requires systematic analysis using explain(), profiling, and monitoring tools. Regular review of slow queries and thoughtful index design are key to maintaining fast performance.
