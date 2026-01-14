# Aggregation Framework Basics

The MongoDB Aggregation Framework is a powerful tool for transforming and analyzing data. It processes documents through a series of stages, where each stage transforms the documents to the next stage. This guide covers the fundamentals of building efficient aggregation pipelines.

## Introduction to Aggregation Pipeline

The aggregation pipeline is a sequence of data aggregation operations. Documents pass through stages that modify and process them, with each stage receiving output from the previous stage.

### Pipeline Concept

```
Input Documents → [Stage 1] → [Stage 2] → [Stage 3] → Output Documents
```

### Basic Pipeline Structure

```bash
# Simple aggregation pipeline
db.collection.aggregate([
  { $match: { status: "active" } },      # Stage 1: Filter
  { $group: { _id: "$category", count: { $sum: 1 } } },  # Stage 2: Group
  { $sort: { count: -1 } }                # Stage 3: Sort
])
```

### Pipeline Advantages

- **Memory Efficient**: Processes data in stages, not loading entire collection
- **Optimized**: MongoDB optimizes pipeline execution
- **Flexible**: Combine multiple stages for complex transformations
- **Powerful**: Express complex aggregations without application logic

### Simple Aggregation Examples

```bash
# Count total documents
db.users.aggregate([
  { $count: "totalUsers" }
])

# Get average age
db.users.aggregate([
  { $group: { _id: null, avgAge: { $avg: "$age" } } }
])

# Sum sales by category
db.products.aggregate([
  { $group: { _id: "$category", totalSales: { $sum: "$price" } } }
])
```

---

## $match Stage

The `$match` stage filters documents to pass only those matching specified conditions. It's similar to MongoDB's find query but optimized for pipelines.

### Basic $match Usage

```bash
# Filter users by status
db.users.aggregate([
  { $match: { status: "active" } }
])

# Multiple conditions
db.users.aggregate([
  { $match: { status: "active", age: { $gte: 18 } } }
])

# OR conditions
db.users.aggregate([
  { $match: { $or: [{ status: "active" }, { status: "pending" }] } }
])
```

### $match with Comparison Operators

```bash
# Greater than / less than
db.products.aggregate([
  { $match: { price: { $gt: 100, $lt: 500 } } }
])

# Equality operators
db.orders.aggregate([
  { $match: {
    status: { $ne: "cancelled" },
    priority: { $in: ["high", "critical"] }
  } }
])

# Regex pattern matching
db.users.aggregate([
  { $match: { email: { $regex: "@company.com$" } } }
])

# Date range
db.events.aggregate([
  { $match: {
    eventDate: {
      $gte: new Date("2024-01-01"),
      $lt: new Date("2024-12-31")
    }
  } }
])
```

### $match with Array Operators

```bash
# Match array containing value
db.users.aggregate([
  { $match: { tags: "vip" } }
])

# Array size
db.posts.aggregate([
  { $match: { comments: { $size: 0 } } }
])

# All array elements match
db.students.aggregate([
  { $match: { scores: { $all: [90, 95, 100] } } }
])

# Element match
db.orders.aggregate([
  { $match: {
    items: { $elemMatch: { productId: "P001", quantity: { $gte: 5 } } }
  } }
])
```

### $match Performance Tips

```bash
// BEST PRACTICE: Place $match early in pipeline
db.users.aggregate([
  { $match: { status: "active" } },  // Filter first
  { $group: { _id: "$department", count: { $sum: 1 } } }
])

// AVOID: Filtering after expensive operations
db.users.aggregate([
  { $group: { _id: "$department", count: { $sum: 1 } } },
  { $match: { count: { $gt: 10 } } }  // Too late
])

// Use indexes on fields in $match stage
db.users.createIndex({ status: 1 })
db.users.aggregate([
  { $match: { status: "active" } }
])
```

---

## $group Stage

The `$group` stage groups documents by a specified identifier and applies accumulator operators to calculate aggregate values.

### Basic $group Syntax

```bash
db.collection.aggregate([
  {
    $group: {
      _id: "grouping_expression",
      field1: { accumulator: "field" },
      field2: { accumulator: "field" }
    }
  }
])
```

### $group Examples

```bash
# Group by single field
db.sales.aggregate([
  { $group: { _id: "$category", totalSales: { $sum: "$amount" } } }
])

# Group by multiple fields
db.orders.aggregate([
  { $group: {
    _id: { customer: "$customerId", status: "$status" },
    count: { $sum: 1 },
    totalAmount: { $sum: "$amount" }
  } }
])

# Group all documents (null _id)
db.products.aggregate([
  { $group: {
    _id: null,
    totalProducts: { $sum: 1 },
    avgPrice: { $avg: "$price" },
    maxPrice: { $max: "$price" }
  } }
])
```

