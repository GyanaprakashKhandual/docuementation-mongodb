# Advanced Troubleshooting

Advanced troubleshooting requires deep understanding of MongoDB internals, system-level tools, and diagnostic techniques. This guide covers professional-grade troubleshooting methodologies used by MongoDB database administrators and developers.

## Core Dump Analysis

Core dumps are snapshots of a process's memory at the time of a crash. Analyzing them reveals the root cause of failures.

### Enabling Core Dumps

```bash
# Check current core dump limit
ulimit -c

# Set unlimited core dumps
ulimit -c unlimited

# Verify setting
ulimit -c
# Output: unlimited

# Make persistent (add to /etc/security/limits.conf)
sudo bash -c 'echo "*  soft  core  unlimited" >> /etc/security/limits.conf'
sudo bash -c 'echo "*  hard  core  unlimited" >> /etc/security/limits.conf'

# Reload limits
sudo sysctl kernel.core_uses_pid=1  # Name core dumps with PID
sudo sysctl kernel.suid_dumpable=2   # Allow core dumps from setuid processes
```

### Generating Core Dumps

```bash
# Start MongoDB with core dump capability
ulimit -c unlimited
./mongod --dbpath=/data/db --logpath=/var/log/mongodb/mongod.log

# If MongoDB crashes, core file is generated
ls -lah /var/crash/
# core.mongod.1234.timestamp

# Force a crash for testing (only in test environment)
# Connect to MongoDB and run
db.adminCommand({ "crashCommand": { } })
```

### Analyzing Core Dumps with GDB

```bash
# Investigate core dump
gdb ./mongod core.mongod.1234

# Once in GDB:
(gdb) bt          # Full backtrace of crash location
(gdb) bt full     # Detailed backtrace with local variables
(gdb) info registers  # CPU register states
(gdb) info threads    # All active threads
(gdb) thread 5        # Switch to thread 5
(gdb) frame 3         # Switch to frame 3
(gdb) print variable  # Print variable value
(gdb) x/10x $rsp      # Examine memory at stack pointer
(gdb) disassemble     # Disassemble current function
```

### Backtrace Interpretation

```bash
# Example backtrace analysis
(gdb) bt
#0  0x00007ffff7a05277 in __GI_raise (sig=sig@entry=6) at ../nptl/pthread_raise.c:56
#1  0x00007ffff7a06f42 in __GI_abort () at abort.c:89
#2  0x00007ffff79d4267 in __libc_message (do_abort=do_abort@entry=2, 
    fmt=fmt@entry=0x7ffff7b95310 "*** %s ***: %s terminated\n") at ../sysdeps/posix/libc_fatal.c:196
#3  0x00007ffff7a6b37a in malloc_printerr (str=str@entry=0x7ffff7b93f98 "heap corruption", action=action@entry=2) at malloc.c:5379
#4  0x000055555595c2e4 in (some_mongodb_function) () from ./mongod

# Interpretation:
# - Crash occurred in malloc/heap management
# - Indicates memory corruption or double-free
# - Need to investigate memory allocation in some_mongodb_function
```

### Automated Core Dump Analysis

```bash
#!/bin/bash
# analyze_core.sh

CORE_FILE=$1
MONGOD_BIN=$2

if [ ! -f "$CORE_FILE" ] || [ ! -f "$MONGOD_BIN" ]; then
    echo "Usage: $0 <core_file> <mongod_binary>"
    exit 1
fi

# Run GDB in batch mode
gdb -batch \
    -ex "file $MONGOD_BIN" \
    -ex "core $CORE_FILE" \
    -ex "bt full" \
    -ex "info threads" \
    -ex "info registers" \
    > core_analysis.txt 2>&1

echo "Core dump analysis saved to core_analysis.txt"

# Check for common crash signatures
if grep -q "heap corruption" core_analysis.txt; then
    echo "ALERT: Heap corruption detected!"
fi

if grep -q "segmentation fault" core_analysis.txt; then
    echo "ALERT: Segmentation fault detected!"
fi

if grep -q "assertion failed" core_analysis.txt; then
    echo "ALERT: Assertion failure detected!"
fi
```

### Running Analysis

```bash
# Make script executable
chmod +x analyze_core.sh

# Run analysis
./analyze_core.sh core.mongod.1234 /usr/bin/mongod
```

---

## Memory Leak Investigation

