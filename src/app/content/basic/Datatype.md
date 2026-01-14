# Data Types

MongoDB supports a variety of data types to store different kinds of information. Understanding these data types is essential for designing effective data models and working with your data efficiently.

## String

Strings are sequences of UTF-8 characters. They are one of the most commonly used data types in MongoDB.

### Basic String Usage

```bash
# Insert documents with string fields
db.users.insertOne({
  name: "John Doe",
  email: "john@example.com",
  address: "123 Main Street, New York, NY 10001",
  bio: "A passionate developer and coffee enthusiast"
})

# Query with string
db.users.find({ name: "John Doe" })

# String comparison (case-sensitive by default)
db.users.find({ email: "john@example.com" })
```

### String Operations

```bash
# Case-insensitive search using regex
db.users.find({ name: { $regex: "john", $options: "i" } })

# String contains
db.users.find({ address: { $regex: "New York" } })

# Update string field
db.users.updateOne(
  { name: "John Doe" },
  { $set: { bio: "Updated bio text" } }
)
```

### String Constraints

- Maximum string length: 16 MB
- Strings are UTF-8 encoded
- Case-sensitive comparisons by default
- Empty strings are allowed

---

## Number

MongoDB supports several numeric data types for different precision requirements.

### Int32 (32-bit Integer)

Signed 32-bit integers ranging from -2,147,483,648 to 2,147,483,647:

```bash
# Int32 - suitable for general counts and IDs
db.products.insertOne({
  productId: 12345,
  quantity: 100,
  rating: 4,
  reviews: 250
})

# Query with Int32
db.products.find({ quantity: { $gt: 50 } })

# Update with increment (maintains Int32)
db.products.updateOne(
  { productId: 12345 },
  { $inc: { quantity: -10 } }
)
```

### Int64 (64-bit Integer)

Signed 64-bit integers for larger numbers (-9,223,372,036,854,775,808 to 9,223,372,036,854,775,807):

```bash
# Int64 - use for large numbers
db.analytics.insertOne({
  userId: NumberLong("9223372036854775800"),
  pageViews: NumberLong("1000000000"),
  impressions: NumberLong("5000000000"),
  timestamp: new Date()
})

# Query with Int64
db.analytics.find({ pageViews: { $gte: NumberLong("1000000") } })
```

### Double (64-bit Floating Point)

Default numeric type for decimal numbers:

```bash
# Double - used for prices, measurements, and decimals
db.products.insertOne({
  name: "Laptop",
  price: 999.99,
  weight: 1.5,
  discountRate: 0.15,
  rating: 4.5
})

# Query with floating-point numbers
db.products.find({ price: { $lt: 1000.00 } })

# Arithmetic operations
db.products.updateOne(
  { name: "Laptop" },
  { $mul: { price: 0.9 } }  # Apply 10% discount
)
```

### Decimal128 (128-bit Decimal)

High-precision decimal numbers for financial and precise calculations:

```bash
# Decimal128 - use for financial data
db.accounts.insertOne({
  accountId: "ACC001",
  balance: Decimal128("10000.50"),
  interestRate: Decimal128("0.045"),
  totalTransactions: Decimal128("50000.99")
})

# Query with Decimal128
db.accounts.find({ balance: { $gte: Decimal128("5000.00") } })

# Update Decimal128
db.accounts.updateOne(
  { accountId: "ACC001" },
  { $inc: { balance: Decimal128("100.25") } }
)
```

### Number Type Comparison

| Type | Range | Use Case |
|------|-------|----------|
| Int32 | -2.1B to 2.1B | Counts, IDs, general integers |
| Int64 | ±9.2×10^18 | Large counts, timestamps |
| Double | ±1.7×10^308 | Prices, ratings, measurements |
| Decimal128 | ±1.6×10^6144 | Financial calculations, precision |

### Number Precision Example

```bash
# Double might have precision issues
db.data.insertOne({
  doubleValue: 0.1 + 0.2,  # May not equal 0.3 exactly
  decimalValue: Decimal128("0.3")  # Exact precision
})

# For financial data, always use Decimal128
db.transactions.insertOne({
  amount: Decimal128("99.99"),
  tax: Decimal128("7.99"),
  total: Decimal128("107.98")
})
```

---

## Boolean

Boolean data type represents true or false values.

### Basic Boolean Usage

```bash
# Insert documents with boolean fields
db.users.insertOne({
  name: "Alice",
  active: true,
  emailVerified: false,
  isPremium: true,
  acceptNewsletter: true
})

# Query boolean values
db.users.find({ active: true })

# Find inactive users
db.users.find({ active: false })
```

