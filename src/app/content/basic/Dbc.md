# Database and Collection Basics

## Creating Databases

In MongoDB, databases are created implicitly when you first insert data into a collection. There's no explicit "CREATE DATABASE" command like in traditional SQL databases.

### Implicit Database Creation

When you use the `use` command followed by inserting a document, the database is automatically created:

```bash
mongosh
use mystore
db.customers.insertOne({ name: "Alice Johnson", email: "alice@example.com" })
```

The database `mystore` is now created and contains a `customers` collection with one document.

### Listing All Databases

To see all databases on your MongoDB server:

```bash
show dbs
```

Or using the administrative command:

```bash
db.adminCommand({ listDatabases: 1 })
```

### Switching Between Databases

To switch to an existing database or create a new one:

```bash
use myNewDatabase
```

This command doesn't create the database immediately; it just sets the current context. The database is created when you insert your first document.

### Getting Current Database Information

```bash
# Get current database name
db.getName()

# Get current database statistics
db.stats()

# Get more detailed database info
db.adminCommand({ dbStats: 1 })
```

## Creating Collections

Collections are created implicitly when you insert the first document, or you can create them explicitly with specific options.

### Implicit Collection Creation

Collections are automatically created when you insert data:

```bash
# Switch to database
use ecommerce

# Insert document (creates collection if it doesn't exist)
db.products.insertOne({
  name: "Laptop",
  price: 999.99,
  category: "Electronics",
  inStock: true
})
```

The `products` collection is now created in the `ecommerce` database.

### Explicit Collection Creation

Create a collection with specific options using `createCollection()`:

```bash
# Basic collection creation
db.createCollection("users")

# Collection with validation rules
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["orderId", "customerId", "totalAmount"],
      properties: {
        orderId: { bsonType: "string" },
        customerId: { bsonType: "string" },
        totalAmount: { bsonType: "double" },
        status: { enum: ["pending", "shipped", "delivered"] }
      }
    }
  }
})

# Collection with size limit
db.createCollection("logs", {
  capped: true,
  size: 1000000,
  max: 5000
})
```

### Listing Collections

View all collections in the current database:

```bash
# Show all collections
show collections

# List collections with detailed information
db.getCollectionNames()

# Get collection statistics
db.users.stats()
```

### Viewing Collection Details

```bash
# Get all information about a collection
db.getCollection("users").getFullName()

# Check if collection exists
db.getCollectionNames().includes("users")

# Get total documents in collection
db.users.countDocuments()
```

## Dropping Databases and Collections

### Dropping a Database

To delete an entire database and all its collections:

```bash
# Switch to the database you want to drop
use myDatabase

# Drop the current database
db.dropDatabase()
```

This command removes the database from MongoDB. Use with caution as this operation is irreversible.

### Dropping a Collection

To delete a specific collection from the current database:

```bash
# Drop a collection
db.users.drop()

# Or using explicit command
db.getCollection("users").drop()
```

Both methods remove the collection and all its documents.

### Dropping Specific Documents

Instead of dropping an entire collection, you might want to delete specific documents:

```bash
# Delete one document
db.users.deleteOne({ _id: ObjectId("507f1f77bcf86cd799439011") })

# Delete multiple documents
db.users.deleteMany({ status: "inactive" })

# Delete all documents in a collection (keeps the collection structure)
db.users.deleteMany({})
```

## Database Naming Conventions

Following proper naming conventions makes your MongoDB databases easier to manage and understand.

### Rules for Database Names

