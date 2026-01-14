# Data Modeling

Data modeling in MongoDB involves designing document structure to optimize for your application's access patterns. Unlike relational databases, MongoDB offers flexibility in how you organize and relate data through embedding and referencing. This guide covers essential modeling patterns and best practices.

## Embedding vs Referencing

The fundamental decision in MongoDB data modeling is whether to embed related data within a document or reference it from another collection.

### Embedding Strategy

Embedding stores related data within a single document.

### Advantages of Embedding

```bash
# Embedded document structure
{
  _id: 1,
  name: "John Doe",
  email: "john@example.com",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001"
  },
  phone: {
    mobile: "555-1234",
    home: "555-5678"
  }
}
```

**Benefits:**
- ✅ Single document read for complete data
- ✅ Atomic updates (entire embedded document updated together)
- ✅ No need for joins
- ✅ Better performance for related data access
- ✅ Preserves relationships

### Disadvantages of Embedding

```bash
// Problem: Embedded data duplication
// If address is needed elsewhere, it's duplicated across documents

{
  _id: 1,
  name: "John",
  address: { street: "123 Main St", city: "New York" }
}

{
  _id: 2,
  name: "Jane",
  address: { street: "123 Main St", city: "New York" }  // Duplicate
}

// Problem: Large document sizes
// Embedding large arrays can increase document size significantly

{
  _id: 1,
  user: "john",
  comments: [
    { text: "...", createdAt: "..." },
    { text: "...", createdAt: "..." },
    // ... thousands of comments embedded
  ]  // Document becomes too large (>16MB limit)
}
```

**Drawbacks:**
- ❌ Data duplication across documents
- ❌ Large document sizes
- ❌ Harder to query embedded data in isolation
- ❌ Updating embedded data requires whole document update
- ❌ Not ideal for one-to-many with many items

### Referencing Strategy

Referencing stores relationships using IDs in separate collections.

```bash
// User collection
{
  _id: 1,
  name: "John Doe",
  email: "john@example.com",
  addressId: ObjectId("607c5b3f5e1a4c3b8f2a5c1d")
}

// Address collection
{
  _id: ObjectId("607c5b3f5e1a4c3b8f2a5c1d"),
  street: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001"
}
```

**Benefits:**
- ✅ Reduces data duplication
- ✅ Smaller document sizes
- ✅ Easy to query related data independently
- ✅ Flexible updates to referenced data
- ✅ Better for one-to-many relationships with many items

**Drawbacks:**
- ❌ Requires multiple queries or $lookup
- ❌ No atomic updates across documents
- ❌ Slower for accessing related data
- ❌ Referential integrity not automatically enforced

### Decision Criteria

```bash
# EMBED if:
# - Data is accessed together frequently
# - Data is small (< 1MB)
# - Data is not shared across documents
# - Read performance is critical

db.users.insertOne({
  _id: 1,
  name: "John",
  address: {      // Embed small, frequently accessed data
    street: "123 Main St",
    city: "New York"
  }
})

# REFERENCE if:
# - Data is large or grows unbounded
# - Data is shared across many documents
# - Data is frequently updated independently
# - Flexibility is needed

db.users.insertOne({
  _id: 1,
  name: "John",
  postsIds: [      // Reference large/growing data
    ObjectId("..."),
    ObjectId("..."),
    // ... many post IDs
  ]
})
```

---

## One-to-One Relationships

One-to-one relationships map one document to exactly one related document.

### Embedded One-to-One

Best for small, inseparable data.

```bash
# User with embedded profile
db.users.insertOne({
  _id: ObjectId(),
  username: "johndoe",
  email: "john@example.com",
  profile: {
    firstName: "John",
    lastName: "Doe",
    avatar: "https://...",
    bio: "Software developer",
    socialLinks: {
      twitter: "johndoe",
      linkedin: "johndoe",
      github: "johndoe"
    }
  },
  createdAt: new Date()
})

# Query embedded data
db.users.find({ "profile.firstName": "John" })

# Update embedded data
db.users.updateOne(
  { _id: ObjectId() },
  { $set: { "profile.bio": "Updated bio" } }
)
```

### Referenced One-to-One

Better when data is updated separately or is sensitive.

