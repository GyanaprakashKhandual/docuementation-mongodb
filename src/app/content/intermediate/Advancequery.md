# Advanced Querying

Advanced querying techniques in MongoDB provide powerful ways to filter, match, and retrieve documents with complex conditions. This guide covers sophisticated query operators for handling arrays, nested documents, and complex logic.

## $in and $nin Operators

The `$in` and `$nin` operators allow matching documents where field values are in or not in a specified array.

### $in Operator

The `$in` operator matches documents where the field value is in the provided array.

```bash
# Find users with specific roles
db.users.find({ role: { $in: ["admin", "moderator", "editor"] } })

# Find products with specific IDs
db.products.find({ _id: { $in: [1, 2, 3, 4, 5] } })

# Find orders with specific statuses
db.orders.find({
  status: { $in: ["pending", "processing", "shipped"] }
})

# Using $in with multiple fields
db.users.find({
  status: { $in: ["active", "pending"] },
  country: { $in: ["US", "CA", "UK"] }
})

# Find documents with multiple field matches
db.employees.find({
  department: { $in: ["Sales", "Marketing", "HR"] },
  salary: { $gt: 50000 }
})
```

### $nin Operator

The `$nin` operator matches documents where the field value is NOT in the provided array.

```bash
# Find users excluding specific roles
db.users.find({ role: { $nin: ["guest", "banned"] } })

# Find products excluding specific categories
db.products.find({
  category: { $nin: ["discontinued", "archived"] }
})

# Exclude multiple statuses
db.orders.find({
  status: { $nin: ["cancelled", "failed", "rejected"] }
})

# Combine with other conditions
db.posts.find({
  author: { $nin: ["bot", "system"] },
  published: true,
  views: { $gt: 100 }
})

# Find documents not in list and meet other criteria
db.customers.find({
  country: { $nin: ["Unknown", "Not Specified"] },
  accountStatus: { $ne: null }
})
```

### Combining $in and $nin

```bash
# Find products that are in specific categories but not specific colors
db.products.find({
  category: { $in: ["Electronics", "Accessories"] },
  color: { $nin: ["Black", "White"] }
})

# Complex multi-field query
db.employees.find({
  department: { $in: ["Engineering", "Product"] },
  level: { $nin: ["Intern", "Junior"] },
  salary: { $gte: 80000 }
})

# Case-insensitive $in with regex
db.users.find({
  email: {
    $in: [
      /^admin@/i,
      /^support@/i,
      /^operations@/i
    ]
  }
})
```

### Performance Considerations

```bash
# Index for $in queries improves performance
db.users.createIndex({ role: 1 })
db.users.find({ role: { $in: ["admin", "moderator"] } })

# Compound index for multiple fields
db.products.createIndex({ category: 1, price: 1 })
db.products.find({
  category: { $in: ["Electronics", "Accessories"] },
  price: { $lt: 1000 }
})

# Limit array size in $in for performance
// Better - smaller array
db.users.find({ status: { $in: ["active", "pending"] } })

// Less efficient - large array
db.users.find({
  status: { $in: [...Array of 1000 values] }
})
```

---

## $all Operator for Arrays

The `$all` operator matches documents where the array field contains ALL specified elements.

### Basic $all Usage

```bash
# Find users with ALL specified skills
db.users.find({
  skills: { $all: ["JavaScript", "Python", "MongoDB"] }
})

# Find documents with all tags
db.posts.find({
  tags: { $all: ["tutorial", "advanced", "mongodb"] }
})

# Find products with all features
db.products.find({
  features: { $all: ["wireless", "waterproof", "rechargeable"] }
})
```

### $all with Different Data Types

```bash
# $all with strings
db.courses.find({
  topics: { $all: ["databases", "optimization", "performance"] }
})

# $all with numbers
db.analytics.find({
  metrics: { $all: [100, 200, 300] }
})

# $all with mixed types
db.data.find({
  values: { $all: ["active", 5, true] }
})
```

### Order Independence

```bash
// Both queries match the same documents
// Order of elements in query doesn't matter

db.users.find({
  skills: { $all: ["JavaScript", "Python", "MongoDB"] }
})

db.users.find({
  skills: { $all: ["MongoDB", "Python", "JavaScript"] }
})

// Both match documents with array containing all three values
// regardless of order in the array
```

### $all with Conditions

```bash
# $all with comparison operators
db.students.find({
  scores: { $all: [{ $gte: 80 }, { $lt: 100 }] }
})

# Find users with ALL roles from list and other conditions
db.users.find({
  roles: { $all: ["user", "verified"] },
  accountStatus: "active",
  joinDate: { $gte: new Date("2024-01-01") }
})

# Combining $all and $in
db.inventory.find({
  tags: { $all: ["new", "sale"] },
  category: { $in: ["Electronics", "Clothing"] }
})
```

