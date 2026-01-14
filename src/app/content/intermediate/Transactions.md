# Transactions

MongoDB transactions provide ACID guarantees for multi-document operations, enabling reliable data consistency across distributed systems. This guide covers transaction fundamentals, implementation patterns, and best practices.

## ACID Properties in MongoDB

ACID (Atomicity, Consistency, Isolation, Durability) are fundamental principles for reliable data management.

### Atomicity

Atomicity ensures that a transaction either completes entirely or not at all. There are no partial updates.

```bash
# Single document atomicity (always atomic)
db.accounts.updateOne(
  { _id: 1 },
  { $inc: { balance: -100 } }
)

# Multi-document transaction (requires explicit transaction)
session = db.getMongo().startSession()
session.startTransaction()

try {
  // All operations succeed or all rollback
  db.accounts.updateOne(
    { _id: 1 },
    { $inc: { balance: -100 } }
  )
  db.accounts.updateOne(
    { _id: 2 },
    { $inc: { balance: 100 } }
  )
  
  session.commitTransaction()
} catch (error) {
  session.abortTransaction()
  throw error
} finally {
  session.endSession()
}
```

**Guarantee:** All-or-nothing execution - partial updates cannot occur.

### Consistency

Consistency ensures that data moves from one valid state to another. Business rules are maintained.

```bash
// Inconsistent without transaction
// Balance transfer: Account A: $500, Account B: $300
// Transfer $100 from A to B

// Bad scenario:
// 1. Debit $100 from A → A: $400 ✓
// 2. System crashes before credit to B ✗
// Result: Total money lost ($400 + $300 = $600)

// With transaction:
session = db.getMongo().startSession()
session.startTransaction()

try {
  db.accounts.updateOne(
    { _id: 1, balance: { $gte: 100 } },  // Verify sufficient funds
    { $inc: { balance: -100 } },
    { session }
  )
  
  db.accounts.updateOne(
    { _id: 2 },
    { $inc: { balance: 100 } },
    { session }
  )
  
  session.commitTransaction()
  // If crash occurs before commit, transaction rolls back
  // Total money preserved: $500 + $300 = $800
} catch (error) {
  session.abortTransaction()
}
```

**Guarantee:** Data remains valid through business rule enforcement.

### Isolation

Isolation ensures transactions don't interfere with each other. Each transaction operates independently.

```bash
// Without isolation (dirty reads)
// Transaction A reads while Transaction B is writing
// Transaction A might see inconsistent data

// With transaction isolation:
session1 = db.getMongo().startSession()
session1.startTransaction({
  readConcern: { level: "snapshot" }
})

session2 = db.getMongo().startSession()
session2.startTransaction({
  readConcern: { level: "snapshot" }
})

// Session 1: Read initial balance
const balance1 = db.accounts.findOne({ _id: 1 }, { session: session1 })

// Session 2: Modify balance (within its transaction)
db.accounts.updateOne(
  { _id: 1 },
  { $inc: { balance: 100 } },
  { session: session2 }
)
session2.commitTransaction()

// Session 1: Still sees original balance (snapshot isolation)
const balance1_after = db.accounts.findOne({ _id: 1 }, { session: session1 })

// Only after session1 commits will it see updated data
session1.commitTransaction()
```

**Guarantee:** Transactions don't see uncommitted changes from other transactions.

### Durability

Durability ensures that committed data persists even after failures.

```bash
session = db.getMongo().startSession()
session.startTransaction({
  writeConcern: { w: "majority", j: true }  // Ensure durability
})

try {
  db.accounts.updateOne(
    { _id: 1 },
    { $inc: { balance: -100 } },
    { session }
  )
  
  db.accounts.updateOne(
    { _id: 2 },
    { $inc: { balance: 100 } },
    { session }
  )
  
  session.commitTransaction()
  // At this point, changes are:
  // 1. Written to all replica set members (w: "majority")
  // 2. Written to journal (j: true)
  // 3. Guaranteed to survive server restart
} catch (error) {
  session.abortTransaction()
}
```

**Guarantee:** Committed changes persist through system failures.

---

## Single Document Atomicity

