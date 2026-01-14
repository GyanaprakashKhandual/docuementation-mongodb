# Indexes

Indexes are crucial for MongoDB performance. They speed up query execution by reducing the amount of data MongoDB needs to scan. This comprehensive guide covers all aspects of MongoDB indexing.

## Index Fundamentals

Indexes are data structures that store a sorted, easy-to-search copy of data from specific fields. MongoDB uses B-tree indexes by default.

### How Indexes Work

```
Without Index (Collection Scan):
Document 1 → Check
Document 2 → Check
Document 3 → Check
Document 4 → Check ✓ Match
Document 5 → Check
...continues scanning all documents

With Index (Index Scan):
        [Index Tree]
          /        \
        A-M        N-Z
       /   \      /   \
      A-F  G-M   N-S   T-Z
       ↓
    Direct access to matching document
```

### Benefits of Indexes

- ⚡ Dramatically speeds up queries
- 📊 Reduces CPU usage
- 🔍 Enables efficient sorting
- 🎯 Improves query specificity
- 💾 Enables covered queries

### Index Trade-offs

- 💾 Uses additional disk space
- ⏱️ Slows down write operations (inserts, updates, deletes)
- 🔄 Requires maintenance during updates
- ⚙️ Index overhead for small collections

---

## Creating Indexes (createIndex())

The `createIndex()` method creates indexes on collections.

### Basic Index Creation

```bash
# Create a single field index
db.users.createIndex({ email: 1 })

# Create descending index
db.users.createIndex({ joinDate: -1 })

# Create multiple indexes
db.users.createIndex({ email: 1 })
db.users.createIndex({ username: 1 })
db.users.createIndex({ status: 1 })

# Create index with name
db.users.createIndex({ email: 1 }, { name: "email_index" })

# Create index with options
db.users.createIndex(
  { email: 1 },
  {
    unique: true,
    sparse: true,
    background: true
  }
)
```

### Index Direction

```bash
# Ascending (1) - A to Z, 0 to 9
db.products.createIndex({ name: 1 })

# Descending (-1) - Z to A, 9 to 0
db.products.createIndex({ price: -1 })

# Direction matters for sort optimization
db.products.createIndex({ price: -1, name: 1 })
# Efficient for: sort({ price: -1, name: 1 })
# Less efficient for: sort({ price: 1, name: -1 })
```

### Return Value

```bash
# createIndex() returns index information
db.users.createIndex({ email: 1 })
# Returns:
# {
#   "createdCollectionAutomatically" : false,
#   "numIndexesBefore" : 1,
#   "numIndexesAfter" : 2,
#   "ok" : 1
# }
```

---

## Single Field Indexes

Single field indexes improve performance for queries on that specific field.

### Creating Single Field Indexes

```bash
# Simple single field index
db.users.createIndex({ email: 1 })
db.products.createIndex({ sku: 1 })
db.orders.createIndex({ orderNumber: 1 })

# Index on numeric field
db.employees.createIndex({ salary: 1 })

# Index on date field
db.events.createIndex({ eventDate: 1 })

# Index on boolean field
db.users.createIndex({ verified: 1 })
```

### Query Benefits

```bash
# Index on email speeds up this query
db.users.createIndex({ email: 1 })
db.users.find({ email: "john@example.com" })

# Index helps with range queries
db.products.createIndex({ price: 1 })
db.products.find({ price: { $gte: 100, $lte: 500 } })

# Index enables efficient sorting
db.users.createIndex({ joinDate: -1 })
db.users.find().sort({ joinDate: -1 }).limit(10)
```

### Single Field Index Considerations

```bash
# Index statistics
db.users.find({ email: "john@example.com" }).explain("executionStats")

# Selectivity - how many documents match
// High selectivity (few documents match) = good index
db.users.createIndex({ email: 1 })  // Very selective

// Low selectivity (many documents match) = poor index
db.users.createIndex({ status: 1 })  // Less selective
```

---

## Compound Indexes

Compound indexes index multiple fields together, enabling efficient queries on multiple fields.

### Creating Compound Indexes

```bash
# Two field compound index
db.orders.createIndex({ customerId: 1, orderDate: -1 })

# Three field compound index
db.products.createIndex({ category: 1, price: 1, name: 1 })

# Four field compound index
db.analytics.createIndex({
  userId: 1,
  eventType: 1,
  timestamp: -1,
  duration: 1
})

# Named compound index
db.orders.createIndex(
  { customerId: 1, status: 1, createdAt: -1 },
  { name: "customer_status_date_index" }
)
```

