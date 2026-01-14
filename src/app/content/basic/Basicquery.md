# Basic Querying

Querying is the foundation of working with MongoDB data. This guide covers the essential query techniques for retrieving and filtering documents from your collections.

## Equality Queries

Equality queries find documents where a field matches a specific value exactly.

### Basic Equality Queries

```bash
# Simple equality - find users with exact name
db.users.find({ name: "John Doe" })

# Equality with different data types
db.products.find({ productId: 12345 })
db.products.find({ inStock: true })
db.users.find({ joinDate: new Date("2024-01-15") })
```

### Multiple Field Equality (AND Logic)

```bash
# Find documents matching multiple fields
db.users.find({
  name: "John Doe",
  city: "New York"
})

# Three conditions
db.orders.find({
  status: "pending",
  priority: "high",
  customer: "Alice"
})

# Equality with nested fields
db.users.find({
  "address.city": "Boston",
  "address.state": "MA"
})
```

### Explicit Equality with $eq Operator

```bash
# Using $eq operator (equivalent to direct assignment)
db.users.find({ name: { $eq: "John Doe" } })

# Useful when combining with other operators
db.products.find({
  price: { $eq: 99.99 },
  inStock: { $eq: true }
})

# $eq with null values
db.users.find({ phone: { $eq: null } })
```

### Case-Sensitive Equality

```bash
# Exact case match (default)
db.users.find({ city: "New York" })  // Matches "New York"
db.users.find({ city: "new york" })  // Does NOT match

# For case-insensitive equality, use regex
db.users.find({
  city: { $regex: "^new york$", $options: "i" }
})
```

### Equality with Arrays

```bash
# Find documents where array contains exact value
db.users.find({ hobbies: "reading" })

# Find document where entire array equals
db.users.find({
  hobbies: ["reading", "gaming", "cooking"]
})

# Find by array element
db.orders.find({ "items.productId": "P001" })
```

### Performance Tips for Equality

```bash
# Create index on frequently queried fields
db.users.createIndex({ email: 1 })
db.users.find({ email: "john@example.com" })

# Compound index for multiple fields
db.orders.createIndex({ status: 1, customer: 1 })
db.orders.find({ status: "pending", customer: "Alice" })
```

---

## Range Queries

Range queries find documents where field values fall within specified ranges.

### Greater Than ($gt) and Greater Than or Equal ($gte)

```bash
# Find users older than 25
db.users.find({ age: { $gt: 25 } })

# Find products with price greater than or equal to $100
db.products.find({ price: { $gte: 100 } })

# Find orders created after a specific date
db.orders.find({
  createdAt: { $gt: new Date("2024-01-01") }
})

# Find multiple conditions
db.products.find({
  price: { $gte: 50 },
  quantity: { $gt: 0 }
})
```

### Less Than ($lt) and Less Than or Equal ($lte)

```bash
# Find users younger than 30
db.users.find({ age: { $lt: 30 } })

# Find products cheaper than $50
db.products.find({ price: { $lte: 50 } })

# Find archived documents
db.documents.find({
  archivedDate: { $lt: new Date("2023-01-01") }
})
```

### Range Between Values

```bash
# Find users between age 25 and 35
db.users.find({
  age: { $gte: 25, $lte: 35 }
})

# Find products in price range $50-$200
db.products.find({
  price: { $gt: 50, $lt: 200 }
})

# Find documents created in January 2024
db.orders.find({
  createdAt: {
    $gte: new Date("2024-01-01"),
    $lt: new Date("2024-02-01")
  }
})

# Complex range with multiple fields
db.analytics.find({
  pageViews: { $gte: 1000, $lte: 10000 },
  bounceRate: { $gt: 0.3, $lt: 0.7 }
})
```

### Range with Not Equal

```bash
# Find products with price not between $50-$100
db.products.find({
  $or: [
    { price: { $lt: 50 } },
    { price: { $gt: 100 } }
  ]
})

// Or using $not
db.products.find({
  price: {
    $not: { $gte: 50, $lte: 100 }
  }
})
```

