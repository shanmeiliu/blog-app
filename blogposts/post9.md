````markdown id="kq1zjv"
# Distributed Locks with Redis: What Happens If Redis Crashes?

## The Classic Question

In backend system design, distributed locking is a common topic.

A typical implementation uses Redis:
- `SETNX` to acquire a lock  
- expiration time to avoid deadlocks  
- Lua scripts to ensure safe release  

At first glance, this solution seems solid.

But there is a critical edge case:

> If Redis crashes right after acquiring the lock, will the lock be lost?

This question is not about tricks—it tests:
- understanding of distributed systems  
- awareness of failure scenarios  
- trade-offs between consistency and availability  

---

## The Standard (Single-Node) Solution

### Acquiring the Lock

```go
success, err := redisClient.SetNX(ctx, "order_lock:123", "unique_client_id", 10*time.Second).Result()

if success {
    // Lock acquired
    // Execute business logic...

    redisClient.Del(ctx, "order_lock:123")
}
````

### Safe Lock Release with Lua

```lua
-- Only delete the lock if it belongs to the current client
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
```

This works perfectly in a **single-node Redis setup**.

---

## The Hidden Problem: Master-Slave Failover

### Why Locks Can Be Lost

In production, Redis is usually deployed in a **master-slave architecture**.

Key point:

> **Replication between master and slave is asynchronous.**

---

### Failure Scenario

1. Client A acquires lock on **master node**
2. Master has NOT yet replicated the lock to slave
3. Master crashes
4. Sentinel promotes slave → new master
5. New master does NOT have the lock
6. Client B acquires the same lock

---

### Result

* Client A holds the lock
* Client B also holds the lock

➡️ **Two clients execute critical operations simultaneously**

Example:

* Both reduce inventory → overselling

---

### Analogy

* Boss (master) signs a contract
* Secretary (slave) hasn’t been informed
* Boss collapses
* Secretary becomes new boss
* Signs the same contract again

➡️ Chaos

---

## Why This Happens: CAP Trade-off

This issue comes from:

* Redis prioritizing **availability (AP)**
* Not guaranteeing strong consistency

---

## Solutions

There is no perfect solution—only trade-offs.

---

## Solution 1: Redlock (Multi-Node Redis)

Proposed by Redis creator.

### Core Idea

Use multiple independent Redis nodes (e.g., 5 nodes).

### Workflow

1. Record current timestamp
2. Try locking all nodes
3. If majority (N/2 + 1) succeed
4. And total time < TTL → lock acquired

---

### Example Diagram

```
Client
  ↓
[Redis1] ✔
[Redis2] ✔
[Redis3] ✔   → majority achieved
[Redis4] ✖
[Redis5] ✖

→ Lock granted
```

---

### Pros

* Improves reliability
* No reliance on replication

---

### Cons

* Requires multiple independent Redis instances
* Sensitive to clock drift
* Still controversial

---

## Solution 2: Zookeeper / etcd (Strong Consistency)

If correctness is critical:

> Use systems that guarantee **CP (Consistency + Partition Tolerance)**

---

### Advantages

* Strong consistency
* Lock state is never lost
* Leader election ensures correctness

---

### Key Features

* **Ephemeral nodes** → auto-release lock on disconnect
* **Sequential nodes** → ordering guarantees
* **Watch mechanism** → no polling needed

---

### Example Lock Flow

```
Client A → create node /lock/0001
Client B → create node /lock/0002

Client A gets lock
Client B waits

When A releases → B notified
```

---

### Trade-off

* Slower than Redis
* Higher latency

---

## When to Use Each Approach

### Redis Lock (High Performance, Eventually Consistent)

```js
// Suitable for:
// - E-commerce flash sales
// - Idempotency control
// - High-throughput systems

const redisLock = new RedisLock();
```

* Extremely fast
* Rare risk of lock loss
* Can be mitigated with:

  * DB unique constraints
  * reconciliation jobs

---

### Zookeeper / etcd Lock (Strong Consistency)

```js
// Suitable for:
// - Financial transactions
// - Payment systems
// - Critical inventory control

const zkLock = new ZKLock();
```

* Strong guarantees
* No double-lock issue
* Acceptable latency trade-off

---

### Redlock (Rarely Recommended)

```js
// High deployment cost
// Depends on system clock accuracy
```

* Complex setup
* Not widely trusted in production

---

## Key Takeaways

### 1. Understand System Limitations

* Redis replication is asynchronous
* Locks can be lost during failover

---

### 2. No Perfect Solution

* AP systems → high availability, weaker consistency
* CP systems → strong consistency, lower performance

---

### 3. Choose Based on Business Requirements

* Performance-critical → Redis
* Accuracy-critical → Zookeeper / etcd

---

### 4. Always Have Fallback Mechanisms

* Database constraints
* Idempotency checks
* Compensation logic

---

## Final Thoughts

Distributed systems are about trade-offs.

There is no perfect lock—only the most appropriate one for your use case.

Understanding **why locks can be lost** is what separates:

* basic implementation
* from real system design expertise