- Database names are case-sensitive on Unix/Linux, case-insensitive on Windows
- Cannot contain forward slashes (`/`) or backslashes (`\`)
- Cannot contain null characters (`\0`)
- Should be less than 64 characters long
- Cannot be empty strings
- Reserved names: `admin`, `local`, `config` (system databases)

### Recommended Naming Conventions

**Use lowercase with underscores** for clarity:

```bash
# Good examples
use ecommerce_db
use user_management
use analytics_platform
use social_media_app

# Less ideal
use EcommerceDB          # Mixed case
use ecommerce-db        # Hyphens can be confusing
use Ecommerce_Database  # Mixed case and too verbose
```

**Environment-specific naming**:

```bash
use myapp_development
use myapp_staging
use myapp_production
```

**Project-based naming**:

```bash
use projectname_data
use projectname_analytics
use projectname_cache
```

## Collection Naming Conventions

Collections should be named consistently to reflect the data they contain and follow a clear pattern.

### Rules for Collection Names

- Cannot contain the null character (`\0`)
- Should not start with `system.` (reserved for system collections)
- Cannot contain duplicate field names
- Can use dots (`.`) but generally avoid for clarity
- Should not contain `$` at the start of the name

### Recommended Naming Conventions

**Use lowercase, plural nouns** for clarity:

```bash
# Good examples
db.users               # Collection of user documents
db.products            # Collection of product documents
db.orders              # Collection of order documents
db.customer_reviews    # Multiple words with underscore
db.payment_transactions

# Less ideal
db.User               # Singular, capitalized
db.PRODUCTS           # All caps
db.product_list       # Verbose with unnecessary words
db.data               # Too generic
```

**Hierarchical naming for related collections**:

```bash
# Using dots for logical grouping (optional)
db.user.profile       # User profile data
db.user.settings      # User settings
db.user.preferences   # User preferences

# Or using underscores (more common)
db.user_profiles
db.user_settings
db.user_preferences
```

**Domain-based naming**:

```bash
db.customers
db.invoices
db.shipments
db.support_tickets
db.feedback_comments
```

## Capped Collections

Capped collections are fixed-size collections that maintain insertion order and automatically remove the oldest documents when the size limit is reached. They're useful for logs, cache data, and time-series information.

### Creating Capped Collections

Create a capped collection with a size limit:

```bash
# Create capped collection with size limit (in bytes)
db.createCollection("logs", {
  capped: true,
  size: 5242880          # 5 MB
})

# Create capped collection with document limit
db.createCollection("recent_activity", {
  capped: true,
  size: 1048576,         # 1 MB
  max: 1000              # Maximum 1000 documents
})

# Both size and document limit (whichever limit is reached first)
db.createCollection("system_events", {
  capped: true,
  size: 10485760,        # 10 MB
  max: 5000              # Maximum 5000 documents
})
```

### Characteristics of Capped Collections

- **Fixed size**: Size is allocated upfront and doesn't change
- **FIFO order**: Documents are stored and retrieved in insertion order
- **Automatic deletion**: Old documents are automatically removed when new data exceeds the limit
- **No index removal**: The `_id` index is automatically created
- **Efficient for logs**: Perfect for storing application logs or audit trails

```bash
# Insert documents into capped collection
db.logs.insertOne({
  timestamp: new Date(),
  level: "INFO",
  message: "Application started"
})

# Query capped collection (maintains insertion order)
db.logs.find().sort({ $natural: 1 })  # Ascending order
db.logs.find().sort({ $natural: -1 }) # Descending order (newest first)
```

### Converting to Capped Collections

Convert an existing collection to a capped collection:

```bash
# First, ensure the collection exists with data
use myDatabase

# Convert existing collection to capped
db.runCommand({
  convertToCapped: "myCollection",
  size: 5242880,  # Size in bytes
  max: 1000       # Optional: max documents
})
```

### Use Cases for Capped Collections

- **Application logs**: Store recent application events with automatic cleanup
- **Real-time analytics**: Keep only recent data points
- **Activity streams**: Maintain a feed of user activities
- **Cache data**: Store temporary data that expires by size
- **Audit trails**: Record recent system operations

Example - Logging system:

```bash
# Create capped collection for logs
db.createCollection("app_logs", {
  capped: true,
  size: 52428800,        # 50 MB
  max: 100000            # Keep last 100,000 log entries
})

# Insert log entries
db.app_logs.insertOne({
  timestamp: new Date(),
  service: "auth-service",
  level: "ERROR",
  message: "Authentication failed for user 12345",
  errorCode: "AUTH_001"
})

# Retrieve recent logs (most recent first)
db.app_logs.find().sort({ $natural: -1 }).limit(10)
```

### Checking if Collection is Capped

```bash
# Check collection statistics
db.logs.stats()

# Check isCapped property
db.getCollection("logs").isCapped()
```

### Dropping Capped Collections

Capped collections are dropped the same way as regular collections:

```bash
db.logs.drop()
```

---

With these database and collection basics, you're ready to organize and structure your MongoDB data effectively. Remember to follow naming conventions for consistency and choose the right collection type based on your use case.