### Field Order Matters

```bash
# Index field order affects query efficiency
db.orders.createIndex({ customerId: 1, status: 1, date: -1 })

# Queries benefit from this order:
# 1. All three fields
db.orders.find({ customerId: 1, status: "pending", date: { $gte: date1 } })

# 2. First two fields
db.orders.find({ customerId: 1, status: "pending" })

# 3. First field only
db.orders.find({ customerId: 1 })

# Queries that DON'T use this index efficiently:
# Status without customerId
db.orders.find({ status: "pending" })  // Collection scan

# Date without customerId and status
db.orders.find({ date: { $gte: date1 } })  // Collection scan
```

### Compound Index Design (ESR Rule)

Design compound indexes using the ESR rule:

1. **E** - Equality fields first
2. **S** - Sort fields second
3. **R** - Range fields last

```bash
# Query: Find orders by customerId, sort by date, date range filter
db.orders.find({
  customerId: 1,
  date: { $gte: startDate, $lte: endDate }
}).sort({ date: -1 })

# GOOD: ESR order
db.orders.createIndex({
  customerId: 1,    // Equality
  date: -1          // Sort & Range
})

# ALSO GOOD:
db.orders.createIndex({
  status: 1,        // Equality
  customerId: 1,    // Equality
  date: -1          // Sort & Range
})

# The index { customerId: 1, date: -1 } covers all aspects:
# - Equality on customerId
# - Sort and range on date
```

### Covered Queries

A covered query is entirely satisfied by the index without accessing documents.

```bash
# Create index with projection fields
db.users.createIndex({ email: 1, name: 1, status: 1 })

# This query is covered (doesn't access documents)
db.users.find(
  { email: "john@example.com" },
  { email: 1, name: 1, status: 1, _id: 0 }
)

# Verify with explain
db.users.find({ email: "john@example.com" }).explain("executionStats")
# Should show: "executionStages": { "stage": "COLLSCAN" } → No, shows "COVERED"
```

---

## Multikey Indexes (for Arrays)

Multikey indexes enable efficient queries on array fields.

### Creating Multikey Indexes

```bash
# MongoDB automatically creates multikey index for array fields
db.users.createIndex({ hobbies: 1 })

# Query that uses multikey index
db.users.find({ hobbies: "reading" })

# Multikey compound index
db.posts.createIndex({ tags: 1, createdAt: -1 })

# Query using multikey compound index
db.posts.find({ tags: "mongodb", createdAt: { $gte: date } })
```

### Multikey Index Behavior

```bash
# Single document with array
db.users.insertOne({
  _id: 1,
  name: "John",
  hobbies: ["reading", "gaming", "sports"]
})

# Index creates entry for each array element
// Index entries:
// { hobbies: "reading" } → document 1
// { hobbies: "gaming" } → document 1
// { hobbies: "sports" } → document 1

# Queries that use multikey index
db.users.find({ hobbies: "reading" })       // Uses index
db.users.find({ hobbies: { $in: ["reading", "gaming"] } })  // Uses index
db.users.find({ hobbies: { $all: ["reading", "gaming"] } })  // Uses index
```

### Array of Objects Indexing

```bash
# Index on array of objects field
db.orders.createIndex({ "items.productId": 1 })
db.orders.createIndex({ "items.quantity": 1 })

# Compound multikey index
db.orders.createIndex({
  customerId: 1,
  "items.productId": 1,
  "items.quantity": 1
})

# Queries using these indexes
db.orders.find({ "items.productId": "P001" })
db.orders.find({
  customerId: 1,
  "items.productId": "P001",
  "items.quantity": { $gte: 5 }
})
```

### Multikey Index Limitations

```bash
# Cannot create compound index with multiple array fields
// This will cause error
db.data.createIndex({
  tags: 1,         // Array field
  categories: 1    // Array field
})

# Solution: Index only one array field in compound index
db.data.createIndex({
  userId: 1,       // Regular field
  tags: 1          // Array field
})
```

---

## Index Properties

Index properties control index behavior and characteristics.

### Unique Indexes

Unique indexes enforce field uniqueness across documents.