MongoDB guarantees atomicity for operations on a single document, even without explicit transactions.

### Single Document Atomic Operations

```bash
# All document updates are atomic by default
db.users.updateOne(
  { _id: 1 },
  {
    $set: {
      name: "John",
      email: "john@example.com",
      age: 30,
      status: "active"
    }
  }
)

# Field increment is atomic
db.counters.updateOne(
  { _id: "page_views" },
  { $inc: { count: 1 } }
)

# Array operations are atomic
db.posts.updateOne(
  { _id: 1 },
  { $push: { comments: { text: "Great post!", author: "Jane" } } }
)
```

**Guarantee:** Each operation completes entirely or not at all.

### When Single Document Atomicity Is Sufficient

```bash
// Good use of single document atomicity
db.users.updateOne(
  { _id: 1 },
  {
    $set: {
      profile: {
        firstName: "John",
        lastName: "Doe",
        avatar: "url"
      },
      settings: {
        theme: "dark",
        notifications: true
      },
      metadata: {
        loginCount: 5,
        lastLogin: new Date()
      }
    }
  }
)

// All related data is updated together atomically
```

### When Multi-Document Transactions Are Needed

```bash
// NOT safe with single document atomicity
// Money could be lost in transfer

// Bad: Without transaction
db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } })
// <- If error here, money is gone
db.accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } })

// Good: With transaction
session = db.getMongo().startSession()
session.startTransaction()

try {
  db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
  db.accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session })
  session.commitTransaction()
} catch (error) {
  session.abortTransaction()
}
```

---

## Multi-Document Transactions

Multi-document transactions extend atomicity across multiple documents and collections.

### Basic Multi-Document Transaction

```bash
# Start session
session = db.getMongo().startSession()

# Start transaction
session.startTransaction()

try {
  // Multiple operations in transaction
  db.accounts.updateOne(
    { _id: 1 },
    { $inc: { balance: -100 } },
    { session }
  )
  
  db.accounts.updateOne(
    { _id: 2 },
    { $inc: { balance: 100 } },
    { session }
  )
  
  // Create transaction record
  db.transactions.insertOne(
    {
      _id: ObjectId(),
      from: 1,
      to: 2,
      amount: 100,
      timestamp: new Date(),
      status: "completed"
    },
    { session }
  )
  
  // Commit all changes
  session.commitTransaction()
  
} catch (error) {
  // Rollback all changes if error
  session.abortTransaction()
  throw error
  
} finally {
  // Always end session
  session.endSession()
}
```

### Transaction Across Collections

```bash
session = db.getMongo().startSession()
session.startTransaction()

try {
  // Operation 1: Update order
  db.orders.updateOne(
    { _id: ObjectId() },
    {
      $set: { status: "completed" },
      $inc: { totalAmount: 50 }
    },
    { session }
  )
  
  // Operation 2: Update inventory
  db.inventory.updateOne(
    { productId: ObjectId() },
    { $inc: { stock: -5 } },
    { session }
  )
  
  // Operation 3: Update customer
  db.customers.updateOne(
    { _id: ObjectId() },
    { $inc: { totalSpent: 50 } },
    { session }
  )
  
  // Operation 4: Insert transaction log
  db.logs.insertOne(
    { action: "order_completed", orderId: ObjectId(), timestamp: new Date() },
    { session }
  )
  
  session.commitTransaction()
  
} catch (error) {
  session.abortTransaction()
  throw error
  
} finally {
  session.endSession()
}
```

### Complex Transaction Logic

```bash
session = db.getMongo().startSession()
session.startTransaction()

try {
  // Step 1: Check preconditions
  const sourceAccount = db.accounts.findOne(
    { _id: 1 },
    { session }
  )
  
  if (sourceAccount.balance < 100) {
    throw new Error("Insufficient funds")
  }
  
  // Step 2: Perform updates
  db.accounts.updateOne(
    { _id: 1 },
    { $inc: { balance: -100 } },
    { session }
  )
  
  db.accounts.updateOne(
    { _id: 2 },
    { $inc: { balance: 100 } },
    { session }
  )
  
  // Step 3: Record transaction
  db.transactions.insertOne(
    {
      from: 1,
      to: 2,
      amount: 100,
      timestamp: new Date(),
      status: "completed"
    },
    { session }
  )
  
  session.commitTransaction()
  
} catch (error) {
  session.abortTransaction()
  console.error("Transaction failed:", error.message)
  throw error
  
} finally {
  session.endSession()
}
```

