# JD Interviewer Follow-up: “Your RAG System Retrieved the CEO’s Salary for a Regular Employee—How Do You Handle Permissions?”

Hello everyone, I’m Wu Shixiong.

Last week, a student interviewed for a large-model role at JD.com and discussed an enterprise internal knowledge Q&A system he built.

The interviewer asked:  
“Does your system implement permission control?”

He replied yes—filtering by department, so users can only see documents from their own department.

The interviewer then asked:  
“Where is the filtering logic applied—before retrieval or after retrieval?”

He thought for a moment and said: after retrieval—first retrieve Top-K, then remove documents the user doesn’t have permission to access.

The interviewer smirked and said:  
“So the vector database has already retrieved the CEO’s salary document, you just didn’t show it to the user. But the retrieval itself has already happened—the data has been accessed. From a security audit perspective, every query by a regular employee touches data they are not authorized to access, even if it’s not displayed. Would this pass an audit?”

He had no answer.

The interviewer concluded:  
“Permission control is not a presentation-layer problem—it’s a data access problem. You did the right thing in the wrong place.”

This issue is extremely common in enterprise RAG systems, but most tutorials and demos don’t mention it at all. Today, we’ll break down RAG permission control from an architectural perspective.

---

## 1. Why Post-filtering Doesn’t Work

Many teams choose post-filtering because it’s intuitive: retrieve first, then filter results based on permissions. It’s easy to implement—no need to modify the retrieval pipeline.

But post-filtering has three fundamental problems:

### 1. Data Access Has Already Happened

Vector retrieval is a data access operation. Even if results aren’t displayed, the system has already accessed the data.

In regulated industries (finance, healthcare, government), this violates the **principle of least privilege**—users should only access data they are authorized to access, not everything and filter afterward.

### 2. Top-K Slots Are Wasted

Vector search returns only Top-K results. If a user can only access 40% of documents, post-filtering may leave only 2–3 usable results out of Top-5.

This doesn’t just affect permissions—it significantly degrades retrieval quality.

### 3. Higher Risk of Data Leakage in Multi-tenant Systems

In multi-tenant knowledge bases, documents from different tenants share the same vector space.

Post-filtering means documents from different tenants are “visible” during retrieval, even if filtered later. This is unacceptable in strict compliance environments.

---

### Correct Approach: Pre-filtering

Filter out unauthorized documents **before** vector similarity computation. Perform retrieval only within the authorized subset.

---

## 2. Permission Metadata Design in Vector Databases

The core of pre-filtering is storing permission metadata for each chunk in the vector database, and applying filters during retrieval.

Common permission models:

- **Department-level**
  - `dept_ids = ["finance", "hr"]`
- **Role-level**
  - `min_role_level = 3`
- **Document classification**
  - `classification = "confidential"`
- **User whitelist**
  - `allowed_user_ids = ["u001", "u002"]`

### Example: Inserting a Chunk with Permissions

```python
def insert_chunk_with_permissions(
    collection,
    chunk_text: str,
    chunk_embedding: list,
    doc_id: str,
    permissions: dict
):
    """
    Insert document chunk with permission metadata
    """
    collection.insert([{
        "id": generate_chunk_id(),
        "text": chunk_text,
        "embedding": chunk_embedding,
        "doc_id": doc_id,
        "dept_ids": permissions.get("dept_ids", []),
        "min_role_level": permissions.get("min_role_level", 0),
        "classification": permissions.get("classification", "public"),
        "allowed_user_ids": permissions.get("allowed_user_ids", []),
    }])
```

---

### Vector Database Support for Filtering

| Database | Filter Support | Pre-filter Efficiency | Notes                            |
| -------- | -------------- | --------------------- | -------------------------------- |
| Milvus   | Full           | High                  | Supports complex boolean filters |
| Qdrant   | Full           | High                  | Payload filters integrated       |
| Weaviate | Supported      | Medium-High           | Uses `where` filters             |
| Chroma   | Basic          | Medium                | Simple eq/in filters only        |
| FAISS    | None           | Low                   | Requires external logic          |