### Date Range Queries

```bash
# Find events this month
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

db.events.find({
  eventDate: {
    $gte: startOfMonth,
    $lte: endOfMonth
  }
})

# Find recent activity (last 7 days)
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
db.activities.find({
  timestamp: { $gte: sevenDaysAgo }
})

# Find documents within quarter
db.reports.find({
  reportDate: {
    $gte: new Date("2024-01-01"),
    $lt: new Date("2024-04-01")
  }
})
```

### Range Query Performance

```bash
# Create index for range queries
db.products.createIndex({ price: 1 })
db.products.find({ price: { $gte: 50, $lte: 200 } })

# Compound index for range + equality
db.orders.createIndex({ status: 1, createdAt: 1 })
db.orders.find({
  status: "completed",
  createdAt: { $gte: new Date("2024-01-01") }
})
```

---

## Pattern Matching with Regex

Pattern matching allows flexible searching for strings that match specific patterns.

### Basic Regex Patterns

```bash
# Simple pattern match
db.users.find({
  name: { $regex: "john", $options: "i" }
})

# Email pattern search
db.users.find({
  email: { $regex: "gmail" }
})

# Product name contains word
db.products.find({
  name: { $regex: "laptop", $options: "i" }
})
```

### Anchor Patterns

```bash
# Starts with pattern (^ anchor)
db.users.find({
  email: { $regex: "^john" }
})

# Ends with pattern ($ anchor)
db.users.find({
  email: { $regex: "@gmail.com$" }
})

# Exact match with anchors
db.users.find({
  city: { $regex: "^New York$", $options: "i" }
})

# Domain pattern
db.users.find({
  email: { $regex: "@example\\.com$" }
})
```

### Character Classes and Quantifiers

```bash
# One or more digit
db.users.find({
  phone: { $regex: "\\d+" }
})

# Digit range (5-10 digits)
db.users.find({
  zipCode: { $regex: "^\\d{5}(-\\d{4})?$" }
})

# Letter sequences
db.products.find({
  name: { $regex: "[a-zA-Z]+" }
})

# Alphanumeric with underscore
db.accounts.find({
  username: { $regex: "^[a-zA-Z0-9_]{3,20}$" }
})
```

### Common Regex Patterns

```bash
# Email validation pattern
db.users.find({
  email: {
    $regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  }
})

# Phone number (US format)
db.users.find({
  phone: { $regex: "^\\+?1?[-.]?\\(?\\d{3}\\)?[-.]?\\d{3}[-.]?\\d{4}$" }
})

# URL pattern
db.content.find({
  url: { $regex: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b" }
})

# Postal code
db.users.find({
  postalCode: { $regex: "^\\d{5}(-\\d{4})?$" }
})

# Username (3-20 chars, letters/numbers/underscore)
db.users.find({
  username: { $regex: "^[a-zA-Z0-9_]{3,20}$" }
})
```

### Regex Options

```bash
# i - Case insensitive
db.users.find({
  city: { $regex: "new york", $options: "i" }
})

# m - Multiline mode (^ and $ match line boundaries)
db.articles.find({
  content: { $regex: "^important", $options: "m" }
})

# s - Dotall (. matches newlines)
db.documents.find({
  text: { $regex: "start.*end", $options: "s" }
})

# x - Verbose (ignore whitespace in pattern)
db.data.find({
  value: { $regex: "pattern \\s+ value", $options: "x" }
})

# Multiple options combined
db.users.find({
  email: { $regex: "john.doe", $options: "im" }
})
```

### Negative Pattern Matching

```bash
# Find users NOT matching pattern
db.users.find({
  email: { $not: { $regex: "@gmail.com$" } }
})

# Find products without "used" in description
db.products.find({
  description: {
    $not: { $regex: "used", $options: "i" }
  }
})
```