```bash
// User collection
db.users.insertOne({
  _id: ObjectId(),
  username: "johndoe",
  email: "john@example.com",
  settingsId: ObjectId("...")
})

// Settings collection (sensitive data)
db.settings.insertOne({
  _id: ObjectId(),
  userId: ObjectId(),
  theme: "dark",
  notifications: true,
  privacy: "public"
})

# Query with $lookup
db.users.aggregate([
  { $lookup: {
    from: "settings",
    localField: "_id",
    foreignField: "userId",
    as: "settings"
  } },
  { $unwind: "$settings" }
])
```

### One-to-One Best Practices

```bash
# Hybrid approach: Embed frequently accessed data, reference the rest
db.users.insertOne({
  _id: ObjectId(),
  username: "johndoe",
  email: "john@example.com",
  profile: {
    firstName: "John",
    avatar: "https://..."
  },
  preferencesId: ObjectId()  // Reference less frequently accessed
})
```

---

## One-to-Many Relationships

One document relates to multiple documents of another type.

### Embedded One-to-Many (Small Array)

Good when the "many" side is small and bounded.

```bash
# Author with embedded books (small collection)
db.authors.insertOne({
  _id: ObjectId(),
  name: "J.K. Rowling",
  books: [
    {
      title: "Harry Potter and the Philosopher's Stone",
      year: 1998,
      isbn: "..."
    },
    {
      title: "Harry Potter and the Chamber of Secrets",
      year: 1999,
      isbn: "..."
    }
    // ... reasonable number of books
  ]
})

# Query embedded array
db.authors.find({ "books.title": "Harry Potter..." })

# Update embedded array item
db.authors.updateOne(
  { _id: ObjectId(), "books.title": "..." },
  { $set: { "books.$.year": 2024 } }
)

# Add to array
db.authors.updateOne(
  { _id: ObjectId() },
  { $push: { books: { title: "New Book", year: 2024 } } }
)
```

### Referenced One-to-Many (Large Array)

Necessary when the "many" side is large or unbounded.

```bash
// Author collection
db.authors.insertOne({
  _id: ObjectId(),
  name: "J.K. Rowling",
  bookCount: 7
})

// Books collection
db.books.insertMany([
  {
    _id: ObjectId(),
    authorId: ObjectId(),
    title: "Harry Potter...",
    year: 1998
  },
  {
    _id: ObjectId(),
    authorId: ObjectId(),
    title: "Harry Potter...",
    year: 1999
  }
  // ... all books stored separately
])

# Query related documents
db.books.find({ authorId: ObjectId() })

# Count related documents
db.books.countDocuments({ authorId: ObjectId() })

# Join with $lookup
db.authors.aggregate([
  { $lookup: {
    from: "books",
    localField: "_id",
    foreignField: "authorId",
    as: "books"
  } }
])
```

### Array Boundaries

```bash
// EMBED - small bounded array
{
  _id: 1,
  user: "john",
  phoneNumbers: [      // Limited to 5 phone numbers
    "555-1234",
    "555-5678"
  ]
}

// REFERENCE - large unbounded array
{
  _id: 1,
  user: "john",
  // Comments not stored here - could be thousands
  // Reference separately:
  // db.comments.find({ userId: 1 })
}

// Hybrid - cap embedded array
{
  _id: 1,
  user: "john",
  recentComments: [    // Most recent 10
    ObjectId(),
    ObjectId(),
    // ... max 10
  ],
  commentIds: [        // All comment IDs for reference
    ObjectId(),
    ObjectId(),
    // ... all comments
  ]
}
```

---

## Many-to-Many Relationships

Documents from one collection relate to multiple documents in another collection.

### Many-to-Many with Embedded Arrays

Store IDs of related documents.

```bash
// Students collection
db.students.insertOne({
  _id: ObjectId(),
  name: "John",
  courseIds: [
    ObjectId("course1"),
    ObjectId("course2"),
    ObjectId("course3")
  ]
})

// Courses collection
db.courses.insertOne({
  _id: ObjectId("course1"),
  title: "MongoDB Basics",
  studentIds: [
    ObjectId("student1"),
    ObjectId("student2"),
    ObjectId("student3")
  ]
})

# Query student's courses
db.courses.find({
  _id: { $in: studentCourseIds }
})

# Query course's students
db.students.find({
  _id: { $in: courseStudentIds }
})
```

### Many-to-Many with Junction Collection

Separate collection for relationships with metadata.