### Boolean Operations

```bash
# Find multiple conditions
db.users.find({
  active: true,
  emailVerified: true,
  isPremium: false
})

# Update boolean field
db.users.updateOne(
  { name: "Alice" },
  { $set: { emailVerified: true } }
)

# Toggle boolean value
db.users.updateOne(
  { name: "Alice" },
  { $set: { active: !db.users.findOne({ name: "Alice" }).active } }
)
```

### Boolean Constraints

- Values are exactly true or false (not 0/1, "true"/"false")
- Case-sensitive in queries
- Null is different from false

---

## Date

Date type stores dates and times as milliseconds since Unix epoch (January 1, 1970).

### Basic Date Usage

```bash
# Insert with current date
db.events.insertOne({
  eventName: "Conference",
  startDate: new Date(),
  endDate: new Date("2024-12-31"),
  createdAt: new Date()
})

# Insert with specific date
db.users.insertOne({
  name: "John",
  joinDate: new Date("2024-01-15"),
  lastLogin: new Date("2024-01-20T10:30:00Z"),
  birthDate: new Date("1990-05-20")
})
```

### Date Queries

```bash
# Find events after specific date
db.events.find({
  startDate: { $gte: new Date("2024-06-01") }
})

# Find between two dates
db.users.find({
  joinDate: {
    $gte: new Date("2024-01-01"),
    $lt: new Date("2024-12-31")
  }
})

# Find users who joined this month
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

db.users.find({
  joinDate: {
    $gte: startOfMonth,
    $lt: endOfMonth
  }
})
```

### Date Operations

```bash
# Update with current date
db.users.updateOne(
  { name: "John" },
  { $set: { lastLogin: new Date() } }
)

# Update with specific date
db.events.updateOne(
  { eventName: "Conference" },
  { $set: { endDate: new Date("2025-01-15") } }
)

# Calculate age from birth date
db.users.find().forEach(function(user) {
  const age = (new Date() - user.birthDate) / (1000 * 60 * 60 * 24 * 365.25);
  print(user.name + " age: " + Math.floor(age));
})
```

### ISO Date Format

```bash
# Using ISO 8601 format
db.events.insertOne({
  eventName: "Webinar",
  startTime: ISODate("2024-03-15T14:30:00Z"),
  endTime: ISODate("2024-03-15T16:00:00Z")
})

# Query using ISO format
db.events.find({
  startTime: { $lt: ISODate("2024-12-31T23:59:59Z") }
})
```

---

## ObjectId

ObjectId is a 12-byte identifier generated automatically for each document as the `_id` field. It ensures uniqueness within a collection.

### ObjectId Structure

An ObjectId consists of:
- 4-byte timestamp (seconds since Unix epoch)
- 5-byte machine identifier
- 3-byte process id
- 2-byte counter (incremented for each ObjectId generated in the same second)

### Using ObjectId

```bash
# ObjectId generated automatically
db.users.insertOne({ name: "John" })
# Result: { "_id": ObjectId("507f1f77bcf86cd799439011"), "name": "John" }

# Query by ObjectId
db.users.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })

# Custom ObjectId
db.users.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439012"),
  name: "Alice"
})
```

### ObjectId Queries

```bash
# Find by exact ObjectId
db.users.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })

# Extract timestamp from ObjectId
const objectId = ObjectId("507f1f77bcf86cd799439011");
const timestamp = objectId.getTimestamp();
console.log(timestamp);  // Date when document was created

# Find documents created within a time range
const startDate = new Date("2024-01-01");
const endDate = new Date("2024-12-31");

const startObjectId = ObjectId.fromDate(startDate);
const endObjectId = ObjectId.fromDate(endDate);

db.users.find({
  _id: { $gte: startObjectId, $lte: endObjectId }
})
```

### ObjectId Best Practices

```bash
# Always use ObjectId for document identification
db.users.insertOne({
  _id: ObjectId(),
  name: "John",
  email: "john@example.com"
})

# ObjectId provides natural sharding distribution
# Avoid custom _id like sequential integers for sharded systems
```

---

## Array

Arrays store multiple values in a single field. Elements can be of different data types.

### Basic Array Usage

```bash
# Insert documents with array fields
db.users.insertOne({
  name: "John",
  hobbies: ["reading", "gaming", "cooking"],
  tags: ["developer", "python", "nodejs"],
  scores: [95, 87, 92, 88]
})

# Insert with mixed-type array
db.products.insertOne({
  name: "Product A",
  details: [
    "High quality",
    5,
    true,
    { color: "red" }
  ]
})
```

### Array Queries