---

## Starting and Committing Transactions

Proper transaction lifecycle management is crucial for reliability.

### Starting a Transaction

```bash
# Create session
session = db.getMongo().startSession()

# Start transaction on session
session.startTransaction()

// Perform operations with session
db.collection.updateOne({ ... }, { session })

# Commit transaction
session.commitTransaction()

# End session
session.endSession()
```

### Transaction Options

```bash
# Start transaction with options
session.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority", j: true },
  readPreference: "primary",
  maxCommitTimeMS: 30000  // Transaction timeout
})

try {
  // Perform operations
  db.collection.updateOne({ ... }, { session })
  session.commitTransaction()
} catch (error) {
  session.abortTransaction()
} finally {
  session.endSession()
}
```

### Automatic Retry

```bash
# Wrap transaction in retry logic
async function transferMoney(fromId, toId, amount) {
  const maxRetries = 3
  let retries = 0
  
  while (retries < maxRetries) {
    try {
      const session = db.getMongo().startSession()
      session.startTransaction()
      
      try {
        db.accounts.updateOne(
          { _id: fromId },
          { $inc: { balance: -amount } },
          { session }
        )
        
        db.accounts.updateOne(
          { _id: toId },
          { $inc: { balance: amount } },
          { session }
        )
        
        session.commitTransaction()
        return true  // Success
        
      } catch (error) {
        session.abortTransaction()
        throw error
        
      } finally {
        session.endSession()
      }
      
    } catch (error) {
      retries++
      
      if (error.hasErrorLabel("TransientTransactionError")) {
        // Retry on transient errors
        console.log(`Retry ${retries}/${maxRetries}`)
        continue
      } else {
        // Don't retry on other errors
        throw error
      }
    }
  }
  
  throw new Error(`Transaction failed after ${maxRetries} retries`)
}
```

---

## Transaction Rollback

Rollback ensures failed transactions leave no partial changes.

### Explicit Rollback

```bash
session = db.getMongo().startSession()
session.startTransaction()

try {
  // Operation 1
  db.accounts.updateOne(
    { _id: 1 },
    { $inc: { balance: -100 } },
    { session }
  )
  
  // Operation 2 - might fail
  db.accounts.updateOne(
    { _id: 2 },
    { $inc: { balance: 100 } },
    { session }
  )
  
  session.commitTransaction()
  
} catch (error) {
  // Explicit rollback on error
  session.abortTransaction()
  console.error("Transaction rolled back:", error.message)
  
} finally {
  session.endSession()
}
```

### Rollback on Validation Failure

```bash
session = db.getMongo().startSession()
session.startTransaction()

try {
  const transferred = db.accounts.updateOne(
    { _id: 1, balance: { $gte: 100 } },  // Conditional
    { $inc: { balance: -100 } },
    { session }
  )
  
  if (transferred.modifiedCount === 0) {
    throw new Error("Insufficient funds - transaction cannot proceed")
  }
  
  db.accounts.updateOne(
    { _id: 2 },
    { $inc: { balance: 100 } },
    { session }
  )
  
  session.commitTransaction()
  
} catch (error) {
  session.abortTransaction()  // All changes rolled back
  throw error
  
} finally {
  session.endSession()
}
```

### Automatic Rollback on Timeout

```bash
session = db.getMongo().startSession()
session.startTransaction({
  maxCommitTimeMS: 10000  // 10 second timeout
})

try {
  db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
  
  // If this takes > 10 seconds, transaction automatically rolls back
  db.heavy_computation.find({}).forEach(doc => {
    db.results.insertOne(doc, { session })
  })
  
  session.commitTransaction()
  
} catch (error) {
  session.abortTransaction()
  
} finally {
  session.endSession()
}
```

---

## Read and Write Concerns in Transactions

Concerns control how strongly operations are acknowledged.