### $all vs $in vs Other Array Operators

```bash
# $all - contains ALL values
db.items.find({ colors: { $all: ["red", "blue"] } })
// Matches: ["red", "blue", "green"]
// Matches: ["blue", "red"]
// Does NOT match: ["red", "green"]

# $in - contains ANY of the values
db.items.find({ colors: { $in: ["red", "blue"] } })
// Matches: ["red", "blue", "green"]
// Matches: ["red"]
// Matches: ["blue", "yellow"]

# Both $all and $in
db.items.find({
  colors: { $all: ["red"] },
  size: { $in: ["S", "M", "L"] }
})
```

---

## $elemMatch Operator

The `$elemMatch` operator matches documents where an array element satisfies multiple conditions.

### Basic $elemMatch Usage

```bash
# Match documents where an array element meets multiple conditions
db.students.find({
  scores: { $elemMatch: { $gte: 80, $lt: 90 } }
})

# Find orders with items matching criteria
db.orders.find({
  items: { $elemMatch: { productId: "P001", quantity: { $gte: 5 } } }
})

# Find courses with assignments meeting criteria
db.courses.find({
  assignments: { $elemMatch: { name: "Final Exam", score: { $gte: 90 } } }
})
```

### Nested Object Matching

```bash
# Match documents in array of objects
db.posts.find({
  comments: {
    $elemMatch: {
      author: "John",
      score: { $gt: 10 }
    }
  }
})

# Complex nested conditions
db.events.find({
  registrations: {
    $elemMatch: {
      status: "confirmed",
      checkInTime: { $exists: true },
      ticketType: "VIP"
    }
  }
})

# Multiple conditions on array elements
db.inventory.find({
  warehouse: {
    $elemMatch: {
      location: "New York",
      quantity: { $gt: 100 },
      lastRestock: { $gte: new Date("2024-01-01") }
    }
  }
})
```

### $elemMatch vs Without $elemMatch

```bash
// WITHOUT $elemMatch - matches if ANY element meets ANY condition
db.orders.find({
  items: { productId: "P001", quantity: { $gte: 5 } }
})
// Matches: { items: [{ productId: "P001" }, { quantity: 10 }] }
// Both conditions met but on different array elements

// WITH $elemMatch - matches if SINGLE element meets ALL conditions
db.orders.find({
  items: { $elemMatch: { productId: "P001", quantity: { $gte: 5 } } }
})
// Does NOT match: { items: [{ productId: "P001" }, { quantity: 10 }] }
// DOES match: { items: [{ productId: "P001", quantity: 10 }] }
// Single element satisfies both conditions
```

### $elemMatch with Projection

```bash
# Match and return only matching array elements
db.orders.find(
  { items: { $elemMatch: { quantity: { $gte: 5 } } } },
  { items: { $elemMatch: { quantity: { $gte: 5 } } } }
)

# Find orders and return only items with quantity > 5
db.orders.find(
  { items: { $elemMatch: { price: { $gt: 100 } } } },
  { "items.$": 1 }
)
```

---

## $size Operator

The `$size` operator matches documents where the array field has exactly the specified number of elements.

### Basic $size Usage

```bash
# Find users with exactly 3 hobbies
db.users.find({ hobbies: { $size: 3 } })

# Find products with specific number of reviews
db.products.find({ reviews: { $size: 5 } })

# Find documents with empty arrays
db.data.find({ tags: { $size: 0 } })

# Find documents with 10 or more items
// Note: $size only matches exact count, use $expr for ranges
db.orders.find({
  $expr: { $eq: [{ $size: "$items" }, 10] }
})
```

### $size Limitations and Solutions

```bash
# $size only matches exact number
db.users.find({ hobbies: { $size: 3 } })

// To find arrays with size > 3, use $expr with $size
db.users.find({
  $expr: { $gt: [{ $size: "$hobbies" }, 3] }
})

// Find arrays with size between 2 and 5
db.users.find({
  $expr: {
    $and: [
      { $gte: [{ $size: "$hobbies" }, 2] },
      { $lte: [{ $size: "$hobbies" }, 5] }
    ]
  }
})

// Find non-empty arrays
db.users.find({
  $expr: { $gt: [{ $size: "$hobbies" }, 0] }
})
```

### Performance Considerations