```bash
# Find documents with specific array element
db.users.find({ hobbies: "reading" })

# Find by array length
db.users.find({ hobbies: { $size: 3 } })

# Find array element at specific index
db.users.find({ "hobbies.0": "reading" })

# Check if array contains multiple values
db.users.find({
  hobbies: { $all: ["reading", "gaming"] }
})

# Array element matches condition
db.users.find({
  scores: { $gte: 90 }
})
```

### Array Operations

```bash
# Add element to array
db.users.updateOne(
  { name: "John" },
  { $push: { hobbies: "swimming" } }
)

# Add multiple elements
db.users.updateOne(
  { name: "John" },
  { $push: { hobbies: { $each: ["dancing", "painting"] } } }
)

# Remove element from array
db.users.updateOne(
  { name: "John" },
  { $pull: { hobbies: "reading" } }
)

# Add element only if not exists
db.users.updateOne(
  { name: "John" },
  { $addToSet: { hobbies: "swimming" } }
)

# Remove first/last element
db.users.updateOne(
  { name: "John" },
  { $pop: { hobbies: 1 } }  # Remove last element
)
```

### Array of Objects

```bash
# Store array of nested objects
db.orders.insertOne({
  orderId: "ORD001",
  customer: "John",
  items: [
    { productId: "P001", quantity: 2, price: 50.00 },
    { productId: "P002", quantity: 1, price: 150.00 },
    { productId: "P003", quantity: 3, price: 25.00 }
  ]
})

# Query array of objects
db.orders.find({ "items.productId": "P001" })

# Update specific element in array
db.orders.updateOne(
  { orderId: "ORD001", "items.productId": "P001" },
  { $set: { "items.$.quantity": 5 } }
)
```

---

## Embedded Documents

Embedded documents are nested objects/documents within a parent document.

### Basic Embedded Document Usage

```bash
# Insert document with embedded document
db.users.insertOne({
  name: "John Doe",
  email: "john@example.com",
  address: {
    street: "123 Main Street",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  },
  contact: {
    phone: "555-1234",
    mobile: "555-5678"
  }
})
```

### Querying Embedded Documents

```bash
# Query embedded field
db.users.find({ "address.city": "New York" })

# Query nested level deeper
db.users.find({ "address.zipCode": "10001" })

# Multiple conditions on embedded document
db.users.find({
  "address.city": "New York",
  "address.state": "NY"
})

# Entire embedded document
db.users.find({
  address: {
    street: "123 Main Street",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  }
})
```

### Updating Embedded Documents

```bash
# Update single field in embedded document
db.users.updateOne(
  { name: "John Doe" },
  { $set: { "address.city": "Boston" } }
)

# Add new field to embedded document
db.users.updateOne(
  { name: "John Doe" },
  { $set: { "address.apartment": "Apt 4B" } }
)

# Remove field from embedded document
db.users.updateOne(
  { name: "John Doe" },
  { $unset: { "contact.mobile": "" } }
)

# Replace entire embedded document
db.users.updateOne(
  { name: "John Doe" },
  {
    $set: {
      address: {
        street: "456 Oak Avenue",
        city: "Boston",
        state: "MA",
        zipCode: "02101",
        country: "USA"
      }
    }
  }
)
```

### Nested Embedded Documents

```bash
# Multiple levels of nesting
db.companies.insertOne({
  name: "Tech Corp",
  ceo: {
    name: "Jane Smith",
    contact: {
      email: "jane@techcorp.com",
      phone: "555-0001"
    },
    address: {
      street: "100 Tech Park",
      city: "San Francisco",
      state: "CA"
    }
  },
  headquarters: {
    address: {
      street: "100 Tech Park",
      city: "San Francisco",
      state: "CA"
    },
    employees: 1000
  }
})

# Query nested embedded document
db.companies.find({ "ceo.contact.email": "jane@techcorp.com" })

# Update deeply nested field
db.companies.updateOne(
  { name: "Tech Corp" },
  { $set: { "ceo.address.city": "New York" } }
)
```

---

## Null

Null represents the absence of a value or unknown value.

### Basic Null Usage

```bash
# Insert document with null value
db.users.insertOne({
  name: "John",
  email: "john@example.com",
  phone: null,
  middleName: null,
  bio: null
})

# Query for null values
db.users.find({ phone: null })

# Find documents where field is null or doesn't exist
db.users.find({ middleName: null })
```

### Null Comparisons

```bash
# Find documents with null or missing field
db.users.find({ phone: { $eq: null } })

# Find documents without a field (null or missing)
db.users.find({ phone: { $exists: false } })

# Find documents with null value (field exists with null)
db.users.find({
  $and: [
    { phone: null },
    { phone: { $exists: true } }
  ]
})

# Find documents where field exists and is not null
db.users.find({ phone: { $exists: true, $ne: null } })
```

