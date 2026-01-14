# Replica Sets Basics

Replica sets provide redundancy, high availability, and automatic failover in MongoDB. This comprehensive guide covers replica set concepts, architecture, and setup procedures.

## What is Replication

Replication is the process of synchronizing data across multiple servers to provide data redundancy and high availability.

### Purpose of Replication

```
Benefits of Replication:

1. High Availability
   - Automatic failover if primary goes down
   - Service continues with minimal downtime
   - No manual intervention needed

2. Data Redundancy
   - Multiple copies of data across servers
   - Protection against data loss
   - Geographic distribution possible

3. Load Balancing
   - Read operations distributed to secondaries
   - Reduces load on primary
   - Improves read performance

4. Disaster Recovery
   - Data exists on multiple nodes
   - Can recover from hardware failures
   - Backup nodes available
```

### How Replication Works

```bash
# Basic replication flow:

1. Client writes to Primary
   Client → Primary (mongod)
   
2. Primary writes to oplog
   Primary writes operation to its oplog
   
3. Secondaries pull from oplog
   Secondary1 ← oplog sync
   Secondary2 ← oplog sync
   
4. Secondaries apply operations
   Secondary1 applies operations
   Secondary2 applies operations
   
5. Data synchronized across replica set
   All nodes now have consistent data
```

### Synchronization Process

```bash
# Oplog (operation log)
db.local.oplog.rs.find().pretty()

# Output example:
{
  ts: Timestamp(1705334400, 1),
  t: Long("1"),
  h: Long("1234567890"),
  v: 2,
  op: "i",  // Operation: insert
  ns: "mydb.users",
  o: { _id: ObjectId(), name: "John" }
}

{
  ts: Timestamp(1705334401, 2),
  t: Long("1"),
  h: Long("1234567891"),
  v: 2,
  op: "u",  // Operation: update
  ns: "mydb.users",
  o2: { _id: ObjectId() },
  o: { $set: { email: "john@example.com" } }
}
```

---

## Replica Set Architecture

A replica set is a group of MongoDB instances that maintain the same data set.

### Replica Set Components

```
Replica Set Structure:

┌─────────────────────────────────────────────┐
│          Replica Set: "rs0"                 │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   PRIMARY    │  │  SECONDARY   │        │
│  │ (Port 27017) │  │ (Port 27018) │        │
│  │              │  │              │        │
│  │ - Accepts    │  │ - Replicates │        │
│  │   writes     │  │   from oplog │        │
│  │ - Syncs      │  │ - Reads OK   │        │
│  │   oplog      │  │ - No writes  │        │
│  └──────────────┘  └──────────────┘        │
│         ↓                  ↓                │
│      oplog sync         oplog apply        │
│                                             │
│  ┌──────────────┐                          │
│  │  SECONDARY   │                          │
│  │ (Port 27019) │                          │
│  │              │                          │
│  │ - Replicates │                          │
│  │   from oplog │                          │
│  │ - Reads OK   │                          │
│  └──────────────┘                          │
│                                             │
└─────────────────────────────────────────────┘
```

### Replica Set Members

```bash
# Member roles and states:

PRIMARY
- Accepts all read and write operations
- Only one primary at a time
- Writes to oplog
- Elected by replica set

SECONDARY
- Replicates from primary
- Cannot accept writes (read-only)
- Can serve reads with read preference
- Automatically becomes primary if needed

ARBITER
- Doesn't store data
- Participates in elections only
- Breaks ties in voting
- Lowest resource usage

HIDDEN MEMBER
- Replicates data but not visible to application
- Cannot be elected primary
- Can serve reads with explicit read preference
- Good for backups or analytics
```

### Replica Set Status