### Regex Performance Tips

```bash
# Create text index for better performance
db.products.createIndex({ name: "text", description: "text" })
db.products.find({ $text: { $search: "laptop computer" } })

// Anchor patterns at start for index usage
db.users.createIndex({ email: 1 })
db.users.find({
  email: { $regex: "^john" }  // Better performance
})

// Avoid expensive regex patterns
// BAD - matches everything
db.users.find({ email: { $regex: ".*" } })

// GOOD - specific pattern
db.users.find({ email: { $regex: "^[a-z]+@example.com$" } })
```

---

## Querying Arrays

MongoDB provides special operators for querying array fields.

### Query Array Elements

```bash
# Find documents where array contains specific value
db.users.find({ hobbies: "reading" })

# Multiple array elements (at least one matches)
db.users.find({ tags: "developer" })

# Find by array index
db.products.find({ "variants.0.color": "red" })
```

### Array Size

```bash
# Find arrays with specific length
db.users.find({ hobbies: { $size: 3 } })

# Find users with more than 2 hobbies
db.users.find({
  hobbies: {
    $not: { $size: { $lte: 2 } }
  }
})

// Alternative: use $expr
db.users.find({
  $expr: { $gt: [{ $size: "$hobbies" }, 2] }
})
```

### Array Element Conditions ($elemMatch)

```bash
# Find orders with items matching multiple conditions
db.orders.find({
  items: {
    $elemMatch: {
      productId: "P001",
      quantity: { $gte: 5 }
    }
  }
})

# Find courses with assignments scored 90+
db.courses.find({
  assignments: {
    $elemMatch: {
      name: "Final Exam",
      score: { $gte: 90 }
    }
  }
})
```

### All Array Elements ($all)

```bash
# Find documents with array containing all specified values
db.users.find({
  hobbies: { $all: ["reading", "gaming"] }
})

// Order doesn't matter
db.users.find({
  hobbies: { $all: ["gaming", "reading"] }
})

# Array of objects
db.products.find({
  tags: { $all: ["electronics", "new", "sale"] }
})
```

### Any Array Element ($in)

```bash
# Find documents with array containing any of specified values
db.users.find({
  hobbies: { $in: ["reading", "gaming", "sports"] }
})

# Find orders with status in multiple states
db.orders.find({
  status: { $in: ["pending", "processing", "shipped"] }
})
```

### Array Range Queries

```bash
# Find users with at least one score above 90
db.students.find({
  scores: { $gt: 90 }
})

// And one score below 80
db.students.find({
  scores: { $lt: 80 },
  scores: { $gt: 90 }
})

# Find products where all prices are above $10
db.products.find({
  prices: {
    $not: { $elemMatch: { $lt: 10 } }
  }
})
```

### Remove Array Elements in Query

```bash
# Find and filter array results
db.users.find(
  { name: "John" },
  { hobbies: { $slice: 2 } }  // Return first 2 hobbies
)

# Skip and limit array
db.users.find(
  { name: "John" },
  { hobbies: { $slice: [1, 3] } }  // Skip 1, return next 3
)
```

---

## Querying Embedded Documents

Embedded documents (nested objects) can be queried at any depth.

### Querying Nested Fields

```bash
# Simple nested field query
db.users.find({ "address.city": "New York" })

# Multiple nested field conditions
db.users.find({
  "address.city": "New York",
  "address.state": "NY"
})

# Deeply nested query
db.companies.find({ "ceo.contact.email": "jane@company.com" })
```

### Entire Embedded Document Match

```bash
# Match complete embedded document (all fields must match exactly)
db.users.find({
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001"
  }
})

# Order of fields matters for exact match
db.users.find({
  address: {
    city: "New York",
    state: "NY",
    street: "123 Main St",
    zipCode: "10001"
  }
})  // May not match if field order is different
```

### Embedded Document Range Queries

