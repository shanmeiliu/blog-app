# Operating RAG Systems: A Complete Badcase Feedback Loop from Collection to Fix

## Why Post-Launch Operations Matter More Than Development

Many people think that once a RAG system is built and launched, the job is done. In reality—especially in high-risk domains like finance and insurance—**launch is just the beginning**.

In our project, a mid-sized insurance company built a RAG system using 5,000 policy and claims documents. Users could ask questions like:

> “What is the payout limit of my car insurance accident coverage?”

Before launch:
- Test set size: 200 questions  
- Accuracy: 76%  

Seemed acceptable.

However, problems appeared immediately after launch.

### Real-World Gap

A user asked:

> “I had a minor accident last year. Will it affect my renewal premium?”

This question:
- Did not exist in the test set  
- Was phrased conversationally  

Result:
- Retrieval failed  
- LLM produced a vague answer  

But in reality, the contract clearly contained the answer.

---

### Key Issues After Launch

#### 1. Mismatch Between Test Data and Real Queries
- Test set: formal language  
- Users: colloquial, sometimes dialect-heavy  

#### 2. Compliance Risk
- System once returned incorrect payout amount  
- Legal team had to assess risk  

#### 3. Knowledge Base Aging
- Policies change over time  
- Without monitoring, outdated answers persist  

---

### Key Insight

Without an operational feedback loop:

> **RAG system quality will degrade over time.**

---

## Four Types of Badcases

Before fixing issues, you must first classify them.

### 1. Retrieval Failure (~40%)

The knowledge exists, but retrieval fails.

**Example:**
- Query: “My dad fell off an e-bike, is it covered?”
- Relevant policy exists
- Not retrieved in Top-5

**Causes:**
- Embedding poor at handling colloquial language  
- Chunking splits critical information  

**Fix:**
- Improve chunking (semantic boundaries)  
- Hybrid retrieval (BM25 + vector search)  

---

### 2. Hallucination (~25%)

Retrieval is correct, but generation is wrong.

**Example:**
- Document says: 200% payout  
- Model answers: 150%  

**Cause:**
- LLM relies on pretrained knowledge  

**Fix:**
- Strong prompt constraints  
- Require answer grounding + citations  

---

### 3. Routing Errors (~20%)

Query sent to wrong pipeline.

**Example:**
- Should go to RAG  
- Routed to Text2SQL  

**Cause:**
- Weak classifier  

**Fix:**
- Add training samples  
- Improve routing model  

---

### 4. Knowledge Gap (~15%)

Knowledge truly missing.

**Example:**
- “How to submit claims online?”

**Fix:**
- Add missing documents  

---

## Three Channels for Badcase Collection

Manual review is not scalable.

### 1. User Feedback Buttons

- 👍 / 👎 under each answer  
- Low quality but useful signal  

---

### 2. Customer Service Tickets

- Captures high-impact failures  
- Users often complain via phone  

---

### 3. Automated Quality Detection (Most Important)

Each response is scored automatically:

#### Metrics:
- Retrieval relevance  
- Answer faithfulness  
- Key information completeness  

Low scores → flagged as badcase  

---

## Automatic Classification with LLM

```python
def classify_badcase(query, docs, answer):
    prompt = f"""
    Classify failure:
    A: Retrieval failure
    B: Hallucination
    C: Routing error
    D: Knowledge gap
    """

### Accuracy

* ~80% automatic classification
* ~15% manual review

---

## The 6-Step Badcase Feedback Loop

### Step 1: Collection

* Aggregate all channels
* Store: query, docs, answer, source

---

### Step 2: Auto Classification

* Assign type + fix suggestion

---

### Step 3: Task Assignment

* Retrieval → retrieval team
* Hallucination → prompt team
* Routing → classifier team
* Knowledge gap → content team

---

### Step 4: Fix Validation

* Must pass original badcase

---

### Step 5: Regression Testing (Critical)

```python
def regression_test(old, new, test_set):
    return {
        "recall@5": new >= old - 0.02,
        "faithfulness": new >= old - 0.02,
        "accuracy": new >= old - 0.02,
    }
```

#### Key Metrics:

* recall@5
* faithfulness
* answer accuracy

#### Key Detail:

* Allow 2% tolerance
* Identify regression cases

---

### Step 6: Gradual Rollout

* Release to 10% users
* Monitor for 1 week
* Then full rollout

---

## Real Results After 6 Months

* Accuracy: **76% → 89%**
* Total badcases fixed: ~300
* Weekly new cases: **50 → 15**
* Test set: **200 → 350 (150 real cases)**

---

## Key Takeaways

### 1. Build Multi-Channel Collection

* User feedback
* Customer service
* Automated detection

---

### 2. Use Structured Classification

* Retrieval
* Hallucination
* Routing
* Knowledge gap

---

### 3. Always Run Regression Tests

* Avoid “fix one, break another”

---

### 4. Treat Badcases as Assets

Real user cases:

* More valuable than synthetic test sets
* Improve evaluation quality

---

## Final Thoughts

The real strength of a RAG system is not its launch performance, but:

> **Its ability to continuously improve after launch**

A strong system requires:

* Stable badcase collection
* Clear classification framework
* Strict regression validation

When done right:

> Badcases become your most valuable dataset.

---

## Source: 

https://mp.weixin.qq.com/s/F2QU3cSO7sOW9ZPVAEkt_w