```bash
# Get replica set status
rs.status()

# Output:
{
  set: "rs0",
  date: ISODate("2024-01-15T10:30:00Z"),
  myState: 1,  // 1 = PRIMARY
  members: [
    {
      _id: 0,
      name: "localhost:27017",
      health: 1,  // 1 = healthy
      state: 1,   // 1 = PRIMARY
      stateStr: "PRIMARY",
      uptime: 3600,
      optime: { ts: Timestamp(...), t: Long("1") },
      optimeDate: ISODate("2024-01-15T10:30:00Z"),
      lastHeartbeat: ISODate("2024-01-15T10:30:00Z"),
      lastHeartbeatRecv: ISODate("2024-01-15T10:30:00Z")
    },
    {
      _id: 1,
      name: "localhost:27018",
      health: 1,
      state: 2,   // 2 = SECONDARY
      stateStr: "SECONDARY",
      uptime: 3000,
      optime: { ts: Timestamp(...), t: Long("1") },
      optimeDate: ISODate("2024-01-15T10:29:50Z"),
      lastHeartbeat: ISODate("2024-01-15T10:30:00Z"),
      lastHeartbeatRecv: ISODate("2024-01-15T10:30:00Z")
    }
  ]
}
```

---

## Primary and Secondary Nodes

Understanding node roles is crucial for replica set operation.

### Primary Node Responsibilities

```bash
# Primary node functions:

1. Accepts all writes
db.users.insertOne({ name: "John" })  // Goes to primary

2. Writes to oplog
# Automatically maintains operational log of all changes

3. Replicates to secondaries
# Primary sends oplog entries to all secondaries

4. Elections
# Participates in primary election if current primary fails

5. Configuration
# Manages replica set configuration and members
```

### Primary Operations

```bash
# Connect to primary and perform operations
mongodb://primary:27017

# Write operations on primary
db.accounts.updateOne(
  { _id: 1 },
  { $inc: { balance: 100 } }
)

# All writes go to primary first
db.orders.insertOne({
  customerId: 1,
  amount: 500,
  status: "pending"
})

# Oplog entry created for each operation
# Secondaries replicate from oplog
```

### Secondary Node Responsibilities

```bash
# Secondary node functions:

1. Replicates from primary
# Continuously pulls new oplog entries

2. Applies operations
# Applies all operations to local copy of data

3. Accepts reads (configurable)
# Can serve read operations with read preference

4. Maintains consistency
# Stays synchronized with primary

5. Backup capability
# Maintains full data copy for failover
```

### Secondary Operations

```bash
# Secondary replication
rs.status().members[1]  // Secondary info

# Secondary is read-only
db.users.insertOne({ name: "Jane" })  // ERROR on secondary
# MongoError: not master and slaveOk=false

# With read preference, can read from secondary
const secondaryConnection = new MongoClient(
  "mongodb://...",
  { readPreference: "secondary" }
)

db.users.find()  // Reads from secondary

# Can lag behind primary slightly
db.hello()  // Check replication status
```

### Data Synchronization

```bash
# How secondaries stay synchronized:

1. Initial Sync (first time joining)
   - Secondary copies all data from primary
   - Creates indexes
   - Downloads oplog

2. Oplog Replication (ongoing)
   - Polls primary for new oplog entries
   - Applies operations in order
   - Maintains exact copy of data

3. Heartbeat Check
   - Every 2 seconds by default
   - Verifies primary is healthy
   - Coordinates elections if needed
```

---

## Automatic Failover

MongoDB automatically handles primary failures with minimal downtime.

### Failover Process

```
Failover Sequence:

1. Primary Failure
   Primary node crashes or becomes unreachable
   
2. Heartbeat Timeout
   Secondaries notice missing heartbeat (~10 seconds)
   
3. Election Triggered
   Secondaries initiate election process
   
4. Voting
   Each member votes for new primary
   Majority required to elect
   
5. New Primary Elected
   Member with newest data elected
   Other secondaries reconfigure
   
6. Service Resumes
   Applications reconnect to new primary
   Write operations resume
   Replication continues
```

### Failover in Action