```bash
# Range query on nested field
db.employees.find({
  "salary.annual": { $gte: 50000, $lte: 100000 }
})

# Multiple range conditions on nested fields
db.products.find({
  "price.usd": { $gt: 100 },
  "price.eur": { $lt: 150 }
})
```

### Embedded Document Arrays

```bash
# Query array of embedded documents
db.orders.find({
  "items.productId": "P001"
})

# Multiple conditions on array of objects
db.orders.find({
  items: {
    $elemMatch: {
      productId: "P001",
      quantity: { $gte: 2 }
    }
  }
})

# Find where any item's price exceeds $100
db.orders.find({
  "items.price": { $gt: 100 }
})
```

### Nested Boolean Queries

```bash
# Complex conditions on embedded documents
db.users.find({
  $and: [
    { "address.city": "New York" },
    { "address.country": "USA" },
    { "contact.email": { $regex: "@example.com$" } }
  ]
})

# OR condition on nested fields
db.products.find({
  $or: [
    { "specs.color": "red" },
    { "specs.color": "blue" }
  ]
})
```

### Update and Query Nested Documents

```bash
# Query and update nested field
db.users.updateOne(
  { "address.city": "New York" },
  { $set: { "address.zipCode": "10002" } }
)

# Query nested array and update
db.orders.updateOne(
  { "items.productId": "P001" },
  { $set: { "items.$.quantity": 5 } }
)
```

---

## $exists Operator

The `$exists` operator checks whether a field exists in a document, regardless of its value.

### Basic $exists Usage

```bash
# Find documents where field exists
db.users.find({ phone: { $exists: true } })

# Find documents where field does NOT exist
db.users.find({ phone: { $exists: false } })

# Multiple fields
db.users.find({
  phone: { $exists: true },
  email: { $exists: true }
})
```

### $exists vs null

```bash
// Document structure
// doc1: { name: "John", phone: null }
// doc2: { name: "Alice" }  // No phone field

// Find null values (exists with null)
db.users.find({ phone: null })  // Returns both doc1 and doc2

// Find where field exists but is null
db.users.find({
  phone: { $exists: true, $eq: null }
})  // Returns only doc1

// Find where field exists and is not null
db.users.find({
  phone: { $exists: true, $ne: null }
})  // Returns only doc1 (if it had non-null value)

// Find where field doesn't exist
db.users.find({
  phone: { $exists: false }
})  // Returns only doc2
```

### $exists with Nested Documents

```bash
# Check if nested field exists
db.users.find({ "address.city": { $exists: true } })

# Find documents without address
db.users.find({ "address": { $exists: false } })

# Find users with address but no phone
db.users.find({
  "address": { $exists: true },
  "phone": { $exists: false }
})
```

### $exists with Arrays

```bash
# Find documents where array field exists
db.users.find({ hobbies: { $exists: true } })

// Only finds non-empty or null arrays
db.users.find({ hobbies: { $exists: true } })

# Find documents without array
db.users.find({ hobbies: { $exists: false } })

# Empty array still exists
// doc1: { hobbies: [] }
db.users.find({ hobbies: { $exists: true } })  // Matches doc1
```

### Practical $exists Examples

```bash
# Find incomplete user profiles (missing email or phone)
db.users.find({
  $or: [
    { email: { $exists: false } },
    { phone: { $exists: false } }
  ]
})

# Find documents with optional fields filled
db.products.find({
  "warranty.years": { $exists: true },
  "warranty.coverage": { $exists: true }
})

# Find records with missing timestamps
db.events.find({
  createdAt: { $exists: true },
  updatedAt: { $exists: false }
})
```

---

## $type Operator

The `$type` operator filters documents by field data type.

### Basic $type Usage

```bash
# Find fields of specific type
db.data.find({ value: { $type: "string" } })

# Find numeric fields
db.data.find({ price: { $type: "double" } })

# Find boolean values
db.data.find({ active: { $type: "bool" } })
```

### MongoDB Type Names

