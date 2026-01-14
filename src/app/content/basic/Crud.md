# CRUD Operations

CRUD stands for Create, Read, Update, and Delete - the four fundamental operations for working with data in MongoDB. This guide covers all the essential methods and operators you need to master MongoDB data manipulation.

## Create Operations

Create operations allow you to insert new documents into collections. MongoDB provides multiple methods to insert data.

### insertOne()

Insert a single document into a collection:

```bash
db.users.insertOne({
  name: "John Doe",
  email: "john@example.com",
  age: 28,
  city: "New York",
  joinDate: new Date()
})
```

Response includes the inserted document's `_id`:

```json
{
  "acknowledged": true,
  "insertedId": ObjectId("507f1f77bcf86cd799439011")
}
```

### insertMany()

Insert multiple documents into a collection at once:

```bash
db.products.insertMany([
  {
    name: "Laptop",
    price: 999.99,
    category: "Electronics",
    inStock: true
  },
  {
    name: "Mouse",
    price: 29.99,
    category: "Electronics",
    inStock: true
  },
  {
    name: "Keyboard",
    price: 79.99,
    category: "Electronics",
    inStock: false
  }
])
```

Response includes all inserted `_id` values:

```json
{
  "acknowledged": true,
  "insertedIds": [
    ObjectId("507f1f77bcf86cd799439012"),
    ObjectId("507f1f77bcf86cd799439013"),
    ObjectId("507f1f77bcf86cd799439014")
  ]
}
```

### Insert Options and Write Concerns

Control insertion behavior with options:

```bash
# ordered: true (default) - stops on first error
# ordered: false - continues inserting even if some fail
db.orders.insertMany(
  [
    { orderId: "001", amount: 150 },
    { orderId: "002", amount: 200 },
    { orderId: "001", amount: 175 }  # Duplicate key error
  ],
  { ordered: false }
)
```

**Write Concerns** specify acknowledgment level:

```bash
# w: 1 (default) - acknowledge after write to primary
db.users.insertOne(
  { name: "Alice" },
  { writeConcern: { w: 1 } }
)

# w: "majority" - acknowledge after write to majority of replicas
db.users.insertOne(
  { name: "Bob" },
  { writeConcern: { w: "majority", j: true } }
)

# j: true - acknowledge after journal write
db.users.insertOne(
  { name: "Charlie" },
  { writeConcern: { j: true } }
)
```

---

## Read Operations

Read operations retrieve documents from collections using various query methods and operators.

### find()

Retrieve multiple documents matching a query:

```bash
# Find all documents
db.users.find()

# Find with query filter
db.users.find({ city: "New York" })

# Find with projection (select specific fields)
db.users.find(
  { city: "New York" },
  { name: 1, email: 1, _id: 0 }
)

# Pretty print results
db.users.find().pretty()
```

### findOne()

Retrieve the first document matching a query:

```bash
# Find one document
db.users.findOne({ email: "john@example.com" })

# Find one with projection
db.users.findOne(
  { city: "New York" },
  { name: 1, age: 1 }
)
```

### Query Operators

MongoDB provides comparison operators for filtering documents:

#### Equality Operator ($eq)

```bash
# Find users with age equal to 28
db.users.find({ age: { $eq: 28 } })

# Shorthand (without operator)
db.users.find({ age: 28 })
```

#### Not Equal Operator ($ne)

```bash
# Find users NOT in New York
db.users.find({ city: { $ne: "New York" } })

# Find products with stock != 0
db.products.find({ inStock: { $ne: false } })
```

#### Greater Than Operator ($gt)

```bash
# Find users older than 25
db.users.find({ age: { $gt: 25 } })

# Find products more expensive than $100
db.products.find({ price: { $gt: 100 } })
```

#### Greater Than or Equal Operator ($gte)

```bash
# Find users age 25 and older
db.users.find({ age: { $gte: 25 } })

# Find orders with amount >= $500
db.orders.find({ totalAmount: { $gte: 500 } })
```

#### Less Than Operator ($lt)

```bash
# Find users younger than 30
db.users.find({ age: { $lt: 30 } })

# Find products cheaper than $50
db.products.find({ price: { $lt: 50 } })
```

#### Less Than or Equal Operator ($lte)

```bash
# Find users age 30 and younger
db.users.find({ age: { $lte: 30 } })

# Find orders with amount <= $1000
db.orders.find({ totalAmount: { $lte: 1000 } })
```

#### Combining Comparison Operators

```bash
# Find users between age 25 and 35
db.users.find({
  age: { $gte: 25, $lte: 35 }
})

# Find products priced between $50 and $200
db.products.find({
  price: { $gt: 50, $lt: 200 }
})
```

### Logical Operators

#### AND Operator ($and)

By default, multiple conditions use AND logic:

```bash
# Find users in New York who are older than 25
db.users.find({
  city: "New York",
  age: { $gt: 25 }
})

# Explicit $and operator
db.users.find({
  $and: [
    { city: "New York" },
    { age: { $gt: 25 } },
    { active: true }
  ]
})
```