Memory leaks cause gradual memory consumption increase, eventually leading to out-of-memory crashes.

### Detecting Memory Leaks

```bash
# Monitor memory usage over time
watch -n 5 'ps aux | grep mongod | grep -v grep'

# More detailed monitoring
top -p $(pgrep mongod)

# Check resident memory growth
while true; do
  ps aux | grep mongod | grep -v grep | awk '{print strftime("%Y-%m-%d %H:%M:%S"), $6}' >> memory.log
  sleep 60
done
```

### Using Valgrind for Memory Leak Detection

```bash
# Install Valgrind
sudo apt-get install valgrind

# Run MongoDB under Valgrind (WARNING: Very slow)
valgrind \
  --leak-check=full \
  --show-leak-kinds=all \
  --track-origins=yes \
  --log-file=valgrind.log \
  ./mongod --dbpath=/data/db

# After running, check results
grep -A 5 "LEAK SUMMARY" valgrind.log
```

### Valgrind Output Analysis

```
# Example leak report
==12345== LEAK SUMMARY:
==12345==    definitely lost: 1,024 bytes in 10 blocks
==12345==    indirectly lost: 512 bytes in 5 blocks
==12345==    possibly lost: 2,048 bytes in 20 blocks
==12345==    still reachable: 10,240 bytes in 100 blocks
==12345==       suppressed: 0 bytes in 0 blocks
==12345== Reachable blocks (those to which a pointer was found) are not shown.
==12345== To see them, rerun with: --leak-check=full --show-leak-kinds=all

# Interpretation:
# - definitely lost: Real memory leaks that must be fixed
# - indirectly lost: Leaked memory referenced by definitely lost blocks
# - possibly lost: May be leaks or false positives
# - still reachable: Allocated but never freed (might be OK for static data)
```

### Heap Profiling with Google's tcmalloc

```bash
# Install tcmalloc
sudo apt-get install google-perftools libgoogle-perftools-dev

# Compile MongoDB with tcmalloc
cd mongo
python3 buildscripts/scons.py \
  --use-system-tcmalloc \
  --release \
  install

# Run with heap profiling
export HEAPPROFILE=/tmp/heap.prof
export HEAP_PROFILE_ALLOCATION_INTERVAL=104857600  # 100MB interval
./mongod --dbpath=/data/db

# Generate heap profile
pprof ./mongod /tmp/heap.prof.0001.heap

# Interactive commands in pprof
(pprof) top10      # Top 10 memory consumers
(pprof) list function_name  # Line-by-line memory usage
(pprof) web        # Generate graph visualization
```

### Memory Leak Fix Example

```cpp
// BEFORE: Memory leak
class DocumentCache {
private:
    std::vector<Document*> _cache;
    
public:
    void addDocument(Document* doc) {
        _cache.push_back(doc);  // Takes ownership but doesn't delete
    }
    
    ~DocumentCache() {
        // Memory leak: never deletes documents
        _cache.clear();
    }
};

// AFTER: Fixed with smart pointers
class DocumentCache {
private:
    std::vector<std::unique_ptr<Document>> _cache;
    
public:
    void addDocument(std::unique_ptr<Document> doc) {
        _cache.push_back(std::move(doc));  // Smart pointer manages lifetime
    }
    
    ~DocumentCache() {
        // Automatic cleanup via unique_ptr
    }
};
```

---

## CPU Profiling

CPU profiling identifies performance bottlenecks and hot code paths.

### Using Linux Perf

```bash
# Install perf
sudo apt-get install linux-tools-common

# Record performance data (10 seconds)
sudo perf record -F 99 -p $(pgrep mongod) -g -- sleep 10

# Generate report
sudo perf report

# Top functions by CPU time
sudo perf top -p $(pgrep mongod)

# Flamegraph generation
sudo perf record -F 99 -p $(pgrep mongod) -g -- sleep 30
sudo perf script > out.perf

# Install flamegraph tools
git clone https://github.com/brendangregg/FlameGraph.git
cd FlameGraph

# Generate flamegraph
./stackcollapse-perf.pl out.perf > out.folded
./flamegraph.pl out.folded > perf.svg
# Open perf.svg in browser
```

### CPU Profiling with Google's pprof

