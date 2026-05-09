# pgvector vs Milvus vs Qdrant: Filtering, Permissions, and What Actually Matters in Production RAG

When building a real-world RAG system—especially in enterprise environments—**filtering is not a “nice-to-have” feature. It is the foundation of correctness, security, and retrieval quality.**

A common question engineers ask:

> Does `pgvector` support filtering like Milvus or Qdrant?

The short answer is **yes**—but the long answer is where things get interesting.

This article dives deep into:
- How filtering works in `pgvector`
- How it differs from Milvus and Qdrant
- What “pre-filtering” really means at the engine level
- Why this matters for enterprise RAG systems
- Trade-offs you won’t see in most tutorials

---

## 1. Filtering in pgvector: Yes, But Through SQL

`pgvector` runs inside PostgreSQL, so filtering is handled using standard SQL constructs.

```sql
SELECT id, content
FROM documents
WHERE tenant_id = 'tenant_a'
  AND classification <= 2
ORDER BY embedding <-> $1
LIMIT 5;
```

This means:

* You can filter by **any column**
* You can use **joins**
* You can enforce **Row-Level Security (RLS)**
* You can combine structured + semantic queries naturally

### Why This Is Powerful

Unlike standalone vector databases, `pgvector` inherits the full power of PostgreSQL:

* ACID transactions
* Complex joins
* Indexing strategies
* Role-based access control
* Mature query planner

For example, permission-aware retrieval:

```sql
SELECT d.*
FROM document_embeddings e
JOIN document_permissions p ON e.doc_id = p.doc_id
JOIN documents d ON d.id = e.doc_id
WHERE p.user_id = $CURRENT_USER
ORDER BY e.embedding <-> $QUERY_VECTOR
LIMIT 5;
```

This is extremely natural in Postgres—and very difficult to replicate cleanly in most vector-native systems.

---

## 2. The Subtle Problem: Is This True Pre-filtering?

At first glance, this looks like proper pre-filtering.

But the real question is:

> **Does PostgreSQL filter before or after vector similarity search?**

The answer: **it depends on the query plan.**

PostgreSQL’s execution engine decides:

* Whether to apply filters first
* Or perform vector search first and filter afterward

This is very different from systems like Qdrant or Milvus, where filtering is deeply integrated into the vector index itself.

---

## 3. How Vector Databases Handle Filtering

### Qdrant / Milvus Approach

* Filtering is part of the **ANN search algorithm**
* Candidate selection happens **within filtered subsets**
* No unauthorized vectors are ever considered

This is **true pre-filtering at the index level**

### pgvector Approach

* Filtering is part of the **SQL execution plan**
* Vector search may happen before filtering (depending on plan)
* Behavior can resemble **post-filtering under certain conditions**

---

## 4. Why This Difference Matters

### 4.1 Security and Compliance

In strict environments (finance, healthcare):

* **pgvector risk**: vectors may be scanned before filters apply
* **Qdrant/Milvus guarantee**: only authorized vectors are ever considered

This aligns with:

* Principle of least privilege
* Audit requirements

---

### 4.2 Retrieval Quality (Top-K Integrity)

If filtering happens after retrieval:

* Top-K results may include inaccessible documents
* After filtering → fewer usable results

Example:

* Top-K = 5
* Only 40% accessible
* Final usable results = 2

Vector-native filtering avoids this entirely.

---

### 4.3 Performance at Scale

At small scale:

* Difference is negligible

At large scale (millions+ embeddings):

* pgvector may scan more vectors than necessary
* Qdrant/Milvus prune search space early

---

### 4.4 Multi-tenant Isolation

In SaaS or enterprise systems:

* pgvector: relies on SQL filters / RLS
* Qdrant/Milvus: rely on payload filters or partitions

But pgvector has one advantage:

> It supports **true relational permission modeling**

---

## 5. Deep Comparison

| Feature                        | pgvector           | Qdrant                 | Milvus            |
| ------------------------------ | ------------------ | ---------------------- | ----------------- |
| SQL filtering                  | Excellent          | Limited                | Limited           |
| Metadata filtering             | Yes                | Yes                    | Yes               |
| JOIN support                   | Excellent          | No                     | No                |
| Row-level security             | Yes (native)       | No                     | No                |
| Multi-table queries            | Excellent          | Weak                   | Weak              |
| Vector-native filtering engine | Medium             | Strong                 | Strong            |
| ANN filtering efficiency       | Medium             | High                   | High              |
| Pre-filter guarantee           | Not guaranteed     | Guaranteed             | Guaranteed        |
| Operational complexity         | Low                | Medium                 | Medium            |
| Scaling to billions            | Challenging        | Strong                 | Strong            |
| Best use case                  | App-integrated RAG | Vector-heavy workloads | Large-scale infra |

---

## 6. A Hidden Advantage of pgvector: Permission Modeling

Most discussions focus on performance—but miss a critical point:

> **Enterprise RAG is more about permissions than embeddings.**

With pgvector, you can model permissions like this:

```sql
SELECT e.*
FROM embeddings e
JOIN acl a ON e.doc_id = a.doc_id
JOIN user_roles r ON r.user_id = $USER
WHERE a.role_required <= r.level
ORDER BY e.embedding <-> $QUERY
LIMIT 5;
```

This enables:

* Role-based access
* Dynamic permission updates
* Real-time joins with business logic

In contrast, vector databases often require:

* Denormalized metadata
* Precomputed permission fields
* Manual sync pipelines

---

## 7. When pgvector Works Really Well

pgvector shines when:

* You already use PostgreSQL
* Dataset size is moderate (thousands to millions)
* You need complex joins
* Permissions are dynamic
* You want minimal infrastructure

---

## 8. When Qdrant or Milvus Win

Vector-native systems are better when:

* Dataset is very large (10M+ embeddings)
* Latency must be extremely low
* Filtering must be guaranteed pre-index
* Multi-tenant isolation is strict
* ANN recall must remain stable under filtering

---

## 9. The Real Trade-off

This is not just about “does it support filtering.”

It’s about **where filtering happens**:

* **pgvector** → filtering in query layer (flexible, relational)
* **Qdrant/Milvus** → filtering in vector engine (fast, strict)

---

## 10. The Architecture Insight Most People Miss

A lot of engineers think:

> “As long as I have a WHERE clause, I’m safe.”

But in RAG systems:

* Filtering location determines:

  * Security guarantees
  * Retrieval correctness
  * Latency characteristics

This is the difference between:

* Demo-level RAG
* Production-grade RAG

---

## 11. Final Perspective

`pgvector` absolutely supports filtering—and does so with unmatched flexibility.

But it is not a drop-in replacement for vector-native filtering engines.

The decision is not:

> “Which database is better?”

It is:

> “Do I need relational flexibility, or vector-native guarantees?”

In many real-world systems, the answer is:

* Start with pgvector
* Move to Qdrant/Milvus when scale and constraints demand it

---

## TL;DR

* Yes, pgvector supports filtering via SQL
* Filtering is not always index-level pre-filtering
* Qdrant/Milvus provide stronger guarantees for ANN + filtering
* pgvector excels at permission modeling and joins
* The trade-off is flexibility vs performance guarantees

---

**In enterprise RAG, filtering is not just a feature—it’s part of your security model.**