```bash
# Create unique index
db.users.createIndex({ email: 1 }, { unique: true })

# Unique index prevents duplicates
db.users.insertOne({ email: "john@example.com" })
db.users.insertOne({ email: "john@example.com" })  // Error: duplicate key

# Unique compound index
db.products.createIndex(
  { category: 1, sku: 1 },
  { unique: true }
)

# Compound uniqueness applies to field combination
db.products.insertOne({ category: "Electronics", sku: "ABC123" })
db.products.insertOne({ category: "Electronics", sku: "ABC123" })  // Error

db.products.insertOne({ category: "Clothing", sku: "ABC123" })  // OK
```

### Sparse Indexes

Sparse indexes exclude documents that lack the indexed field.

```bash
# Create sparse index
db.users.createIndex(
  { phone: 1 },
  { sparse: true }
)

# Sparse index behavior
db.users.insertOne({ name: "John", phone: "555-1234" })
db.users.insertOne({ name: "Jane" })  // No phone field, not in index

# Query behavior
db.users.find({ phone: { $exists: true } })  // Uses sparse index
db.users.find({ phone: { $exists: false } })  // Cannot use sparse index
```

### Unique Sparse Indexes

Combine unique and sparse for optional unique fields.

```bash
# Unique sparse index
db.users.createIndex(
  { username: 1 },
  { unique: true, sparse: true }
)

# Allows multiple documents without the field
db.users.insertOne({ email: "john@example.com" })
db.users.insertOne({ email: "jane@example.com" })  // Both have no username

# But enforces uniqueness when field exists
db.users.insertOne({ email: "bob@example.com", username: "bob123" })
db.users.insertOne({ email: "alice@example.com", username: "bob123" })  // Error
```

### TTL Indexes

TTL (Time To Live) indexes automatically delete documents after a specified time.

```bash
# Create TTL index (in seconds)
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }  // 1 hour
)

# Documents expire 1 hour after createdAt
db.sessions.insertOne({
  _id: 1,
  userId: 123,
  createdAt: new Date()
})
// After 1 hour, document is automatically deleted

# TTL index on login timestamps
db.loginAttempts.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 86400 }  // 24 hours
)

# TTL index with delay
db.passwordReset.createIndex(
  { requestedAt: 1 },
  { expireAfterSeconds: 3600 }  // 1 hour expiration
)

# Modify TTL duration
db.sessions.dropIndex("createdAt_1")
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 7200 }  // 2 hours
)
```

---

## Text Indexes

Text indexes enable full-text search on string fields.

### Creating Text Indexes

```bash
# Create text index on single field
db.articles.createIndex({ title: "text" })

# Create text index on multiple fields
db.articles.createIndex({
  title: "text",
  body: "text",
  tags: "text"
})

# Weighted text index
db.articles.createIndex(
  {
    title: "text",
    body: "text"
  },
  {
    weights: {
      title: 10,    // Higher weight for title
      body: 5       // Lower weight for body
    }
  }
)

# Text index with language
db.articles.createIndex(
  { content: "text" },
  { default_language: "english" }
)

# Wildcard text index (all text fields)
db.articles.createIndex({ "$**": "text" })
```

### Text Search Queries

```bash
# Basic text search
db.articles.find({ $text: { $search: "mongodb" } })

# Multiple terms (OR logic)
db.articles.find({ $text: { $search: "mongodb database" } })

# Phrase search (exact phrase)
db.articles.find({ $text: { $search: "\"mongodb database\"" } })

# Exclude terms (NOT logic)
db.articles.find({ $text: { $search: "mongodb -tutorial" } })

# Case insensitive
db.articles.find({ $text: { $search: "MongoDB" } })
```

### Text Search with Sorting

```bash
# Sort by text relevance score
db.articles.find(
  { $text: { $search: "mongodb" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })

# Limit to high relevance
db.articles.find(
  { $text: { $search: "mongodb" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
.limit(10)
```

---

## Wildcard Indexes

Wildcard indexes can index all fields or specific patterns for flexible querying.

### Creating Wildcard Indexes

```bash
# Index all fields
db.users.createIndex({ "$**": 1 })

# Index specific field pattern
db.data.createIndex({ "attributes.$**": 1 })

# Named wildcard index
db.products.createIndex(
  { "specs.$**": 1 },
  { name: "specs_wildcard" }
)

# Wildcard with field exclusion
db.data.createIndex(
  { "$**": 1 },
  { wildcardProjection: { "internal.*": 0 } }
)
```