```bash
# Before failover
rs.status()
# Primary: localhost:27017 (state: PRIMARY)
# Secondary 1: localhost:27018 (state: SECONDARY)
# Secondary 2: localhost:27019 (state: SECONDARY)

# Primary crashes...

# During failover (10-30 seconds)
# Status unknown, elections happening

# After failover
rs.status()
# New Primary: localhost:27018 (state: PRIMARY)
# Secondary 1: localhost:27017 (state: SECONDARY, recovering)
# Secondary 2: localhost:27019 (state: SECONDARY)

# Application automatically fails over
# No manual intervention needed
```

### Failover Time Calculation

```bash
# Failover time breakdown:

1. Detection
   - Heartbeat timeout: ~10 seconds
   
2. Election
   - Voting and consensus: ~10-30 seconds
   - Depends on network latency
   
3. Reconnection
   - Application driver reconnection: ~5 seconds
   - Automatic with proper connection string
   
Total: ~25-45 seconds typical
```

### Failover with Arbiter

```bash
# Replica set with arbiter for faster elections

# Configuration with 3 members
{
  _id: "rs0",
  members: [
    { _id: 0, host: "primary:27017" },
    { _id: 1, host: "secondary:27018" },
    { _id: 2, host: "arbiter:27019", arbiterOnly: true }
  ]
}

# Benefits:
# - Arbiter breaks ties in voting
# - Faster election (no data transfer to arbiter)
# - Lower resource usage
# - Only 2 full data nodes needed for redundancy
```

---

## Read Preference

Read preference controls where read operations are sent.

### Read Preference Modes

```bash
# PRIMARY (default)
# - All reads go to primary
# - Most consistent data
# - Single point of failure for reads

const client = new MongoClient(uri, {
  readPreference: "primary"
})

db.users.find()  // Reads from primary only

---

# PRIMARY_PREFERRED
# - Reads from primary if available
# - Falls back to secondaries if primary down
# - Minimal consistency degradation

const client = new MongoClient(uri, {
  readPreference: "primaryPreferred"
})

db.users.find()  // Primary if available, else secondary

---

# SECONDARY
# - All reads go to secondaries only
# - Distributes read load
# - May see stale data (replication lag)

const client = new MongoClient(uri, {
  readPreference: "secondary"
})

db.users.find()  // Never from primary

---

# SECONDARY_PREFERRED
# - Reads from secondaries if available
# - Falls back to primary if no secondaries
# - Good load balancing with fallback

const client = new MongoClient(uri, {
  readPreference: "secondaryPreferred"
})

db.users.find()  // Secondary if available, else primary

---

# NEAREST
# - Reads from member with lowest latency
# - Best for multi-region deployments
# - Balanced load distribution

const client = new MongoClient(uri, {
  readPreference: "nearest"
})

db.users.find()  // Fastest responding member
```

### Connection String Read Preference

```bash
# Specify read preference in connection string

mongodb://host1:27017,host2:27018,host3:27019/?readPreference=secondary

mongodb://host1:27017/?readPreference=primaryPreferred

mongodb://host1:27017/?readPreference=nearest&readPreferenceTags=region:us-east
```

### Read Preference with Tags

```bash
# Configure members with tags
db.getSiblingDB("admin").runCommand({
  replSetReconfig: {
    _id: "rs0",
    members: [
      { _id: 0, host: "primary:27017", tags: { region: "us-east" } },
      { _id: 1, host: "secondary1:27018", tags: { region: "us-east" } },
      { _id: 2, host: "secondary2:27019", tags: { region: "us-west" } }
    ]
  }
})

# Read from specific region
const client = new MongoClient(uri, {
  readPreference: "secondary",
  readPreferenceTags: [
    { region: "us-west" }  // Prefer us-west
  ]
})

db.users.find()  // Reads from us-west secondary
```

### Use Cases for Read Preferences

```bash
# PRIMARY - Financial data, strict consistency needed
db.transactions.find()  // Must be current data

# SECONDARY - Analytics, reporting, non-critical reads
db.analytics.find()  // Can tolerate slight delay

# SECONDARY_PREFERRED - Most applications
db.products.find()  // Use secondary if available, primary as fallback

# NEAREST - Multi-region, minimize latency
db.users.find()  // Use geographically closest server
```