```bash
// Students collection
db.students.insertOne({
  _id: ObjectId(),
  name: "John"
})

// Courses collection
db.courses.insertOne({
  _id: ObjectId(),
  title: "MongoDB Basics"
})

// Enrollments collection (junction)
db.enrollments.insertOne({
  _id: ObjectId(),
  studentId: ObjectId(),
  courseId: ObjectId(),
  enrolledAt: new Date(),
  grade: "A",
  status: "completed"
})

# Query student's courses with grades
db.enrollments.aggregate([
  { $match: { studentId: ObjectId() } },
  { $lookup: {
    from: "courses",
    localField: "courseId",
    foreignField: "_id",
    as: "course"
  } },
  { $project: {
    course: { $arrayElemAt: ["$course", 0] },
    grade: 1,
    status: 1
  } }
])
```

### Many-to-Many Best Practices

```bash
// Use junction collection when:
// - You need metadata about the relationship
// - Relationship cardinality is high
// - You need transaction semantics on relationships

db.enrollments.updateOne(
  { studentId: ObjectId(), courseId: ObjectId() },
  { $set: { grade: "A+", lastUpdated: new Date() } }
)

// Index the junction collection
db.enrollments.createIndex({ studentId: 1 })
db.enrollments.createIndex({ courseId: 1 })
db.enrollments.createIndex({ studentId: 1, courseId: 1 })
```

---

## Schema Design Patterns

Proven patterns for common data modeling scenarios.

### Attribute Pattern

Store related attributes in a flexible structure.

```bash
# Product with variable attributes
db.products.insertOne({
  _id: ObjectId(),
  name: "Laptop",
  price: 1000,
  attrs: [
    { key: "processor", value: "Intel i7" },
    { key: "ram", value: "16GB" },
    { key: "storage", value: "512GB SSD" }
  ]
})

# Query by attribute
db.products.find({ "attrs.key": "processor", "attrs.value": "Intel i7" })

# Versatile for different product types
db.products.insertOne({
  _id: ObjectId(),
  name: "Book",
  price: 20,
  attrs: [
    { key: "author", value: "J.K. Rowling" },
    { key: "pages", value: "309" },
    { key: "isbn", value: "..." }
  ]
})
```

### Subset Pattern

Store common subset of data in parent, rest in child.

```bash
// Posts collection (subset)
db.posts.insertOne({
  _id: ObjectId(),
  title: "MongoDB Guide",
  content: "...",
  author: "John",
  createdAt: new Date(),
  recentComments: [  // Most recent 3 comments
    {
      _id: ObjectId(),
      text: "Great post!",
      author: "Jane"
    }
  ],
  commentCount: 150
})

// Comments collection (full)
db.comments.insertMany([
  {
    _id: ObjectId(),
    postId: ObjectId(),
    text: "Great post!",
    author: "Jane",
    createdAt: new Date()
  }
  // ... all 150 comments here
])

# Query recent comments from post
db.posts.findOne({ _id: ObjectId() }, { recentComments: 1 })

# Query all comments
db.comments.find({ postId: ObjectId() })
```

### Extended Reference Pattern

Store commonly needed fields from referenced document.

```bash
// Orders with extended customer references
db.orders.insertOne({
  _id: ObjectId(),
  customerId: ObjectId(),
  customerName: "John Doe",      // Extended reference
  customerEmail: "john@example.com",
  amount: 500,
  createdAt: new Date()
})

# Avoids needing to look up customer for basic info
db.orders.find({ customerEmail: "john@example.com" })

# Still maintain relationship for detail page
db.orders.aggregate([
  { $match: { _id: ObjectId() } },
  { $lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customer"
  } }
])
```

### Bucketing Pattern

Group data into buckets for easier management.

```bash
// Time-series data bucketed by day
db.sensorData.insertOne({
  _id: ObjectId(),
  sensorId: 1,
  date: new Date("2024-01-15"),
  readings: [
    { time: "08:00", temperature: 22.5, humidity: 45 },
    { time: "09:00", temperature: 23.1, humidity: 46 },
    // ... all readings for the day
  ]
})

# Query readings by date
db.sensorData.find({
  sensorId: 1,
  date: { $gte: new Date("2024-01-01"), $lt: new Date("2024-02-01") }
})

# Efficient time-series data
db.sensorData.createIndex({ sensorId: 1, date: 1 })
```

### Polymorphic Pattern

Store different document types in same collection.