### Wildcard Index Use Cases

```bash
# Flexible schema with varying fields
db.products.insertOne({
  _id: 1,
  name: "Laptop",
  cpu: "Intel i7",
  ram: "16GB",
  storage: "512GB SSD"
})

db.products.insertOne({
  _id: 2,
  name: "Phone",
  processor: "Snapdragon",
  memory: "6GB",
  display: "AMOLED"
})

# Wildcard index supports both
db.products.createIndex({ "$**": 1 })

# Queries benefit
db.products.find({ cpu: "Intel i7" })
db.products.find({ processor: "Snapdragon" })
db.products.find({ ram: "16GB" })
```

---

## Index Management (listIndexes, dropIndex)

Manage and monitor indexes efficiently.

### Listing Indexes

```bash
# List all indexes on collection
db.users.getIndexes()

# Example output:
# [
#   { "v" : 2, "key" : { "_id" : 1 }, "name" : "_id_" },
#   { "v" : 2, "key" : { "email" : 1 }, "name" : "email_1" },
#   { "v" : 2, "key" : { "status" : 1 }, "name" : "status_1" }
# ]

# Admin command for index info
db.adminCommand({
  listIndexes: "users"
})

# Get specific index information
db.collection.aggregate([
  { $indexStats: {} }
])
```

### Dropping Indexes

```bash
# Drop index by name
db.users.dropIndex("email_1")

# Drop index by key specification
db.users.dropIndex({ email: 1 })

# Drop all indexes except _id
db.users.dropIndexes()

# Drop compound index
db.orders.dropIndex("customerId_1_status_1_createdAt_-1")

# Check if drop successful
db.users.getIndexes()
```

### Index Information

```bash
# Get index size
db.users.stats().indexSizes

# Detailed collection stats
db.users.stats()

# Index statistics
db.users.aggregate([
  { $indexStats: {} }
])

# Monitor index usage
db.users.aggregate([
  { $indexStats: {} },
  { $project: {
      name: "$name",
      accesses: "$accesses.ops"
    }
  }
])
```

---

## Index Performance Analysis

Analyze index effectiveness and query performance.

### Using explain()

```bash
# Basic execution plan
db.users.find({ email: "john@example.com" }).explain("executionStats")

# Verbose output
db.users.find({ email: "john@example.com" }).explain("allPlansExecution")

# Check index usage
db.users.find({ email: "john@example.com" }).explain("executionStats")
// Look for: "executionStages": { "stage": "COLLSCAN" } (bad)
// Or: "executionStages": { "stage": "IXSCAN" } (good)
```

### Performance Metrics

```bash
# Examined documents vs returned
db.users.find({ email: "john@example.com" }).explain("executionStats")
// "totalDocsExamined": 1,
// "nReturned": 1
// Ratio should be 1:1 for indexed queries

# Without index (bad)
// "totalDocsExamined": 100000,
// "nReturned": 1
// Ratio is 100000:1

# Execution time
db.users.find({ status: "active" }).explain("executionStats")
// "executionStats": { "executionTimeMillis": 45 }

# Collection scan (no index)
// "executionTimeMillis": 500
```

### Query Optimization

```bash
# Before: Slow query
db.orders.find({ status: "pending", customerId: 123 }).explain("executionStats")
// COLLSCAN: "totalDocsExamined": 50000, "nReturned": 5

# Create appropriate index
db.orders.createIndex({ customerId: 1, status: 1 })

# After: Fast query
db.orders.find({ status: "pending", customerId: 123 }).explain("executionStats")
// IXSCAN: "totalDocsExamined": 5, "nReturned": 5
// Improvement: 50000x faster!
```

---

## Index Strategies and Best Practices

### Strategy 1: Identify Most Important Queries

```bash
# Analyze query patterns
// Most frequent queries on your system:
// 1. Find user by email
// 2. Find orders by customerId with date range
// 3. Find products by category

# Create indexes for these
db.users.createIndex({ email: 1 })
db.orders.createIndex({ customerId: 1, createdAt: -1 })
db.products.createIndex({ category: 1 })
```

### Strategy 2: Use ESR Rule for Compound Indexes