### Read Concern Levels

```bash
# DEFAULT: Read concern not specified (reads from primary)
session = db.getMongo().startSession()
session.startTransaction()
db.accounts.findOne({ _id: 1 }, { session })

# SNAPSHOT: Read most recent snapshot (strong consistency)
session.startTransaction({
  readConcern: { level: "snapshot" }
})

// Sees data as of transaction start, isolated from other transactions
db.accounts.findOne({ _id: 1 }, { session })

# LOCAL: Read from any replica (weaker consistency)
session.startTransaction({
  readConcern: { level: "local" }
})

db.accounts.findOne({ _id: 1 }, { session })

// For transactions, "snapshot" is preferred
```

### Write Concern Levels

```bash
# w: "majority" - Acknowledge after majority of replicas write
session.startTransaction({
  writeConcern: { w: "majority", j: true }
})

db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
session.commitTransaction()
// Change written to majority + journal

# w: 1 - Acknowledge after primary writes (less safe)
session.startTransaction({
  writeConcern: { w: 1 }
})

db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
session.commitTransaction()

# j: true - Acknowledge after journaling (durability)
session.startTransaction({
  writeConcern: { j: true }
})
```

### Combining Concerns

```bash
# Strong consistency + durability
session = db.getMongo().startSession()
session.startTransaction({
  readConcern: { level: "snapshot" },  // Snapshot isolation
  writeConcern: { w: "majority", j: true }  // Majority + journal
})

try {
  // Strongly consistent reads
  const balance = db.accounts.findOne({ _id: 1 }, { session })
  
  // Durable writes
  db.accounts.updateOne(
    { _id: 1 },
    { $inc: { balance: -100 } },
    { session }
  )
  
  session.commitTransaction()
  
} catch (error) {
  session.abortTransaction()
  
} finally {
  session.endSession()
}
```

---

## Transaction Best Practices

Guidelines for effective transaction usage.

### Keep Transactions Short

```bash
// BAD: Long transaction
session = db.getMongo().startSession()
session.startTransaction()

try {
  // 1. Find and process many documents
  const orders = db.orders.find({ status: "pending" }, { session }).toArray()
  
  // 2. Long computation
  for (let order of orders) {
    const report = computeComplexReport(order)  // Slow operation
    db.reports.insertOne(report, { session })
  }
  
  // 3. More updates
  db.orders.updateMany({ status: "pending" }, { $set: { status: "processing" } }, { session })
  
  session.commitTransaction()
} catch (error) {
  session.abortTransaction()
}
// Locks held too long, impacts other transactions

// GOOD: Short transaction
session = db.getMongo().startSession()
session.startTransaction()

try {
  // Only critical operations in transaction
  db.orders.updateOne(
    { _id: orderId },
    { $set: { status: "processing" } },
    { session }
  )
  
  session.commitTransaction()
  
} catch (error) {
  session.abortTransaction()
}

// Long computation outside transaction
const report = computeComplexReport(order)
db.reports.insertOne(report)  // No session
```

### Use Default Read/Write Concerns

```bash
// GOOD: Use defaults unless specific need
session = db.getMongo().startSession()
session.startTransaction()  // Uses server defaults

try {
  db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
  db.accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session })
  session.commitTransaction()
} catch (error) {
  session.abortTransaction()
}

// ONLY override when necessary
session.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority", j: true }
})
```

### Handle Errors Properly

```bash
async function safeTransaction() {
  const session = db.getMongo().startSession()
  
  try {
    session.startTransaction()
    
    // Perform operations
    db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
    db.accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session })
    
    session.commitTransaction()
    return { success: true }
    
  } catch (error) {
    // Distinguish error types
    if (error.hasErrorLabel("TransientTransactionError")) {
      // Retry transient errors
      return safeTransaction()
    } else if (error.hasErrorLabel("UnknownTransactionCommitResult")) {
      // Commit might have succeeded
      return { success: true, uncertain: true }
    } else {
      // Permanent error
      throw error
    }
    
  } finally {
    // Always end session
    session.endSession()
  }
}
```

### Avoid Common Pitfalls