```bash
# Index doesn't improve $size queries
// $size queries are slower and require collection scan
db.users.createIndex({ hobbies: 1 })

// Denormalize array count if frequently queried by size
db.users.updateMany(
  {},
  [{ $set: { hobbiesCount: { $size: "$hobbies" } } }]
)

// Now index and query the count field instead
db.users.createIndex({ hobbiesCount: 1 })
db.users.find({ hobbiesCount: 3 })
```

---

## Querying Nested Documents (Dot Notation)

Dot notation allows querying fields within nested documents using string paths.

### Basic Dot Notation

```bash
# Query top-level nested field
db.users.find({ "address.city": "New York" })

# Multiple nested field conditions
db.users.find({
  "address.city": "New York",
  "address.country": "USA"
})

# Query deeply nested fields
db.companies.find({ "ceo.contact.email": "jane@company.com" })
```

### Dot Notation with Arrays

```bash
# Query array of objects using dot notation
db.orders.find({ "items.productId": "P001" })

# Multiple conditions on array objects
db.orders.find({
  "items.productId": "P001",
  "items.quantity": { $gte: 5 }
})

// WARNING: This matches if ANY item satisfies ANY condition
// Use $elemMatch for multiple conditions on same element
db.orders.find({
  items: {
    $elemMatch: {
      productId: "P001",
      quantity: { $gte: 5 }
    }
  }
})
```

### Dot Notation with Comparison Operators

```bash
# Range query on nested field
db.employees.find({
  "salary.annual": { $gte: 50000, $lte: 100000 }
})

# Query nested boolean
db.users.find({ "settings.notifications.email": true })

# Query nested date
db.users.find({
  "profile.birthDate": { $gte: new Date("1990-01-01") }
})
```

### Advanced Nested Queries

```bash
# Query multiple nested documents
db.users.find({
  $and: [
    { "address.city": "New York" },
    { "contact.email": { $regex: "@company.com$" } },
    { "profile.verified": true }
  ]
})

# OR condition on nested fields
db.users.find({
  $or: [
    { "address.city": "New York" },
    { "address.city": "Los Angeles" }
  ]
})

# Nested field existence check
db.users.find({
  "settings.theme": { $exists: true },
  "settings.language": { $exists: false }
})
```

### Updating with Dot Notation

```bash
# Update nested field
db.users.updateOne(
  { _id: 1 },
  { $set: { "address.city": "Boston" } }
)

# Update nested array element by index
db.orders.updateOne(
  { _id: 1 },
  { $set: { "items.0.quantity": 5 } }
)

# Update nested array element by condition
db.orders.updateOne(
  { _id: 1, "items.productId": "P001" },
  { $set: { "items.$.quantity": 10 } }
)
```

---

## $where Operator

The `$where` operator allows executing JavaScript expressions for complex logic.

### Basic $where Usage

```bash
# Execute JavaScript function
db.users.find({
  $where: "this.age > 25"
})

# Complex JavaScript logic
db.products.find({
  $where: "this.price * this.quantity > 1000"
})

# String functions in JavaScript
db.users.find({
  $where: "this.name.length > 10"
})
```

### $where with Complex Logic

```bash
# Multiple conditions with JavaScript
db.orders.find({
  $where: "this.totalAmount > 100 && this.status === 'pending'"
})

# Function definitions
db.users.find({
  $where: function() {
    return this.salary > 50000 && this.department === 'Engineering';
  }
})

# Array operations in JavaScript
db.users.find({
  $where: "this.hobbies.length > 2"
})

# Date calculations
db.events.find({
  $where: "new Date() - this.createdAt < 7 * 24 * 60 * 60 * 1000"
})
```

### Performance Considerations

```bash
// WARNING: $where is slow and cannot use indexes
// Only use when query operators are insufficient

// AVOID: Slow $where query
db.users.find({
  $where: "this.age > 25"
})

// PREFER: Use standard operators
db.users.find({ age: { $gt: 25 } })

// AVOID: Complex JavaScript
db.products.find({
  $where: "this.price * this.quantity > 1000"
})

// PREFER: Use $expr for aggregation
db.products.find({
  $expr: { $gt: [{ $multiply: ["$price", "$quantity"] }, 1000] }
})
```

---

## $expr Operator

The `$expr` operator allows using aggregation expressions in queries.

### Basic $expr Usage

```bash
# Compare two fields
db.products.find({
  $expr: { $gt: ["$price", "$cost"] }
})

# Mathematical operations
db.products.find({
  $expr: { $gt: [{ $multiply: ["$price", "$quantity"] }, 5000] }
})

# String operations
db.users.find({
  $expr: { $eq: [{ $toLower: "$email" }, "john@example.com"] }
})
```