---

## Write Concern

Write concern specifies durability guarantees for write operations.

### Write Concern Levels

```bash
# w: 0 (Unacknowledged)
# - No acknowledgment from MongoDB
# - Fastest but no guarantee
# - Not recommended for production

db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: 0 } }
)

---

# w: 1 (Default)
# - Acknowledge after primary writes
# - Default write concern
# - Balanced performance and safety

db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: 1 } }
)

---

# w: "majority"
# - Acknowledge after majority of replicas write
# - Strong durability
# - Slower than w: 1

db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority" } }
)

---

# j: true (Journaled)
# - Acknowledge after journal write
# - Data survives primary restart
# - Can combine with w parameter

db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: 1, j: true } }
)

---

# Combined: w: "majority" + j: true
# - Maximum durability
# - Data replicated and journaled
# - Slowest but safest

db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority", j: true } }
)
```

### Write Concern Connection String

```bash
# Specify write concern in connection string

mongodb://host:27017/?w=majority&j=true

mongodb://host:27017/?writeConcernTimeoutMS=5000&w=1
```

### Write Concern Decision Guide

```bash
# Financial Transactions
db.transactions.insertOne(doc, {
  writeConcern: { w: "majority", j: true }
})
# Must be durable across replicas

# User Data
db.users.insertOne(doc, {
  writeConcern: { w: "majority" }
})
# Want majority but journaling not critical

# Logs/Analytics
db.logs.insertOne(doc, {
  writeConcern: { w: 1 }
})
# Speed important, can tolerate loss of recent data

# Bulk Operations
db.products.insertMany(docs, {
  writeConcern: { w: 1 },
  ordered: false
})
# Balance between throughput and reliability
```

---

## Read Concern

Read concern specifies which data can be read from replicas.

### Read Concern Levels

```bash
# local (default)
# - Read latest data from queried member
# - May include uncommitted writes
# - Fastest, least consistency

db.users.find().readConcern("local")

---

# available
# - Like local but excludes data from unacknowledged writes
# - Data that passed any write concern
# - Default for secondary queries

db.users.find().readConcern("available")

---

# majority
# - Read data written with w: "majority"
# - Data replicated to majority of set
# - Cannot see uncommitted writes

db.users.find().readConcern("majority")

---

# linearizable
# - Strongest read concern
# - Guaranteed to see writes that occurred before read started
# - Blocks on slow primaries
# - Only for single document reads

db.users.findOne({ _id: 1 }).readConcern("linearizable")

---

# snapshot
# - Read from snapshot at specific point in time
# - Consistent view across shards
# - Used in transactions

session.startTransaction({
  readConcern: { level: "snapshot" }
})
db.users.find()
session.commitTransaction()
```

### Read Concern with Transactions

```bash
# Specify read concern in transaction
session = db.getMongo().startSession()

session.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
  readPreference: "primary"
})

try {
  const account = db.accounts.findOne({ _id: 1 }, { session })
  
  if (account.balance >= 100) {
    db.accounts.updateOne(
      { _id: 1 },
      { $inc: { balance: -100 } },
      { session }
    )
  }
  
  session.commitTransaction()
} catch (error) {
  session.abortTransaction()
}
```

---

## Setting Up a Replica Set

Complete guide to creating a replica set.

### Prerequisites

```bash
# Required:
# - MongoDB 4.0 or later
# - 3 or more members recommended
# - Network connectivity between all members
# - Unique hostnames/IPs for each member

# System Requirements:
# - 2GB RAM minimum per member
# - 10GB storage minimum
# - Port 27017 open between members
```

### Starting MongoDB Instances

```bash
# Member 1 (Primary) - Port 27017
mongod --port 27017 \
  --dbpath /data/db1 \
  --replSet rs0 \
  --bind_ip localhost \
  --logpath /var/log/mongodb/mongod1.log

# Member 2 (Secondary) - Port 27018
mongod --port 27018 \
  --dbpath /data/db2 \
  --replSet rs0 \
  --bind_ip localhost \
  --logpath /var/log/mongodb/mongod2.log

# Member 3 (Secondary) - Port 27019
mongod --port 27019 \
  --dbpath /data/db3 \
  --replSet rs0 \
  --bind_ip localhost \
  --logpath /var/log/mongodb/mongod3.log
```