### Group with Nested Fields

```bash
# Group by nested document field
db.users.aggregate([
  { $group: {
    _id: "$address.city",
    count: { $sum: 1 },
    avgAge: { $avg: "$age" }
  } }
])

# Group by array field
db.posts.aggregate([
  { $group: {
    _id: "$tags",
    count: { $sum: 1 }
  } }
])
```

### Complex Grouping

```bash
# Group and calculate multiple aggregations
db.employees.aggregate([
  { $group: {
    _id: "$department",
    count: { $sum: 1 },
    avgSalary: { $avg: "$salary" },
    minSalary: { $min: "$salary" },
    maxSalary: { $max: "$salary" },
    totalSalary: { $sum: "$salary" }
  } }
])

# Group with $cond for conditional aggregation
db.orders.aggregate([
  { $group: {
    _id: "$customerId",
    totalOrders: { $sum: 1 },
    completedOrders: {
      $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
    },
    totalSpent: { $sum: "$amount" }
  } }
])
```

---

## $project Stage

The `$project` stage reshapes documents, selecting, renaming, or adding fields.

### Basic $project Usage

```bash
# Select specific fields
db.users.aggregate([
  { $project: { name: 1, email: 1 } }
])

# Exclude fields
db.users.aggregate([
  { $project: { password: 0, internalId: 0 } }
])

// Note: _id is included by default, exclude with _id: 0
db.users.aggregate([
  { $project: { name: 1, _id: 0 } }
])
```

### Field Renaming

```bash
# Rename fields
db.users.aggregate([
  { $project: {
    fullName: "$name",
    emailAddress: "$email",
    userAge: "$age"
  } }
])

# Rename nested fields
db.orders.aggregate([
  { $project: {
    orderId: "$_id",
    buyerId: "$customerId",
    purchaseAmount: "$amount"
  } }
])
```

### Adding Calculated Fields

```bash
# Add calculated field
db.products.aggregate([
  { $project: {
    name: 1,
    price: 1,
    discountedPrice: { $multiply: ["$price", 0.9] }
  } }
])

# Multiple calculations
db.orders.aggregate([
  { $project: {
    customerId: 1,
    itemCount: { $size: "$items" },
    subtotal: { $sum: "$items.price" },
    tax: { $multiply: [{ $sum: "$items.price" }, 0.08] }
  } }
])

# Conditional fields
db.users.aggregate([
  { $project: {
    name: 1,
    age: 1,
    isAdult: { $gte: ["$age", 18] },
    ageCategory: {
      $cond: [
        { $lt: ["$age", 18] },
        "Minor",
        { $cond: [{ $lt: ["$age", 65] }, "Adult", "Senior"] }
      ]
    }
  } }
])
```

### Nested Objects in $project

```bash
# Create nested structure
db.users.aggregate([
  { $project: {
    _id: 0,
    personalInfo: {
      name: "$name",
      age: "$age",
      email: "$email"
    },
    contactInfo: {
      phone: "$phone",
      address: "$address"
    }
  } }
])

# Preserve existing nested structure
db.users.aggregate([
  { $project: {
    name: 1,
    "address.city": 1,
    "address.country": 1
  } }
])
```

### Array Operations in $project

```bash
# Transform array
db.users.aggregate([
  { $project: {
    name: 1,
    hobbies: 1,
    hobbyCount: { $size: "$hobbies" },
    firstHobby: { $arrayElemAt: ["$hobbies", 0] }
  } }
])

# Concatenate strings
db.users.aggregate([
  { $project: {
    fullName: { $concat: ["$firstName", " ", "$lastName"] }
  } }
])
```

---

## $sort Stage

The `$sort` stage orders documents by specified fields.

### Basic $sort Usage

```bash
# Sort ascending (1) or descending (-1)
db.users.aggregate([
  { $match: { status: "active" } },
  { $sort: { createdAt: -1 } }
])

# Sort by multiple fields
db.products.aggregate([
  { $sort: {
    category: 1,    // Ascending
    price: -1       // Descending within category
  } }
])
```

### $sort with Different Data Types