```bash
# Query: Find active orders by customer, sorted by date
db.orders.find({
  customerId: 123,
  status: "active"
}).sort({ createdAt: -1 })

# CORRECT: ESR order
db.orders.createIndex({
  customerId: 1,       // Equality
  status: 1,           // Equality
  createdAt: -1        // Sort
})

# WRONG: Different order
db.orders.createIndex({
  createdAt: -1,
  status: 1,
  customerId: 1
})
```

### Strategy 3: Avoid Over-indexing

```bash
# DON'T: Create too many indexes
db.users.createIndex({ email: 1 })
db.users.createIndex({ username: 1 })
db.users.createIndex({ phone: 1 })
db.users.createIndex({ status: 1 })
db.users.createIndex({ joinDate: 1 })
// Slows down writes significantly

# DO: Create indexes for important queries only
db.users.createIndex({ email: 1 })        // Login query
db.users.createIndex({ username: 1 })     // Search query
db.users.createIndex({ joinDate: -1 })    // Recent users query
```

### Strategy 4: Monitor Index Usage

```bash
# Find unused indexes
db.users.aggregate([
  { $indexStats: {} },
  { $match: { "accesses.ops": { $eq: 0 } } }
])

# Drop unused indexes
// If index hasn't been used and won't be needed, drop it

# Monitor with explain()
db.users.find({ status: "active" }).explain("executionStats")
// If COLLSCAN, create index for this query
```

### Strategy 5: Index Selection Guidelines

```bash
# Selectivity Rule: Index high-selectivity fields
// GOOD: Email (unique, high selectivity)
db.users.createIndex({ email: 1 })

// POOR: Status (low selectivity)
db.users.createIndex({ status: 1 })  // Maybe not needed

// GOOD: Combination (better selectivity)
db.users.createIndex({ status: 1, email: 1 })

# Size Rule: Index important, frequently-queried fields
// Index common query fields first
db.orders.createIndex({ customerId: 1, status: 1 })

# Sort Rule: Consider sort requirements
// If query sorts by date, include in index
db.orders.createIndex({ customerId: 1, createdAt: -1 })
```

### Strategy 6: Regular Maintenance

```bash
# Monitor index size
db.users.stats().indexSizes

# Remove duplicate indexes
db.users.getIndexes()
// If you have similar indexes, keep only most useful

# Rebuild indexes for performance
db.users.reIndex()

# Schedule index optimization
// Run during off-peak hours
// Rebuilding locks collection
```

### Common Index Mistakes to Avoid

```bash
# MISTAKE 1: Not indexing sort fields
// Slow
db.users.find({ status: "active" }).sort({ createdAt: -1 })

// Fixed
db.users.createIndex({ status: 1, createdAt: -1 })

---

# MISTAKE 2: Wrong field order in compound index
// Query: { a: 1, b: 2, c: { $gt: 3 } }

// WRONG
db.collection.createIndex({ c: 1, b: 1, a: 1 })

// CORRECT (ESR)
db.collection.createIndex({ a: 1, b: 1, c: 1 })

---

# MISTAKE 3: Creating indexes for every field
// BAD: Slows writes
db.products.createIndex({ field1: 1 })
db.products.createIndex({ field2: 1 })
db.products.createIndex({ field3: 1 })
// ... 20 more indexes

// GOOD: Create only necessary indexes
db.products.createIndex({ category: 1, price: 1 })

---

# MISTAKE 4: Ignoring TTL index limitations
// TTL indexes only work on date fields
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }
)
// Must be a date field!

---

# MISTAKE 5: Not considering sparse indexes
// Creates index entries for all documents
db.users.createIndex({ phone: 1 })

// Better for optional fields
db.users.createIndex(
  { phone: 1 },
  { sparse: true }
)
```

### Production Index Checklist

- ✅ Identify top 5-10 most important queries
- ✅ Create indexes for these queries
- ✅ Use explain() to verify index usage
- ✅ Monitor index performance regularly
- ✅ Remove unused indexes
- ✅ Plan index maintenance windows
- ✅ Document index strategy and rationale
- ✅ Test impact of index changes
- ✅ Monitor write performance
- ✅ Review and optimize quarterly

---

Proper indexing is essential for MongoDB performance. Start with the most important queries, use the ESR rule for compound indexes, and regularly monitor index effectiveness.