```bash
# Compile with profiling support
cd mongo
python3 buildscripts/scons.py \
  --enable-cpu-profiler \
  --release \
  install

# Run with CPU profiling
export CPUPROFILE=/tmp/cpu.prof
./mongod --dbpath=/data/db

# Generate profile (while mongod is running)
pprof ./mongod /tmp/cpu.prof

# Interactive commands
(pprof) top10           # Top 10 CPU consumers
(pprof) list function   # Function breakdown
(pprof) web             # Visualization
(pprof) callgrind       # Export to callgrind format

# View with kcachegrind
kcachegrind callgrind.out.mongod
```

### Identifying Hot Paths

```bash
# Record with call stack
sudo perf record -F 99 -p $(pgrep mongod) -g -- sleep 10

# Show call tree
sudo perf report --call-graph=caller

# Show functions called by specific function
sudo perf report -T

# Zoom into specific function
sudo perf record -e cycles:ppu -p $(pgrep mongod) -g
sudo perf report -g graph --symbol-filter=WiredTiger
```

### Performance Regression Analysis

```bash
# Baseline measurement
echo "Taking baseline measurement..."
./baseline_benchmark.sh > baseline.txt

# Apply changes and measure
echo "Testing with changes..."
./baseline_benchmark.sh > modified.txt

# Compare results
diff baseline.txt modified.txt

# Calculate regression percentage
awk '{
  baseline = $1;
  modified = $2;
  if (baseline != 0) {
    regression = ((modified - baseline) / baseline) * 100;
    printf("%.2f%% change\n", regression);
  }
}'
```

---

## Network Packet Analysis

Network packet analysis helps diagnose replication, sharding, and communication issues.

### Capturing Network Traffic with tcpdump

```bash
# Capture MongoDB traffic (port 27017)
sudo tcpdump -i any -n port 27017 -w mongod.pcap

# Capture with filters
sudo tcpdump -i any -n 'tcp port 27017 and host 192.168.1.100' -w mongod.pcap

# Capture with verbose output
sudo tcpdump -i any -n -A port 27017 | grep -A 5 'POST\|GET'

# Real-time packet display
sudo tcpdump -i any -n -X port 27017
```

### Analyzing Captures with Wireshark

```bash
# Install Wireshark
sudo apt-get install wireshark

# Open capture file
wireshark mongod.pcap

# Apply filters in Wireshark GUI
# Filter: tcp.port == 27017
# Filter: ip.src == 192.168.1.100
# Filter: tcp.flags.syn == 1  (connection starts)
```

### Analyzing with tshark (CLI)

```bash
# Summary of traffic
tshark -r mongod.pcap -q -z conv,tcp

# Extract specific packets
tshark -r mongod.pcap -Y 'tcp.port == 27017' -T fields \
  -e ip.src -e ip.dst -e tcp.len

# Follow TCP stream
tshark -r mongod.pcap -z follow,tcp,raw,0

# Statistics
tshark -r mongod.pcap -z tcp_sackopt,tree
tshark -r mongod.pcap -z io,stat,1

# Latency analysis
tshark -r mongod.pcap -Y 'tcp.port == 27017' \
  -T fields -e frame.time_relative -e tcp.seq
```

### Protocol Analysis Script

```bash
#!/bin/bash
# analyze_network.sh

PCAP_FILE=$1

if [ ! -f "$PCAP_FILE" ]; then
    echo "Usage: $0 <pcap_file>"
    exit 1
fi

echo "=== Network Analysis Report ==="
echo "File: $PCAP_FILE"
echo

# Packet statistics
echo "=== Packet Statistics ==="
tshark -r $PCAP_FILE -q -z io,stat,1 | head -20

# Top talkers
echo -e "\n=== Top Conversations ==="
tshark -r $PCAP_FILE -q -z conv,tcp | head -15

# Packet sizes
echo -e "\n=== Packet Size Distribution ==="
tshark -r $PCAP_FILE -T fields -e ip.len | \
  awk '{
    if ($1 < 100) small++; 
    else if ($1 < 1000) medium++; 
    else large++; 
    total++
  }
  END {
    printf "Small (<100B): %d\n", small;
    printf "Medium (100-1000B): %d\n", medium;
    printf "Large (>1000B): %d\n", large;
    printf "Total packets: %d\n", total;
  }'

# Retransmissions
echo -e "\n=== Retransmissions ==="
tshark -r $PCAP_FILE -Y 'tcp.analysis.retransmission' | wc -l

# Errors/issues
echo -e "\n=== Potential Issues ==="
tshark -r $PCAP_FILE -Y 'tcp.analysis.flags' -T fields -e tcp.analysis.flags
```

