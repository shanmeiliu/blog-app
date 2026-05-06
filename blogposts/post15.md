# *Designing Data-Intensive Applications* — Applied to Modern AI & RAG Systems

Modern AI systems are often framed as “model problems.” In practice, they are **data systems operating under distributed constraints**.

This post applies key ideas from *Designing Data-Intensive Applications* by Martin Kleppmann to real-world AI architectures, especially Retrieval-Augmented Generation (RAG) systems. The goal is not to summarize the book, but to **translate its distributed systems principles into modern AI practice**.

As Kleppmann notes, “Many applications today are data-intensive, as opposed to compute-intensive” (Kleppmann, p. 3). RAG systems are a clear example of this shift.

---

## 1. AI Systems Are Distributed Data Systems

A typical RAG pipeline consists of:

- API layer  
- embedding service  
- vector database  
- retrieval layer  
- LLM  
- streaming response  

This is fundamentally a distributed system.

Kleppmann emphasizes that “the dominant problems are usually the amount of data, the complexity of data, and the speed at which it is changing” (Kleppmann, p. 4).

In RAG:
- **data volume** → documents + embeddings  
- **complexity** → multiple models, metadata, sources  
- **velocity** → ingestion + real-time queries  

---

## 2. Consistency in RAG Is About Semantic Correctness

Consistency in distributed systems is often discussed in terms of visibility and ordering. As the book defines it, “consistency is the idea that all clients see the same data at the same time” (Kleppmann, p. 144).

In RAG systems, inconsistency manifests differently:
- mismatched embeddings  
- incorrect retrieval  
- misleading model outputs  

### Applied Example

Mixing embeddings from different models without strict separation breaks semantic consistency. The system may still function technically, but the meaning of similarity is no longer valid.

Applying principles from *Designing Data-Intensive Applications*:

- Query embeddings must match the same vector space  
- Retrieval must be scoped by model and provider  

This is effectively enforcing **application-level strong consistency**, even if the database itself allows looser guarantees.

---

## 3. Data Contracts Over Model Outputs

A central idea in *Designing Data-Intensive Applications* is the importance of clearly defined data assumptions. Kleppmann writes, “We need to be precise about the assumptions that our system makes about the data” (Kleppmann, p. 28).

LLMs violate assumptions by default—they are probabilistic and non-deterministic.

### Applied Pattern

Instead of exposing raw LLM output:
- validate structure  
- enforce schema  
- normalize before persistence  

This mirrors traditional system design:
- APIs expose stable contracts  
- variability is handled internally  

In practice:
- **LLM = unreliable producer**  
- **backend = contract enforcer**

---

## 4. Re-ingestion as Replication

Replication is a core concept in distributed systems. Kleppmann defines it as “keeping a copy of the same data on multiple machines” (Kleppmann, p. 151).

In RAG systems, the equivalent concept is **re-ingestion**.

When you:
- change embedding models  
- update chunking strategies  
- improve preprocessing  

you are effectively creating a new version of the same knowledge.

### Applied Insight

Without versioning:
- old and new embeddings mix  
- retrieval quality degrades  
- system correctness erodes  

Thus, embeddings should be treated as:
- versioned  
- model-scoped  
- replaceable artifacts  

---

## 5. Indexing Still Follows Classic Trade-offs

Kleppmann describes indexes as “additional structures that are derived from the primary data” (Kleppmann, p. 205).

Vector indexes (e.g., HNSW) follow the same principle.

The trade-offs remain familiar:
- latency vs. accuracy  
- memory vs. performance  
- complexity vs. simplicity  

Even in AI systems, these are not new problems—they are extensions of classic data system design decisions.

---

## 6. Failure in AI Systems Is Subtle

Distributed systems are designed with failure in mind. As Kleppmann notes, “Anything that can go wrong will go wrong” (Kleppmann, p. 296).

In AI systems, failure often appears as:
- confident but incorrect answers  
- degraded retrieval quality  
- partial or inconsistent ingestion  

These are not crashes—they are **silent correctness failures**.

### Applied Practice

- log retrieval inputs and outputs  
- validate ingestion completeness  
- monitor quality signals, not just uptime  

This extends observability from infrastructure to **data correctness and system behavior**.

---

## 7. Streaming and Backpressure in AI Systems

Modern AI applications frequently rely on streaming responses (SSE, WebSockets).

While *Designing Data-Intensive Applications* does not focus on LLMs, its discussion of system behavior under load and failure applies directly. Concepts like flow control, resource management, and system limits remain relevant.

Even though the payload is generated text, the underlying challenge remains:

> managing how data flows through a system under real-world constraints

---

## Final Thought

The key insight from applying *Designing Data-Intensive Applications* to AI systems is:

> AI systems do not primarily fail because of models—they fail because of data systems.

The real challenges are:
- consistency boundaries  
- schema evolution  
- data integrity  
- failure handling  

RAG is not just embeddings and LLMs.  
It is a **distributed data system with probabilistic components**.

That is why the ideas from *Designing Data-Intensive Applications* by Martin Kleppmann remain deeply relevant—even in modern AI architectures.