In a financial insurance project (5,000 contracts), documents were stored per tenant. We used Qdrant with payload filters and enforced `tenant_id` filtering during retrieval to prevent cross-tenant access.

---

## 3. User Permission Token Handling

Pre-filtering only works if the system has **trusted user permission data**.

### Common Mistake

Frontend sends:

```json
{"role": "manager", "dept": "finance"}
```

Backend trusts it directly → insecure (user can modify values).

---

### Correct Approach: Server-side Validation

```python
import jwt
from functools import lru_cache

def build_permission_filter(auth_token: str) -> dict:
    try:
        payload = jwt.decode(
            auth_token,
            key=JWT_SECRET_KEY,
            algorithms=["HS256"]
        )
    except jwt.InvalidTokenError:
        raise PermissionError("Invalid token")

    user_id = payload["sub"]
    role_level = payload.get("role_level", 0)

    user_permissions = get_user_permissions_cached(user_id)

    permission_filter = {
        "must": [
            {"key": "dept_ids", "match": {"any": user_permissions["accessible_depts"]}},
            {"key": "min_role_level", "range": {"lte": role_level}},
        ]
    }

    return permission_filter


@lru_cache(maxsize=1024)
def get_user_permissions_cached(user_id: str) -> dict:
    return permission_service.get_permissions(user_id)
```

---

### Cache Tradeoff

* Longer TTL → better performance
* Shorter TTL → more up-to-date permissions

Typical TTL: **60 seconds**

For critical cases (e.g., employee termination), cache must be actively invalidated.

---

## 4. Multi-tenant RAG Isolation Strategies

| Strategy             | Physical Isolation | Security | Cost   | Use Case                         |
| -------------------- | ------------------ | -------- | ------ | -------------------------------- |
| Metadata filtering   | No                 | Low      | Low    | Low-sensitivity internal systems |
| Partition isolation  | Partial            | Medium   | Medium | SaaS with moderate security      |
| Collection isolation | Full               | High     | High   | Finance/healthcare               |

### Practical Approach

Use **Partition + Metadata dual filtering**:

* Partition ensures physical separation
* Metadata acts as a safety fallback

---

## 5. Handling Dynamic Permission Changes

Permissions change frequently:

* Promotions
* Transfers
* Resignations
* Policy updates

---

### Bad Practice

Store permissions directly in chunk metadata → leads to massive updates when permissions change.

---

### Better Approach: Real-time Permission Join

```python
def search_with_realtime_permissions(
    query: str,
    user_id: str,
    vector_db,
    permission_db,
    top_k: int = 5
) -> list:

    accessible_doc_ids = permission_db.get_accessible_docs(user_id)

    if not accessible_doc_ids:
        return []

    results = vector_db.search(
        query_embedding=embed(query),
        filter={"doc_id": {"$in": accessible_doc_ids}},
        limit=top_k
    )

    return results
```

---

### Optimization

* Cache `accessible_doc_ids` (30–60s)
* Store in Redis
* Invalidate cache on permission updates

---

### Immediate Revocation (Critical Case)

For employee termination:

* Trigger event
* Clear all user caches immediately
* Ensure next request reflects updated permissions

---

## Final Thoughts

Permission control is one of the biggest differences between **demo-level RAG** and **enterprise-grade RAG**.

* A basic RAG system can be built in 2 days
* A secure, audit-compliant RAG system requires careful permission design

“Retrieve first, filter later” is the most common pitfall—simple but fundamentally flawed.

Permission control must be enforced at the **data access layer**, not the presentation layer.

---

*Content adapted from Wu Shixiong’s RAG practical training series.*

## Source: 
https://mp.weixin.qq.com/s/KTAuACNll9JdiqRhUw-vFA