---

## Replication Lag Troubleshooting

Replication lag occurs when secondary nodes fall behind the primary in applying operations.

### Monitoring Replication Status

```bash
# Connect to MongoDB
mongosh

# Get replica set status
rs.status()

# Detailed output
rs.printStatus()

# Check replication lag
db.printReplicationInfo()

# Check oplog
db.getReplicationInfo()

# Find slowest secondary
rs.status().members.forEach(member => {
  if (member.state != 1) {  // Not primary
    const lag = member.lastHeartbeat ? 
      member.optimeDate - member.lastHeartbeatRecv : 
      null;
    console.log(`${member.name}: ${lag}ms lag`);
  }
});
```

### Identifying Bottlenecks

```javascript
// Find slow operations on secondary
use admin
db.setProfilingLevel(1, { slowms: 100 })

// Query slow operations
db.system.profile.find({ millis: { $gt: 100 } })
  .sort({ ts: -1 })
  .limit(10)

// Find long-running operations
db.currentOp(true)
  .inprog
  .filter(op => op.secs_running > 10)
  .forEach(op => print(op.op, op.millis));

// Monitor oplog application
db.adminCommand({ "whatsmyuri": 1 })
```

### Fixing Replication Lag

```bash
# 1. Increase oplog size (requires restart)
mongod --replSet rs0 --oplogSize 50000  # 50GB

# 2. Optimize secondary performance
# Add indexes on secondary to match primary
# Reduce competing read load on secondary

# 3. Resync if too far behind
# Connect to secondary
use admin

# Remove from set
rs.remove("secondary:27017")

# Let it catch up (can take hours)

# 4. Full resync (last resort)
# Delete data directory on secondary
sudo rm -rf /data/db

# Let it resync from primary
```

### Monitoring Script

```bash
#!/bin/bash
# monitor_replication.sh

MONGO_HOST="localhost:27017"
INTERVAL=10

while true; do
  echo "=== $(date) ==="
  
  mongosh --host $MONGO_HOST --eval '
    rs.status().members.forEach(m => {
      if (m.state != 1) {
        const lag = m.optimeDate ? 
          (new Date() - m.optimeDate) / 1000 : "unknown";
        console.log(m.name + " lag: " + lag + "s");
      }
    });
  '
  
  echo "---"
  sleep $INTERVAL
done
```

---

## Crash Recovery Procedures

When MongoDB crashes, proper recovery procedures are essential to restore data integrity.

### Immediate Actions After Crash

```bash
# 1. Check MongoDB logs
tail -100 /var/log/mongodb/mongod.log

# 2. Look for error messages
grep -i "error\|fatal\|panic" /var/log/mongodb/mongod.log | tail -20

# 3. Check system logs
sudo journalctl -u mongod -n 50

# 4. Verify data directory integrity
ls -la /data/db/

# 5. Check disk space
df -h /data/

# 6. Check file permissions
ls -la /data/db/mongod.lock
```

### Checking WiredTiger Integrity

```bash
# Check WiredTiger journal
ls -la /data/db/journal/

# Verify checkpoint consistency
./mongod --dbpath=/data/db --checkpointPath=/data/db/checkpoint

# Run repair (data loss possible)
./mongod --repair --dbpath=/data/db

# This creates a backup
ls /data/db/backup*
```

### Recovery Process

```bash
# 1. Stop all MongoDB instances
sudo systemctl stop mongod

# 2. Backup data directory
cp -r /data/db /data/db.backup

# 3. Start MongoDB in repair mode
./mongod --repair --dbpath=/data/db --logpath=/var/log/mongod-repair.log

# 4. Monitor repair progress
tail -f /var/log/mongod-repair.log

# 5. Wait for repair to complete
# This may take hours for large databases

# 6. Restart MongoDB normally
sudo systemctl start mongod

# 7. Verify data integrity
mongosh
db.adminCommand({ "dbcheck": 1 })
```

### Replica Set Recovery

```bash
# If primary crashed:
# 1. Other nodes elect new primary
# 2. Check which node became primary
rs.status()

# 3. Bring crashed primary back online
# It will sync from new primary

# If multiple nodes failed:
# 1. Start all nodes
# 2. Primary election occurs automatically
# 3. Check status
rs.status()

# If all nodes failed:
# 1. Start one node in standalone mode
# 2. Run repair
# 3. Start as replica set again
```