#### OR Operator ($or)

Find documents matching at least one condition:

```bash
# Find users in New York OR Los Angeles
db.users.find({
  $or: [
    { city: "New York" },
    { city: "Los Angeles" }
  ]
})

# Find premium customers or high-value orders
db.orders.find({
  $or: [
    { isPremium: true },
    { totalAmount: { $gt: 1000 } }
  ]
})
```

#### NOT Operator ($not)

Negate a query condition:

```bash
# Find users NOT in New York
db.users.find({
  city: { $not: { $eq: "New York" } }
})

# Find products that are NOT in stock
db.products.find({
  inStock: { $not: { $eq: true } }
})
```

#### NOR Operator ($nor)

Find documents that match NONE of the conditions:

```bash
# Find users who are neither in New York nor Los Angeles
db.users.find({
  $nor: [
    { city: "New York" },
    { city: "Los Angeles" }
  ]
})

# Find products that are neither expensive nor in low stock
db.products.find({
  $nor: [
    { price: { $gt: 500 } },
    { quantity: { $lt: 10 } }
  ]
})
```

#### Complex Logical Queries

```bash
# Find active users in NYC or LA who are older than 25
db.users.find({
  $and: [
    { active: true },
    { age: { $gt: 25 } },
    { $or: [
      { city: "New York" },
      { city: "Los Angeles" }
    ]}
  ]
})
```

### Cursor Methods

MongoDB returns a cursor object with methods to customize result sets.

#### limit()

Limit the number of documents returned:

```bash
# Get first 5 users
db.users.find().limit(5)

# Get 10 products
db.products.find({ inStock: true }).limit(10)
```

#### skip()

Skip a number of documents (useful for pagination):

```bash
# Skip first 10, get next 5 (page 3 with 5 items per page)
db.users.find().skip(10).limit(5)

# Page calculation: skip = (pageNumber - 1) * pageSize
# Page 1: skip(0).limit(10)
# Page 2: skip(10).limit(10)
# Page 3: skip(20).limit(10)
```

#### sort()

Sort documents in ascending (1) or descending (-1) order:

```bash
# Sort users by age (ascending)
db.users.find().sort({ age: 1 })

# Sort products by price (descending - most expensive first)
db.products.find().sort({ price: -1 })

# Sort by multiple fields
db.orders.find().sort({
  status: 1,        # Pending first, then completed
  createdAt: -1    # Most recent first within each status
})
```

#### Combining Cursor Methods

```bash
# Find, filter, sort, skip, and limit
db.users.find({ active: true })
  .sort({ joinDate: -1 })
  .skip(20)
  .limit(10)

# Pagination example: get page 3 of 10 items per page
db.products.find({ inStock: true })
  .sort({ name: 1 })
  .skip((3 - 1) * 10)
  .limit(10)
```

### Counting Documents

#### count() / countDocuments()

```bash
# Count all documents in collection
db.users.countDocuments()

# Count documents matching a query
db.users.countDocuments({ city: "New York" })

# Count active products
db.products.countDocuments({ inStock: true })

# Count with options (can stop early)
db.users.countDocuments(
  { age: { $gt: 25 } },
  { limit: 100 }
)
```

#### estimatedDocumentCount()

Get estimated count (faster, but approximate):

```bash
# Fast estimate of total documents
db.users.estimatedDocumentCount()
```

---

## Update Operations

Update operations modify existing documents in a collection.

### updateOne()

Update the first document matching a filter:

```bash
# Update single user's city
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $set: { city: "Los Angeles" } }
)

# Update first user with age > 30
db.users.updateOne(
  { age: { $gt: 30 } },
  { $set: { status: "senior" } }
)
```

### updateMany()

Update all documents matching a filter:

```bash
# Update all products in Electronics category
db.products.updateMany(
  { category: "Electronics" },
  { $set: { taxRate: 0.08 } }
)

# Deactivate all users in New York
db.users.updateMany(
  { city: "New York" },
  { $set: { active: false } }
)
```

### replaceOne()

Replace an entire document (except _id):

```bash
# Replace entire user document
db.users.replaceOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    name: "Jane Doe",
    email: "jane@example.com",
    age: 29,
    city: "Boston",
    updatedAt: new Date()
  }
)
```

### Update Operators

#### $set