```bash
# String type
db.users.find({ name: { $type: "string" } })

# Number types
db.products.find({ quantity: { $type: "int" } })
db.products.find({ price: { $type: "double" } })
db.data.find({ value: { $type: "long" } })
db.financial.find({ amount: { $type: "decimal" } })

# Date type
db.events.find({ eventDate: { $type: "date" } })

# Boolean type
db.users.find({ active: { $type: "bool" } })

# ObjectId type
db.users.find({ _id: { $type: "objectId" } })

# Array type
db.users.find({ hobbies: { $type: "array" } })

# Embedded document type
db.users.find({ address: { $type: "object" } })

# Null type
db.users.find({ phone: { $type: "null" } })

# Binary data type
db.files.find({ data: { $type: "binData" } })

# Regular expression type
db.patterns.find({ pattern: { $type: "regex" } })
```

### Type Checking Examples

```bash
# Find documents where field is a string or number
db.data.find({
  value: { $type: ["string", "int", "double"] }
})

# Find numeric fields (any number type)
db.data.find({
  value: { $type: ["int", "long", "double", "decimal"] }
})

# Find dates
db.events.find({
  eventDate: { $type: "date" }
})
```

### Type Conversion Checks

```bash
// Document with mixed types
// doc1: { price: 99.99 } (double)
// doc2: { price: "99.99" } (string)
// doc3: { price: 99 } (int)

# Find numeric prices
db.products.find({
  price: { $type: ["int", "long", "double", "decimal"] }
})

# Find string prices
db.products.find({
  price: { $type: "string" }
})
```

### Type with $exists

```bash
# Find fields that exist and are strings
db.users.find({
  $and: [
    { email: { $exists: true } },
    { email: { $type: "string" } }
  ]
})

# Find fields that are null (type check)
db.users.find({
  phone: { $type: "null" }
})

// vs $exists false (field missing)
db.users.find({
  phone: { $exists: false }
})
```

### Practical Type Examples

```bash
# Data cleanup - find incorrectly typed fields
db.users.find({
  age: { $type: "string" }  // Should be number
})

# Find products with valid prices (numeric)
db.products.find({
  price: { $type: ["int", "double", "decimal"] }
})

# Find arrays in product field
db.products.find({
  images: { $type: "array" }
})

# Find documents with missing IDs (not ObjectId)
db.users.find({
  _id: { $not: { $type: "objectId" } }
})

# Find structured data vs plain text
db.content.find({
  metadata: { $type: "object" }
})
```

### Multiple Type Conditions

```bash
# Complex type validation
db.data.find({
  $and: [
    { value: { $type: ["int", "double"] } },
    { name: { $type: "string" } },
    { tags: { $type: "array" } }
  ]
})

# Find documents with either string or array
db.users.find({
  data: { $type: ["string", "array"] }
})
```

---

## Query Combination Examples

Real-world queries combining multiple techniques:

```bash
# Find active users in New York older than 25 with hobbies
db.users.find({
  $and: [
    { active: { $eq: true } },
    { "address.city": "New York" },
    { age: { $gt: 25 } },
    { hobbies: { $exists: true, $type: "array" } }
  ]
})

# Find products: in stock, price $50-$200, with description
db.products.find({
  inStock: true,
  price: { $gte: 50, $lte: 200 },
  description: { $exists: true, $type: "string" }
})

# Find orders with high-value items this month
const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
db.orders.find({
  createdAt: { $gte: startOfMonth },
  items: {
    $elemMatch: {
      price: { $gt: 100 },
      quantity: { $gte: 1 }
    }
  }
})

# Complex search: email pattern, specific type, non-null
db.users.find({
  email: {
    $regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    $type: "string"
  },
  phone: { $exists: true, $ne: null },
  joinDate: { $type: "date" }
})
```

---

Mastering these basic querying techniques provides the foundation for more advanced MongoDB operations and data retrieval strategies.