```bash
// BAD: Forgetting to pass session
session = db.getMongo().startSession()
session.startTransaction()

db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } })
// <- Missing { session } parameter, outside transaction!
db.accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session })

session.commitTransaction()

// GOOD: Always pass session
session = db.getMongo().startSession()
session.startTransaction()

db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
db.accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session })

session.commitTransaction()

---

// BAD: Not handling endSession
session = db.getMongo().startSession()
session.startTransaction()
db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
session.commitTransaction()
// Forgot to call endSession()

// GOOD: Always end session
session = db.getMongo().startSession()

try {
  session.startTransaction()
  db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
  session.commitTransaction()
} catch (error) {
  session.abortTransaction()
} finally {
  session.endSession()  // Always called
}
```

### Transaction Retry Pattern

```bash
async function executeWithRetry(operation, maxRetries = 3) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    const session = db.getMongo().startSession()
    
    try {
      session.startTransaction()
      
      // Execute operation
      const result = await operation(session)
      
      session.commitTransaction()
      return result
      
    } catch (error) {
      session.abortTransaction()
      lastError = error
      
      // Check if retryable
      if (!error.hasErrorLabel("TransientTransactionError")) {
        throw error
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 100)
      )
      
    } finally {
      session.endSession()
    }
  }
  
  throw lastError
}

// Usage
executeWithRetry(async (session) => {
  db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session })
  db.accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session })
  return { success: true }
})
```

### When NOT to Use Transactions

```bash
// Good: Single document update (inherently atomic)
db.users.updateOne(
  { _id: 1 },
  { $set: { name: "John", email: "john@example.com" } }
)
// No need for transaction

// Good: Independent operations
db.users.updateOne({ _id: 1 }, { $inc: { loginCount: 1 } })
db.logs.insertOne({ userId: 1, action: "login" })
// These don't need to be atomic

// Bad: Using transaction when not needed
session = db.getMongo().startSession()
session.startTransaction()
db.users.updateOne({ _id: 1 }, { $inc: { views: 1 } }, { session })  // Unnecessary
session.commitTransaction()
session.endSession()

// Good: Alternative approach (no transaction needed)
db.users.updateOne({ _id: 1 }, { $inc: { views: 1 } })
```

---

## Complete Transaction Example: Banking System

```bash
class BankingSystem {
  async transferFunds(fromAccountId, toAccountId, amount) {
    const session = db.getMongo().startSession()
    
    try {
      session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority", j: true },
        maxCommitTimeMS: 30000
      })
      
      // Step 1: Verify source account has sufficient funds
      const sourceAccount = db.accounts.findOne(
        { _id: fromAccountId },
        { session }
      )
      
      if (!sourceAccount || sourceAccount.balance < amount) {
        throw new Error("Insufficient funds")
      }
      
      // Step 2: Debit source account
      db.accounts.updateOne(
        { _id: fromAccountId },
        {
          $inc: { balance: -amount },
          $push: { transactions: { type: "debit", amount, timestamp: new Date() } }
        },
        { session }
      )
      
      // Step 3: Credit destination account
      db.accounts.updateOne(
        { _id: toAccountId },
        {
          $inc: { balance: amount },
          $push: { transactions: { type: "credit", amount, timestamp: new Date() } }
        },
        { session }
      )
      
      // Step 4: Record transaction
      db.transfers.insertOne(
        {
          _id: ObjectId(),
          from: fromAccountId,
          to: toAccountId,
          amount,
          status: "completed",
          timestamp: new Date()
        },
        { session }
      )
      
      // Step 5: Commit transaction
      session.commitTransaction()
      
      return {
        success: true,
        message: "Transfer completed successfully"
      }
      
    } catch (error) {
      session.abortTransaction()
      
      return {
        success: false,
        error: error.message
      }
      
    } finally {
      session.endSession()
    }
  }
}

// Usage
const banking = new BankingSystem()
const result = banking.transferFunds(
  ObjectId("account1"),
  ObjectId("account2"),
  100
)
```

---

Transactions are powerful tools for maintaining data consistency in MongoDB. Use them judiciously for operations that must succeed or fail together, but avoid over-reliance on transactions for simple operations.