Set field value (creates field if it doesn't exist):

```bash
# Set single field
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $set: { age: 30 } }
)

# Set multiple fields
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    $set: {
      age: 30,
      city: "Boston",
      status: "active"
    }
  }
)

# Set nested field
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $set: { "address.city": "Boston" } }
)
```

#### $unset

Remove a field from document:

```bash
# Remove single field
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $unset: { middleName: "" } }
)

# Remove multiple fields
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    $unset: {
      tempField: "",
      legacyData: ""
    }
  }
)
```

#### $inc

Increment a numeric field:

```bash
# Increment age by 1
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $inc: { age: 1 } }
)

# Increment by multiple
db.products.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  { $inc: { quantity: -5 } }  # Decrease by 5
)

# Increment multiple fields
db.orders.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439013") },
  {
    $inc: {
      itemCount: 2,
      totalAmount: 150
    }
  }
)
```

#### $mul

Multiply a numeric field:

```bash
# Double the price
db.products.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  { $mul: { price: 2 } }
)

# Apply 10% discount
db.products.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  { $mul: { price: 0.9 } }
)
```

#### $rename

Rename a field:

```bash
# Rename field
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $rename: { "emailAddress": "email" } }
)

# Rename nested field
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $rename: { "address.zipcode": "address.postalCode" } }
)
```

### Array Update Operators

#### $push

Add element(s) to an array:

```bash
# Add single element to array
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $push: { hobbies: "reading" } }
)

# Add multiple elements
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    $push: {
      hobbies: { $each: ["sports", "music", "gaming"] }
    }
  }
)

# Add with position and sort
db.products.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  {
    $push: {
      scores: {
        $each: [85, 90, 88],
        $sort: -1,        # Sort descending
        $slice: 5         # Keep only top 5
      }
    }
  }
)
```

#### $pull

Remove element(s) from an array:

```bash
# Remove specific value
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $pull: { hobbies: "reading" } }
)

# Remove all matching values
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $pull: { tags: { $in: ["old", "deprecated"] } } }
)

# Remove from array of objects
db.orders.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439013") },
  { $pull: { items: { status: "cancelled" } } }
)
```

#### $pop

Remove first (-1) or last (1) element from array:

```bash
# Remove last element
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $pop: { hobbies: 1 } }
)

# Remove first element
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $pop: { hobbies: -1 } }
)
```

#### $addToSet

Add element to array only if it doesn't exist:

```bash
# Add to set (prevents duplicates)
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $addToSet: { hobbies: "reading" } }
)

# Add multiple (removes duplicates from input)
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    $addToSet: {
      hobbies: { $each: ["sports", "music", "sports"] }
    }
  }
)
```

#### Complex Array Updates

```bash
# Update array element by index
db.orders.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439013") },
  { $set: { "items.0.quantity": 5 } }
)

# Update array element by condition
db.orders.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439013"), "items.productId": "001" },
  { $set: { "items.$.quantity": 10 } }
)
```

---

## Delete Operations

Delete operations remove documents from a collection.

### deleteOne()

Delete the first document matching a filter:

```bash
# Delete user by ID
db.users.deleteOne({ _id: ObjectId("507f1f77bcf86cd799439011") })

# Delete first user from New York
db.users.deleteOne({ city: "New York" })

# Delete oldest product
db.products.deleteOne({ createdAt: { $lt: ISODate("2020-01-01") } })
```

### deleteMany()

Delete all documents matching a filter:

```bash
# Delete all inactive users
db.users.deleteMany({ active: false })

# Delete all products out of stock
db.products.deleteMany({ inStock: false })

# Delete all orders from a specific date
db.orders.deleteMany({
  createdAt: {
    $gte: ISODate("2020-01-01"),
    $lt: ISODate("2020-02-01")
  }
})

# Delete all documents (empty filter)
db.users.deleteMany({})
```

### findOneAndDelete()

Find and delete a document, returning the deleted document:

```bash
# Delete and return the deleted user
const deletedUser = db.users.findOneAndDelete(
  { _id: ObjectId("507f1f77bcf86cd799439011") }
)

console.log(deletedUser)

# Delete with projection (return only specific fields)
db.users.findOneAndDelete(
  { email: "old@example.com" },
  { projection: { name: 1, email: 1 } }
)

# Delete with sort (delete highest priority item)
db.tasks.findOneAndDelete(
  { status: "pending" },
  { sort: { priority: -1 } }
)
```

#### Comparison of Delete Methods

| Method | Returns | Use Case |
|--------|---------|----------|
| `deleteOne()` | Confirmation object | Simple deletion, don't need document data |
| `deleteMany()` | Confirmation object | Bulk deletion |
| `findOneAndDelete()` | Deleted document | Need to access deleted document data |

---

## Complete CRUD Example

Here's a practical example combining all CRUD operations:

```bash
# Create - Insert new users
db.users.insertMany([
  { name: "Alice", email: "alice@example.com", age: 28, city: "NY" },
  { name: "Bob", email: "bob@example.com", age: 35, city: "LA" },
  { name: "Charlie", email: "charlie@example.com", age: 22, city: "NY" }
])

# Read - Find users in New York
db.users.find({ city: "NY" })

# Read - Find and sort by age descending
db.users.find().sort({ age: -1 })

# Update - Increase age for users over 30
db.users.updateMany(
  { age: { $gt: 30 } },
  { $inc: { age: 1 } }
)

# Update - Add tags to specific user
db.users.updateOne(
  { name: "Alice" },
  { $push: { tags: "premium" } }
)

# Delete - Remove inactive users
db.users.deleteMany({ active: false })

# Delete and retrieve - Get and remove oldest user
db.users.findOneAndDelete({}, { sort: { age: 1 } })
```

With these CRUD operations mastered, you can perform any data manipulation task in MongoDB effectively and efficiently.