```bash
// Events collection with different types
db.events.insertOne({
  _id: ObjectId(),
  type: "user_signup",
  timestamp: new Date(),
  userId: ObjectId(),
  email: "john@example.com"
})

db.events.insertOne({
  _id: ObjectId(),
  type: "product_purchase",
  timestamp: new Date(),
  userId: ObjectId(),
  productId: ObjectId(),
  amount: 100
})

# Query by event type
db.events.find({ type: "product_purchase" })

# Filter by common fields
db.events.find({ userId: ObjectId(), timestamp: { $gte: new Date() } })
```

---

## Denormalization Strategies

Intentional data duplication for performance optimization.

### Calculated Denormalization

Store computed values to avoid recalculation.

```bash
# User with denormalized stats
db.users.insertOne({
  _id: ObjectId(),
  username: "john",
  email: "john@example.com",
  createdAt: new Date("2020-01-01"),
  postCount: 150,          // Denormalized
  followerCount: 500,      // Denormalized
  totalLikes: 2500         // Denormalized
})

# Update denormalized fields on related changes
db.users.updateOne(
  { _id: ObjectId() },
  { $inc: { postCount: 1 } }
)

db.users.updateOne(
  { _id: ObjectId() },
  { $inc: { totalLikes: 1 } }
)
```

### Attribute Denormalization

Store frequently accessed attributes from referenced document.

```bash
// Order with denormalized customer info
db.orders.insertOne({
  _id: ObjectId(),
  customerId: ObjectId(),
  customerName: "John Doe",      // Denormalized
  customerCity: "New York",      // Denormalized
  amount: 500,
  status: "completed"
})

# No need to join for customer name in list view
db.orders.find({}, { customerName: 1, amount: 1 })

# Still available for detailed view
db.orders.aggregate([
  { $lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customer"
  } }
])
```

### Denormalization Maintenance

```bash
// Update both documents when denormalized data changes
db.customers.updateOne(
  { _id: ObjectId() },
  { $set: { name: "New Name" } }
)

// Also update in orders
db.orders.updateMany(
  { customerId: ObjectId() },
  { $set: { customerName: "New Name" } }
)

// Or use transactions for atomicity
session = db.getMongo().startSession()
session.startTransaction()

db.customers.updateOne(
  { _id: ObjectId() },
  { $set: { name: "New Name" } }
)

db.orders.updateMany(
  { customerId: ObjectId() },
  { $set: { customerName: "New Name" } }
)

session.commitTransaction()
```

---

## Schema Validation

Define and enforce document structure rules.

### JSON Schema Validation

```bash
# Create collection with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "name"],
      properties: {
        _id: { bsonType: "objectId" },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        name: {
          bsonType: "string",
          minLength: 2,
          maxLength: 100
        },
        age: {
          bsonType: "int",
          minimum: 0,
          maximum: 150
        },
        status: {
          enum: ["active", "inactive", "suspended"]
        },
        createdAt: { bsonType: "date" }
      }
    }
  }
})

# Insert valid document
db.users.insertOne({
  email: "john@example.com",
  name: "John Doe",
  age: 30,
  status: "active",
  createdAt: new Date()
})

# Insert invalid document (fails)
db.users.insertOne({
  email: "invalid-email",  // Invalid email format
  name: "J"                // Too short
})
```

### Nested Schema Validation

```bash
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["customerId", "items"],
      properties: {
        _id: { bsonType: "objectId" },
        customerId: { bsonType: "objectId" },
        items: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["productId", "quantity", "price"],
            properties: {
              productId: { bsonType: "objectId" },
              quantity: { bsonType: "int", minimum: 1 },
              price: { bsonType: "double", minimum: 0 }
            }
          }
        },
        totalAmount: {
          bsonType: "double",
          minimum: 0
        },
        status: {
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"]
        }
      }
    }
  }
})
```

### Modifying Validation

```bash
# Update validation rules
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      // ... updated schema
    }
  }
})

# Remove validation
db.runCommand({
  collMod: "users",
  validator: {}
})
```

---

## Document Structure Best Practices

Guidelines for effective document organization.

### Root Level Organization

```bash
# Good: Clear, organized structure
{
  _id: ObjectId(),
  // Metadata
  createdAt: new Date(),
  updatedAt: new Date(),
  status: "active",
  
  // Core data
  name: "Product Name",
  description: "...",
  
  // Related data
  pricing: {
    amount: 100,
    currency: "USD",
    discount: 10
  },
  
  // Arrays for related items
  tags: ["tag1", "tag2"],
  
  // References
  categoryId: ObjectId()
}
```