### Initialize Replica Set

```bash
# Connect to any member (primary preferred)
mongosh mongodb://localhost:27017

# Initialize replica set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})

# Output:
# {
#   ok: 1,
#   '$clusterTime': { ... }
# }
```

### Verify Replica Set

```bash
# Check status
rs.status()

# Check configuration
rs.conf()

# Check which node is primary
db.hello()

# View oplog
db.local.oplog.rs.find().tail()
```

### Add Members to Existing Replica Set

```bash
# Connect to primary
mongosh mongodb://localhost:27017

# Add new member
rs.add("localhost:27020")

# Or with configuration
rs.add({
  host: "localhost:27020",
  priority: 2,
  votes: 1
})

# Verify addition
rs.status()
```

### Remove Members

```bash
# Connect to primary
mongosh mongodb://localhost:27017

# Remove member
rs.remove("localhost:27020")

# Or by member ID
rs.remove("rs0_3")

# Verify removal
rs.status()
```

### Configure Replica Set Priority

```bash
# Get current config
const config = rs.conf()

# Modify priority (higher = more likely to be primary)
config.members[0].priority = 3  // High priority
config.members[1].priority = 2  // Medium priority
config.members[2].priority = 1  // Low priority

# Apply configuration
rs.reconfig(config)

# Verify
rs.status()
```

### Create Replica Set with Arbiter

```bash
# Start data members (as before)
mongod --port 27017 --replSet rs0 --dbpath /data/db1
mongod --port 27018 --replSet rs0 --dbpath /data/db2

# Start arbiter (no data directory needed)
mongod --port 27019 --replSet rs0

# Initialize with arbiter
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019", arbiterOnly: true }
  ]
})
```

### MongoDB Atlas Replica Set

```bash
# MongoDB Atlas automatically manages replica sets

# Connection string for Atlas replica set:
mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Automatically configured with:
# - 3-member replica set minimum
# - Automatic failover
# - Read preference options
# - Monitoring and alerts
# - Backup and restore
```

### Backup from Secondary

```bash
# Connect to secondary
mongosh mongodb://localhost:27018

# Backup using mongodump
mongodump \
  --uri="mongodb://localhost:27018" \
  --out=/backup/mongo

# Secondary doesn't interfere with primary
# Primary continues serving writes
```

### Monitoring Replica Set

```bash
# Check replication lag
db.adminCommand({ serverStatus: 1 }).repl.oplog

# Find slowest secondary
rs.status().members.forEach(member => {
  if (member.state !== 1) {  // Not primary
    const lag = member.optimeDate - new Date()
    console.log(`${member.name}: ${lag}ms lag`)
  }
})

# Monitor oplog window
db.local.oplog.rs.stats()

# Long-running operations
db.currentOp()
```

---

## Complete Replica Set Example

```bash
# Setup 3-node replica set on local machine

# Terminal 1: Start primary
mongod --port 27017 --replSet rs0 --dbpath ./data/db1

# Terminal 2: Start secondary 1
mongod --port 27018 --replSet rs0 --dbpath ./data/db2

# Terminal 3: Start secondary 2
mongod --port 27019 --replSet rs0 --dbpath ./data/db3

# Terminal 4: Initialize replica set
mongosh mongodb://localhost:27017

rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017", priority: 2 },
    { _id: 1, host: "localhost:27018", priority: 1 },
    { _id: 2, host: "localhost:27019", priority: 1 }
  ]
})

# Verify status
rs.status()

# Test failover: Kill primary process
# Watch secondaries elect new primary
# Restart old primary as secondary
# System automatically recovers
```

---

Replica sets are essential for production MongoDB deployments, providing high availability, data redundancy, and automatic failover capabilities.