```bash
# Sort numbers
db.products.aggregate([
  { $sort: { price: -1 } }
])

# Sort strings
db.users.aggregate([
  { $sort: { lastName: 1, firstName: 1 } }
])

# Sort dates
db.events.aggregate([
  { $sort: { eventDate: 1 } }
])

# Sort by text score (with text search)
db.posts.aggregate([
  { $match: { $text: { $search: "mongodb" } } },
  { $sort: { score: { $meta: "textScore" } } }
])
```

### $sort Performance Tips

```bash
// BEST PRACTICE: Sort before $limit to use index
db.users.aggregate([
  { $match: { status: "active" } },
  { $sort: { createdAt: -1 } },
  { $limit: 10 }
])

// Create index for sort fields
db.users.createIndex({ status: 1, createdAt: -1 })

// Avoid sorting large result sets
db.users.aggregate([
  { $group: { _id: "$department", count: { $sum: 1 } } },
  { $sort: { count: -1 } }  // Smaller dataset after grouping
])

// Use $limit before $sort if possible to reduce data
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $limit: 1000 },
  { $sort: { amount: -1 } }
])
```

---

## $limit and $skip Stages

The `$limit` and `$skip` stages implement pagination and result limiting.

### Basic $limit Usage

```bash
# Get first 10 documents
db.users.aggregate([
  { $match: { status: "active" } },
  { $sort: { createdAt: -1 } },
  { $limit: 10 }
])

# Limit grouped results
db.sales.aggregate([
  { $group: { _id: "$category", totalSales: { $sum: "$amount" } } },
  { $limit: 5 }
])
```

### Basic $skip Usage

```bash
# Skip first 20 documents
db.users.aggregate([
  { $match: { status: "active" } },
  { $skip: 20 }
])

# Skip and limit (pagination)
db.products.aggregate([
  { $skip: 0 },   // Page 1: skip 0, limit 10
  { $limit: 10 }
])
```

### Pagination Pattern

```bash
// Page 1 (items 1-10)
db.products.aggregate([
  { $sort: { name: 1 } },
  { $skip: 0 },
  { $limit: 10 }
])

// Page 2 (items 11-20)
db.products.aggregate([
  { $sort: { name: 1 } },
  { $skip: 10 },
  { $limit: 10 }
])

// Page 3 (items 21-30)
db.products.aggregate([
  { $sort: { name: 1 } },
  { $skip: 20 },
  { $limit: 10 }
])

// Dynamic pagination calculation
const pageNumber = 2;
const pageSize = 10;
const skipCount = (pageNumber - 1) * pageSize;

db.products.aggregate([
  { $sort: { name: 1 } },
  { $skip: skipCount },
  { $limit: pageSize }
])
```

### Performance Considerations

```bash
// BEST PRACTICE: Sort before limit/skip
db.users.aggregate([
  { $match: { status: "active" } },
  { $sort: { createdAt: -1 } },
  { $skip: 20 },
  { $limit: 10 }
])

// Avoid large skips (performance degrades)
db.users.aggregate([
  { $skip: 1000000 },  // Very slow
  { $limit: 10 }
])

// Better: Use range query instead of skip
db.users.aggregate([
  { $match: {
    _id: { $gt: lastSeenId },
    status: "active"
  } },
  { $sort: { _id: 1 } },
  { $limit: 10 }
])
```

---

## $count Stage

The `$count` stage counts the total number of documents in the pipeline.

### Basic $count Usage

```bash
# Count all active users
db.users.aggregate([
  { $match: { status: "active" } },
  { $count: "totalActiveUsers" }
])

# Count documents after grouping
db.orders.aggregate([
  { $group: { _id: "$customerId" } },
  { $count: "uniqueCustomers" }
])
```

### $count vs $group Count

```bash
// Using $count (simpler)
db.users.aggregate([
  { $match: { status: "active" } },
  { $count: "total" }
])

// Using $group (more complex but more flexible)
db.users.aggregate([
  { $match: { status: "active" } },
  { $group: { _id: null, total: { $sum: 1 } } }
])

// $group allows multiple aggregations
db.users.aggregate([
  { $group: {
    _id: null,
    total: { $sum: 1 },
    avgAge: { $avg: "$age" },
    maxAge: { $max: "$age" }
  } }
])
```

### Count by Multiple Groups

```bash
// Count per category
db.products.aggregate([
  { $group: {
    _id: "$category",
    count: { $sum: 1 }
  } }
])

// Top 5 most used tags
db.posts.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
])
```

---

## Accumulator Operators

Accumulator operators are used in `$group` and `$project` stages to compute aggregate values.