### Automated Recovery Monitoring

```bash
#!/bin/bash
# recovery_monitor.sh

LOG_FILE="/var/log/mongodb/mongod.log"
ERROR_PATTERN="fatal|critical|corruption"

# Check for recovery in progress
if grep -q "Starting" $LOG_FILE; then
  echo "Recovery in progress..."
  tail -f $LOG_FILE | grep -E "$ERROR_PATTERN|complete"
fi

# Monitor until recovered
while ! mongosh --eval "db.adminCommand('ping')" 2>/dev/null; do
  echo "Waiting for MongoDB to recover... $(date)"
  sleep 10
done

echo "MongoDB recovered successfully!"
```

---

## Data Corruption Recovery

Data corruption is rare but serious. Recovery requires careful procedures.

### Detecting Corruption

```bash
# Run dbcheck command
mongosh
db.adminCommand({ "dbcheck": 1 })

# Check specific collection
db.collection_name.validate({ full: true })

# Look for corruption in logs
grep -i "corruption\|checksum" /var/log/mongodb/mongod.log

# Monitor health
db.adminCommand({ "serverStatus": 1 }).opcounters
```

### Recovery from Backups

```bash
# 1. List available backups
ls -la /backup/

# 2. Choose appropriate backup point
# Preferably before corruption was detected

# 3. Stop MongoDB
sudo systemctl stop mongod

# 4. Restore data
rm -rf /data/db
cp -r /backup/mongod-backup-2024-01-15 /data/db
chown -R mongodb:mongodb /data/db

# 5. Start MongoDB
sudo systemctl start mongod

# 6. Verify data
mongosh
db.adminCommand({ "dbcheck": 1 })
```

### Point-in-Time Recovery (Replica Set)

```bash
# If using MongoDB 4.2+
# 1. Check oplog range
db.getReplicationInfo()

# 2. Find timestamp before corruption
# Use oplog to determine when corruption occurred

# 3. Restore to specific point in time
use admin
db.adminCommand({
  "replSetResync": 1,
  "beforeDate": new Date("2024-01-15T10:00:00Z")
})

# 4. Monitor sync progress
rs.status()
```

### Partial Collection Recovery

```javascript
// If only specific collection is corrupted

// 1. Export good data from backup
use admin
db.backup.collection.find({}).forEach(doc => {
  db.main.collection.insertOne(doc);
});

// 2. Rebuild indexes
db.main.collection.reIndex();

// 3. Verify integrity
db.main.collection.validate({ full: true });
```

---

## Performance Regression Analysis

Identifying performance regressions is crucial for maintaining system stability.

### Establishing Baseline Metrics

```bash
#!/bin/bash
# baseline.sh

RESULTS_FILE="baseline_$(date +%s).txt"

echo "Establishing baseline metrics..."

# Test 1: Insert performance
echo "=== Insert Performance ===" >> $RESULTS_FILE
time mongosh --eval '
  for (let i = 0; i < 100000; i++) {
    db.test.insertOne({ num: i, timestamp: new Date() });
  }
' >> $RESULTS_FILE 2>&1

# Test 2: Read performance
echo "=== Read Performance ===" >> $RESULTS_FILE
time mongosh --eval '
  for (let i = 0; i < 100; i++) {
    db.test.find({ num: { $gt: 50000 } }).toArray();
  }
' >> $RESULTS_FILE 2>&1

# Test 3: Update performance
echo "=== Update Performance ===" >> $RESULTS_FILE
time mongosh --eval '
  db.test.updateMany({}, { $set: { updated: true } });
' >> $RESULTS_FILE 2>&1

# Test 4: Aggregation performance
echo "=== Aggregation Performance ===" >> $RESULTS_FILE
time mongosh --eval '
  db.test.aggregate([
    { $match: { num: { $gt: 50000 } } },
    { $group: { _id: null, count: { $sum: 1 } } }
  ]).toArray();
' >> $RESULTS_FILE 2>&1

echo "Baseline saved to $RESULTS_FILE"
```

### Comparing Performance