### $expr with Aggregation Operators

```bash
# Use $size operator in query
db.users.find({
  $expr: { $gt: [{ $size: "$hobbies" }, 3] }
})

# String manipulation
db.users.find({
  $expr: { $regexMatch: { input: "$email", regex: "@company.com" } }
})

# Date operations
db.events.find({
  $expr: {
    $lt: [
      { $daysInMonth: "$eventDate" },
      31
    ]
  }
})

# Array operations
db.orders.find({
  $expr: { $gte: [{ $sum: "$items.price" }, 1000] }
})
```

### Complex $expr Conditions

```bash
# Multiple conditions
db.employees.find({
  $expr: {
    $and: [
      { $gt: ["$salary", 50000] },
      { $eq: ["$department", "Engineering"] },
      { $gte: [{ $size: "$projects" }, 3] }
    ]
  }
})

# OR conditions
db.products.find({
  $expr: {
    $or: [
      { $lt: ["$stock", 10] },
      { $gt: ["$price", 1000] }
    ]
  }
})

# Conditional logic
db.orders.find({
  $expr: {
    $cond: [
      { $eq: ["$status", "premium"] },
      { $lt: ["$discount", 50] },
      { $lt: ["$discount", 20] }
    ]
  }
})
```

### $expr vs $where

```bash
// PREFER $expr: Uses indexes, faster
db.products.find({
  $expr: { $gt: [{ $multiply: ["$price", "$quantity"] }, 1000] }
})

// AVOID $where: Cannot use indexes, slower
db.products.find({
  $where: "this.price * this.quantity > 1000"
})
```

---

## $jsonSchema Operator

The `$jsonSchema` operator validates documents against a JSON Schema.

### Basic $jsonSchema Usage

```bash
# Find documents matching schema
db.users.find({
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "email"],
    properties: {
      name: { bsonType: "string" },
      email: { bsonType: "string" },
      age: { bsonType: "int" }
    }
  }
})
```

### Complex Schema Validation

```bash
# Validate with constraints
db.users.find({
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "email"],
    properties: {
      name: {
        bsonType: "string",
        minLength: 2,
        maxLength: 100
      },
      email: {
        bsonType: "string",
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      },
      age: {
        bsonType: "int",
        minimum: 0,
        maximum: 150
      }
    }
  }
})
```

### Array Validation

```bash
# Validate array elements
db.products.find({
  $jsonSchema: {
    bsonType: "object",
    properties: {
      tags: {
        bsonType: "array",
        items: { bsonType: "string" },
        minItems: 1,
        maxItems: 10
      },
      reviews: {
        bsonType: "array",
        items: {
          bsonType: "object",
          properties: {
            score: { bsonType: "int", minimum: 1, maximum: 5 },
            comment: { bsonType: "string" }
          }
        }
      }
    }
  }
})
```

### Schema with Enums

```bash
# Validate with enum values
db.orders.find({
  $jsonSchema: {
    bsonType: "object",
    properties: {
      status: {
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"]
      },
      priority: {
        enum: ["low", "medium", "high", "urgent"]
      }
    }
  }
})
```

### Collection Validation

```bash
# Define validation schema for collection
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        age: { bsonType: "int" }
      }
    }
  }
})

# Query against validated collection
db.users.find({
  age: { $gte: 18 }
})
```

---

## Query Comparison Examples

```bash
# Different approaches to similar queries

# Approach 1: Using $in for OR logic
db.users.find({
  status: { $in: ["active", "pending"] }
})

# Approach 2: Using $or
db.users.find({
  $or: [
    { status: "active" },
    { status: "pending" }
  ]
})

# $in is preferred for single field with multiple values

---

# Array Matching Comparison

# Approach 1: Using $all for exact match
db.users.find({
  skills: { $all: ["JavaScript", "Python", "MongoDB"] }
})

# Approach 2: Using $elemMatch (not ideal here)
db.users.find({
  skills: {
    $elemMatch: {
      $in: ["JavaScript", "Python", "MongoDB"]
    }
  }
})

# $all is cleaner for checking array contains all values

---

# Complex Condition Comparison

# Approach 1: Using $expr
db.products.find({
  $expr: { $gt: [{ $multiply: ["$price", "$quantity"] }, 1000] }
})

# Approach 2: Using $where (NOT RECOMMENDED)
db.products.find({
  $where: "this.price * this.quantity > 1000"
})

# $expr is preferred: faster, cleaner, uses indexes
```

---

Mastering these advanced querying techniques allows you to write complex, efficient queries for sophisticated data retrieval scenarios in MongoDB.