### Naming Conventions

```bash
# Good conventions
{
  _id: ObjectId(),
  firstName: "John",        // camelCase for fields
  lastName: "Doe",
  emailAddress: "john@...", // Descriptive names
  phoneNumber: "...",
  createdAt: new Date(),    // Use date suffix for dates
  isActive: true,           // Use is prefix for booleans
  itemCount: 5              // Use count suffix for counts
}

# Avoid
{
  ID: ObjectId(),           // Avoid uppercase
  fname: "John",            // Avoid abbreviations
  lname: "Doe",
  email: "john@...",        // Generic names
  phone: "...",
  created: new Date(),      // Ambiguous
  active: true,             // Unclear boolean
  items: 5                   // Could mean array or count
}
```

### Size Considerations

```bash
// Ideal document size: 1KB - 100KB
// Avoid: Documents over 1MB

// TOO LARGE - embed too much
{
  _id: 1,
  user: "john",
  allComments: [      // 10,000+ comments embedded
    { text: "..." },
    { text: "..." },
    // ... thousands
  ]  // Document size: 5MB+
}

// BETTER - reference separately
{
  _id: 1,
  user: "john",
  commentCount: 10000
}

// Separate collection for comments
db.comments.find({ userId: 1 })
```

### Default Values

```bash
// Document with sensible defaults
db.users.insertOne({
  _id: ObjectId(),
  email: "john@example.com",
  name: "John",
  status: "active",           // Default value
  isVerified: false,          // Default value
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],                   // Empty array
  loginCount: 0,              // Default count
  preferences: {
    theme: "light",           // Default preference
    notifications: true
  }
})
```

### Index Planning

```bash
// Plan indexes based on document structure

db.users.createIndex({ email: 1 })              // Unique queries
db.users.createIndex({ status: 1 })             // Filtering
db.users.createIndex({ createdAt: -1 })        // Sorting
db.users.createIndex({ status: 1, createdAt: -1 })  // Combined

db.orders.createIndex({ customerId: 1 })       // Joins
db.orders.createIndex({ "items.productId": 1 })  // Nested field
```

### Versioning Documents

```bash
// Add version field for schema migrations
{
  _id: ObjectId(),
  __v: 2,                // Document version
  email: "john@example.com",
  name: "John",
  // New fields added in v2
  lastLogin: new Date(),
  preferences: { theme: "dark" }
}

// Query by version
db.users.find({ __v: { $lt: 2 } })

// Migrate documents
db.users.updateMany(
  { __v: { $exists: false } },
  [{ $set: { __v: 1, lastLogin: null } }]
)
```

---

## Complete Modeling Example

Comprehensive e-commerce data model.

```bash
// Users collection
db.users.insertOne({
  _id: ObjectId(),
  email: "john@example.com",
  name: "John Doe",
  password: "hashed",
  status: "active",
  createdAt: new Date(),
  profile: {
    phone: "555-1234",
    avatar: "url",
    bio: "..."
  },
  addressIds: [ObjectId(), ObjectId()]
})

// Products collection
db.products.insertOne({
  _id: ObjectId(),
  name: "Laptop",
  description: "...",
  price: 1000,
  stock: 50,
  categoryId: ObjectId(),
  tags: ["electronics", "computers"],
  specs: {
    processor: "Intel i7",
    ram: "16GB",
    storage: "512GB SSD"
  },
  ratings: {
    average: 4.5,
    count: 120
  }
})

// Orders collection
db.orders.insertOne({
  _id: ObjectId(),
  customerId: ObjectId(),
  customerName: "John Doe",
  customerEmail: "john@example.com",
  items: [
    {
      productId: ObjectId(),
      productName: "Laptop",
      price: 1000,
      quantity: 1
    }
  ],
  totalAmount: 1000,
  status: "pending",
  createdAt: new Date(),
  shippingAddressId: ObjectId()
})

// Reviews collection
db.reviews.insertOne({
  _id: ObjectId(),
  productId: ObjectId(),
  customerId: ObjectId(),
  customerName: "John Doe",
  rating: 5,
  title: "Excellent product",
  text: "Very satisfied with this purchase",
  createdAt: new Date()
})
```

---

Effective data modeling is crucial for MongoDB application performance and scalability. Choose between embedding and referencing based on your access patterns, data size, and update frequency.