```bash
#!/bin/bash
# compare_performance.sh

BASELINE=$1
CURRENT=$2

if [ ! -f "$BASELINE" ] || [ ! -f "$CURRENT" ]; then
    echo "Usage: $0 <baseline_file> <current_file>"
    exit 1
fi

# Extract timing information
baseline_time=$(grep "real" $BASELINE | awk '{print $2}')
current_time=$(grep "real" $CURRENT | awk '{print $2}')

# Calculate regression
if [ ! -z "$baseline_time" ] && [ ! -z "$current_time" ]; then
    regression=$(bc <<< "scale=2; (($current_time - $baseline_time) / $baseline_time) * 100")
    echo "Performance regression: ${regression}%"
    
    if (( $(echo "$regression > 10" | bc -l) )); then
        echo "WARNING: Significant regression detected!"
    fi
fi
```

### Continuous Performance Monitoring

```bash
#!/bin/bash
# continuous_monitor.sh

METRICS_DIR="./metrics"
mkdir -p $METRICS_DIR

while true; do
    TIMESTAMP=$(date +%s)
    METRICS_FILE="$METRICS_DIR/metrics_$TIMESTAMP.json"
    
    # Collect metrics
    mongosh --eval "
    let stats = db.adminCommand({ 'serverStatus': 1 });
    let timestamp = new Date();
    
    printjson({
      timestamp: timestamp,
      opcounters: stats.opcounters,
      memory: stats.mem,
      locks: stats.locks,
      connections: stats.connections
    });
    " > $METRICS_FILE 2>/dev/null
    
    # Check for anomalies
    current_ops=$(mongosh --eval "db.currentOp(true).inprog.length" 2>/dev/null)
    if [ "$current_ops" -gt 100 ]; then
        echo "ALERT: High number of operations ($current_ops) at $(date)"
    fi
    
    sleep 60
done
```

### Root Cause Analysis Framework

```bash
#!/bin/bash
# rca_framework.sh

echo "=== Root Cause Analysis Framework ==="

# 1. Establish timeline
echo "Step 1: Establish timeline of event"
echo "When was performance degradation first noticed?"
read noticed_time

# 2. Gather system metrics
echo "Step 2: Collecting system metrics..."
vmstat 1 5 > vmstat.txt
iostat -x 1 5 > iostat.txt
top -b -n 1 > top.txt

# 3. Gather MongoDB metrics
echo "Step 3: Collecting MongoDB metrics..."
mongosh --eval '
  db.adminCommand({ serverStatus: 1 })
' > server_status.json

# 4. Analyze logs
echo "Step 4: Analyzing MongoDB logs..."
grep -i "slow\|error\|warning" /var/log/mongodb/mongod.log > error_log.txt

# 5. Compare to baseline
echo "Step 5: Comparing to baseline..."
echo "Baseline metrics available in:"
echo "- vmstat.txt"
echo "- iostat.txt"
echo "- server_status.json"

# 6. Generate report
echo "Step 6: Generating RCA report..."
cat > rca_report.txt <<EOF
=== Root Cause Analysis Report ===
Date: $(date)
Noticed at: $noticed_time

System Metrics: See vmstat.txt, iostat.txt, top.txt
MongoDB Status: See server_status.json
Error Analysis: See error_log.txt

Next Steps:
1. Identify resource bottleneck (CPU/Memory/IO)
2. Check query plans in slow query log
3. Review recent code/configuration changes
4. Consider horizontal scaling if needed
EOF

echo "RCA report generated: rca_report.txt"
```

---

## Troubleshooting Checklist

When facing performance or stability issues:

### Immediate Diagnostics
- [ ] Check MongoDB logs for errors
- [ ] Verify disk space availability
- [ ] Check system resource usage (CPU, memory, IO)
- [ ] Verify network connectivity
- [ ] Test basic MongoDB operations

### Deep Dive Analysis
- [ ] Review slow query logs
- [ ] Analyze query plans
- [ ] Check index usage
- [ ] Monitor replication lag
- [ ] Profile CPU and memory

### Data Integrity
- [ ] Run dbcheck command
- [ ] Validate collections
- [ ] Check oplog consistency
- [ ] Verify backups are current
- [ ] Test recovery procedures

### Resolution
- [ ] Apply MongoDB patches
- [ ] Optimize queries or indexes
- [ ] Adjust configuration parameters
- [ ] Scale resources if needed
- [ ] Implement monitoring improvements

Advanced troubleshooting requires patience, systematic approach, and deep understanding of MongoDB internals. Always maintain current backups and test recovery procedures regularly.