### $sum Accumulator

```bash
# Sum numeric field
db.sales.aggregate([
  { $group: {
    _id: "$category",
    totalSales: { $sum: "$amount" }
  } }
])

# Sum with expression
db.orders.aggregate([
  { $group: {
    _id: "$customerId",
    totalSpent: { $sum: "$amount" },
    orderCount: { $sum: 1 }
  } }
])

# Conditional sum
db.orders.aggregate([
  { $group: {
    _id: "$status",
    totalAmount: { $sum: "$amount" },
    completedAmount: {
      $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] }
    }
  } }
])
```

### $avg Accumulator

```bash
# Calculate average
db.products.aggregate([
  { $group: {
    _id: "$category",
    avgPrice: { $avg: "$price" }
  } }
])

# Average with filter
db.students.aggregate([
  { $group: {
    _id: "$class",
    avgScore: { $avg: "$score" }
  } }
])
```

### $min and $max Accumulators

```bash
# Find minimum and maximum values
db.products.aggregate([
  { $group: {
    _id: "$category",
    minPrice: { $min: "$price" },
    maxPrice: { $max: "$price" },
    priceRange: {
      $subtract: [{ $max: "$price" }, { $min: "$price" }]
    }
  } }
])

# Min/Max with complex expressions
db.orders.aggregate([
  { $group: {
    _id: "$customerId",
    largestOrder: { $max: "$amount" },
    smallestOrder: { $min: "$amount" }
  } }
])
```

### $first and $last Accumulators

```bash
// $first - first document in group
db.sales.aggregate([
  { $sort: { saleDate: 1 } },
  { $group: {
    _id: "$salesperson",
    firstSale: { $first: "$amount" },
    firstDate: { $first: "$saleDate" }
  } }
])

// $last - last document in group
db.sales.aggregate([
  { $sort: { saleDate: 1 } },
  { $group: {
    _id: "$salesperson",
    lastSale: { $last: "$amount" },
    lastDate: { $last: "$saleDate" }
  } }
])

// Together for range
db.temperatures.aggregate([
  { $sort: { recordDate: 1 } },
  { $group: {
    _id: "$city",
    lowestTemp: { $first: "$temperature" },
    highestTemp: { $last: "$temperature" }
  } }
])
```

### More Accumulator Operators

```bash
# $push - collect all values in array
db.posts.aggregate([
  { $group: {
    _id: "$author",
    postIds: { $push: "$_id" },
    postTitles: { $push: "$title" }
  } }
])

# $addToSet - unique values
db.orders.aggregate([
  { $group: {
    _id: "$customerId",
    uniqueProducts: { $addToSet: "$productId" }
  } }
])

# $stdDevPop - standard deviation
db.students.aggregate([
  { $group: {
    _id: "$class",
    scoreStdDev: { $stdDevPop: "$score" }
  } }
])
```

---

## $unwind Stage

The `$unwind` stage deconstructs arrays into individual documents.

### Basic $unwind Usage

```bash
// Document before unwind:
// { _id: 1, tags: ["mongodb", "database", "nosql"] }

db.posts.aggregate([
  { $unwind: "$tags" }
])

// Output after unwind:
// { _id: 1, tags: "mongodb" }
// { _id: 1, tags: "database" }
// { _id: 1, tags: "nosql" }
```

### $unwind Examples

```bash
# Unwind and count tags
db.posts.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

# Unwind with filtering
db.orders.aggregate([
  { $unwind: "$items" },
  { $match: { "items.quantity": { $gte: 5 } } },
  { $group: {
    _id: "$items.productId",
    totalQuantity: { $sum: "$items.quantity" }
  } }
])
```

### $unwind Advanced Options

```bash
# includeArrayIndex - preserve array index
db.posts.aggregate([
  { $unwind: {
    path: "$tags",
    includeArrayIndex: "tagIndex"
  } }
])

// Output:
// { _id: 1, tags: "mongodb", tagIndex: 0 }
// { _id: 1, tags: "database", tagIndex: 1 }

# preserveNullAndEmptyArrays - keep documents with empty arrays
db.posts.aggregate([
  { $unwind: {
    path: "$tags",
    preserveNullAndEmptyArrays: true
  } }
])

// Even documents with empty tags are kept
```

### Complex $unwind Patterns