### Null Operations

```bash
# Set field to null
db.users.updateOne(
  { name: "John" },
  { $set: { phone: null } }
)

# Remove field (different from null)
db.users.updateOne(
  { name: "John" },
  { $unset: { phone: "" } }
)
```

---

## Binary Data

Binary data stores arbitrary binary content like images, PDFs, or encoded data.

### Basic Binary Data Usage

```bash
# Insert binary data
db.files.insertOne({
  filename: "image.png",
  data: BinData(0, "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
  mimeType: "image/png",
  size: 1024
})

# Insert with file buffer
db.documents.insertOne({
  filename: "document.pdf",
  data: BinData(0, Buffer.from("PDF binary content here")),
  uploadDate: new Date(),
  contentType: "application/pdf"
})
```

### Binary Data Subtypes

```bash
# Subtype 0: Generic binary data
db.files.insertOne({
  name: "generic",
  data: BinData(0, "YmluYXJ5IGRhdGE=")
})

# Subtype 4: UUID/GUID
db.users.insertOne({
  name: "John",
  uuid: BinData(4, "550e8400e29b41d4a716446655440000")
})

# Subtype 5: MD5
db.files.insertOne({
  filename: "test.txt",
  md5: BinData(5, "5d41402abc4b2a76b9719d911017c592")
})
```

### Binary Data Queries

```bash
# Query binary data
db.files.find({ mimeType: "image/png" })

# Find files by size
db.files.find({ size: { $gte: 1000000 } })

# Find recent uploads
db.documents.find({
  uploadDate: { $gte: new Date("2024-01-01") }
})
```

---

## Regular Expressions

Regular expressions allow pattern matching in queries for string searches.

### Basic Regex Usage

```bash
# Case-sensitive regex
db.users.find({
  email: { $regex: "^john" }
})

# Case-insensitive regex
db.users.find({
  name: { $regex: "john", $options: "i" }
})

# Pattern matching
db.products.find({
  name: { $regex: "laptop|computer" }
})
```

### Common Regex Patterns

```bash
# Starts with pattern
db.users.find({
  email: { $regex: "^john" }
})

# Ends with pattern
db.users.find({
  email: { $regex: "@gmail.com$" }
})

# Contains pattern
db.products.find({
  description: { $regex: "high.quality", $options: "i" }
})

# Phone number pattern
db.users.find({
  phone: { $regex: "^\\+1-\\d{3}-\\d{3}-\\d{4}$" }
})

# Email pattern
db.users.find({
  email: { $regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" }
})
```

### Regex Options

```bash
# i - Case insensitive
db.users.find({ name: { $regex: "john", $options: "i" } })

# m - Multiline (^ and $ match line boundaries)
db.articles.find({
  content: { $regex: "^Important", $options: "m" }
})

# s - Dotall (. matches newlines)
db.documents.find({
  text: { $regex: "start.*end", $options: "s" }
})

# x - Verbose (ignore whitespace in pattern)
db.data.find({
  value: { $regex: "pattern\\s+value", $options: "x" }
})
```

### Regex Performance Considerations

```bash
# Use indexes for regex queries when possible
db.users.createIndex({ email: 1 })
db.users.find({ email: { $regex: "^john" } })

# Avoid expensive regex patterns
// Not recommended - matches too much data
db.users.find({ email: { $regex: ".*" } })

// Better - use specific patterns
db.users.find({ email: { $regex: "^[a-z]+@example.com$", $options: "i" } })
```

---

## Data Type Summary Table

| Type | Example | Use Case |
|------|---------|----------|
| String | "John Doe" | Names, emails, descriptions |
| Int32 | 100 | Counts, quantities, ratings |
| Int64 | NumberLong("9223372036854775800") | Large numbers, big IDs |
| Double | 99.99 | Prices, measurements, floats |
| Decimal128 | Decimal128("99.99") | Financial data, precision |
| Boolean | true | Flags, active status |
| Date | new Date() | Timestamps, events |
| ObjectId | ObjectId("507f1f77bcf86cd799439011") | Document IDs |
| Array | ["a", "b", "c"] | Lists, tags, items |
| Embedded Doc | { city: "NYC" } | Nested structures |
| Null | null | Missing values |
| Binary Data | BinData(0, "...") | Files, images, encoded data |
| Regex | { $regex: "pattern" } | Pattern matching |

---

Understanding and properly utilizing MongoDB's data types ensures efficient storage, accurate querying, and reliable data management in your applications.