```bash
# Multiple unwinds
db.users.aggregate([
  { $unwind: "$hobbies" },
  { $unwind: "$languages" },
  { $group: {
    _id: { hobby: "$hobbies", language: "$languages" },
    count: { $sum: 1 }
  } }
])

# Unwind before grouping
db.orders.aggregate([
  { $unwind: "$items" },
  { $group: {
    _id: "$items.category",
    totalQuantity: { $sum: "$items.quantity" },
    totalRevenue: { $sum: "$items.price" }
  } }
])
```

---

## $lookup Stage (Basic Joins)

The `$lookup` stage joins documents from two collections (similar to SQL JOIN).

### Basic $lookup Syntax

```bash
db.collection.aggregate([
  {
    $lookup: {
      from: "otherCollection",
      localField: "foreignKeyField",
      foreignField: "_id",
      as: "joinedDocuments"
    }
  }
])
```

### Simple $lookup Example

```bash
# Join orders with customers
db.orders.aggregate([
  { $lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customer"
  } }
])

// Output:
// { _id: 1, customerId: 101, amount: 500, customer: [{...}] }
```

### $lookup with Multiple Matches

```bash
# Join products with reviews
db.products.aggregate([
  { $lookup: {
    from: "reviews",
    localField: "_id",
    foreignField: "productId",
    as: "allReviews"
  } }
])

// Each product document now has array of matching reviews
```

### $lookup with Filtering

```bash
# Join and filter results
db.orders.aggregate([
  { $lookup: {
    from: "items",
    localField: "_id",
    foreignField: "orderId",
    as: "items"
  } },
  { $unwind: "$items" },
  { $match: { "items.quantity": { $gte: 5 } } }
])
```

### $lookup with Aggregation Pipeline

```bash
# Advanced join with nested aggregation
db.orders.aggregate([
  { $lookup: {
    from: "customers",
    let: { customerId: "$customerId" },
    pipeline: [
      { $match: { $expr: { $eq: ["$_id", "$$customerId"] } } },
      { $project: { name: 1, email: 1 } }
    ],
    as: "customerInfo"
  } }
])
```

### Multiple $lookup Stages

```bash
# Join with multiple collections
db.orders.aggregate([
  { $lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customer"
  } },
  { $lookup: {
    from: "products",
    localField: "productId",
    foreignField: "_id",
    as: "product"
  } },
  { $unwind: "$customer" },
  { $unwind: "$product" }
])
```

### $lookup Performance Tips

```bash
// BEST PRACTICE: $match before $lookup
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customer"
  } }
])

// Index the join fields
db.orders.createIndex({ customerId: 1 })
db.customers.createIndex({ _id: 1 })

// Avoid large lookups
// If joining collection is very large, consider denormalization
```

---

## Complete Pipeline Examples

### Example 1: Sales Analysis

```bash
db.sales.aggregate([
  { $match: { status: "completed" } },
  { $group: {
    _id: "$salesperson",
    totalSales: { $sum: "$amount" },
    avgSale: { $avg: "$amount" },
    saleCount: { $sum: 1 }
  } },
  { $sort: { totalSales: -1 } },
  { $limit: 10 },
  { $project: {
    _id: 1,
    totalSales: 1,
    avgSale: { $round: ["$avgSale", 2] },
    saleCount: 1
  } }
])
```

### Example 2: User Activity Report

```bash
db.users.aggregate([
  { $match: { createdAt: { $gte: new Date("2024-01-01") } } },
  { $lookup: {
    from: "orders",
    localField: "_id",
    foreignField: "userId",
    as: "userOrders"
  } },
  { $project: {
    name: 1,
    email: 1,
    orderCount: { $size: "$userOrders" },
    totalSpent: { $sum: "$userOrders.amount" }
  } },
  { $match: { orderCount: { $gt: 0 } } },
  { $sort: { totalSpent: -1 } }
])
```

### Example 3: Product Recommendations

```bash
db.purchases.aggregate([
  { $match: { customerId: 123 } },
  { $unwind: "$items" },
  { $group: {
    _id: "$items.category",
    purchaseCount: { $sum: 1 },
    totalSpent: { $sum: "$items.price" }
  } },
  { $sort: { purchaseCount: -1 } },
  { $limit: 5 },
  { $lookup: {
    from: "products",
    localField: "_id",
    foreignField: "category",
    as: "recommendedProducts"
  } },
  { $project: {
    category: "$_id",
    recommendations: { $slice: ["$recommendedProducts", 5] }
  } }
])
```

---

Mastering the aggregation framework enables powerful data analysis, transformations, and reporting capabilities directly within MongoDB.
