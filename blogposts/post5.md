# Elasticsearch BBQ: A Textbook Case of “Overtaking on a Curve” in Vector Search


## Introduction

Building a successful product often requires the right timing, the right positioning, and strong execution.

- **Timing** means adapting to major environmental shifts.
- **Positioning** requires sharp technical intuition to choose the right track.
- **Execution** depends on outstanding engineering capability.

As vector search enters a more advanced stage, Elasticsearch did not blindly scale hardware. Instead, by rapidly implementing the **BBQ (Better Binary Quantization)** algorithm, it demonstrated what true technical “overtaking on a curve” looks like.

---

## 1. Memory Explosion ×5: Why Elastic’s BBQ Is a Lifesaver for Vector Search

In the age of AI agents, developers face an uncomfortable truth:

> Vector search is powerful—but extremely expensive.

### The “Bankruptcy Edge” of Vector Search: Memory vs Hardware

Open-sourced Faiss, vector search has evolved for years. Most industry solutions still rely on Faiss-based approaches.

However, with the explosion of data driven by large models, the traditional “throw more hardware at it” strategy is hitting serious limits.

---

### Challenge 1: The Compute Black Hole of Distance Calculation

- Distance computation accounts for **over 90%** of total cost.
- As vector dimensions increase (e.g., 768 → 1536+), complexity grows linearly.
- Improving QPS and throughput requires making this computation **lighter and faster**.

---

### Challenge 2: The Shocking Memory Tax

Using OpenAI’s **text-embedding-3-small** model (1536 dimensions) as an example:

For **1 million vectors**:

- Each vector = 1536 × 32-bit floats  
- Raw storage ≈ **6GB memory**

With HNSW indexing:

- At **10 million vectors**, memory requirement ≈ **40GB+**

---

### Challenge 3: Hardware Cost “Backstab”

Recent years have seen rising hardware costs:

- DDR5 prices rising since late 2023  
- DDR4 prices increasing even faster due to supply constraints  
- CPU/GPU prices also increasing  

Result:

> Running full-scale **HNSW + Float32** has become a luxury.

Many teams find that vector search infrastructure costs exceed business value—clearly unsustainable.

---

## 2. From RaBitQ to Elastic BBQ

To break the “performance vs cost” deadlock, academia explored extreme quantization.

In May 2024, researchers from Nanyang Technological University published:

**RaBitQ: Quantizing High-Dimensional Vectors with a Theoretical Error Bound for ANN**

---

### The Magic of RaBitQ

Compared to traditional PQ (Product Quantization) and SQ (Scalar Quantization):

#### 1. 32× Compression

- Compresses 32-bit floats into **1-bit binary (0/1)**
- Memory reduced to **1/32**

---

#### 2. Surprisingly High Accuracy

Despite binary compression:

- Uses **random rotation**
- **Residual quantization**
- **Unbiased estimators**

Result:

> Maintains relative positions in high-dimensional space  
> Accuracy comparable to lower-compression PQ

---

#### 3. Strong Compatibility

- Works with **HNSW graph index**
- Works with **IVF (inverted index)**

Elastic BBQ is based on **HNSW + RaBitQ**

---

## 3. Speed Above All: Elasticsearch’s Engineering Breakthrough

In most cases, it takes **years** to turn a research paper into production.

Elasticsearch did it in **less than 6 months**.

---

### Timeline

- **2024.05** — Paper published  
- **2024.06** — Internal prototype validation  
- **2024.08–09** — Engineering optimization (SIMD, memory layout)  
- **2024.10** — Merged into Apache Lucene  
- **2024.11** — Released in Elasticsearch 8.16  

---

### Comparison with Other Systems

#### Faiss

- Uses **IVF + RaBitQ**
- Pros: simple, fast build  
- Cons: lower recall → requires scanning more clusters

---

#### Elasticsearch BBQ

- Uses **HNSW + BBQ**
- Advantages:
  - Strong recall stability
  - ~95% memory reduction
  - Uses **Hamming distance (bit operations)** → much faster than float math

---

## 4. Benchmark Results: How Powerful Is BBQ?

### Test Setup

- Dataset: 1M vectors, 768 dimensions (typical RAG scenario)
- Hardware: AWS M6a / M7a / M8a
- Metric: QPS vs Recall

---

### Key Insight: Segment Alignment

A critical but often ignored factor:

- Elasticsearch creates more segments than Milvus by default
- Each segment = independent HNSW graph

To ensure fairness:

> Elasticsearch segments were merged to match Milvus

---

### Results Summary

#### Test 1: M6a (Older Hardware, No AVX512)

- BBQ outperforms Milvus IVF RaBitQ by **75%–85%**

---

#### Test 2: M7a (Mainstream Hardware)

- BBQ outperforms by **45%–50%**

---

#### Test 3: Cross-Generation Comparison

- BBQ on **older hardware** beats Milvus on newer hardware
- M6a BBQ > M7a IVF RaBitQ by **15%–25%**

---

#### Test 4: BBQ vs HNSW Float32

- BBQ significantly faster
- Uses far less memory
- On M6a:
  - BBQ = **3–4× faster**

---

### Key Observation

- BBQ is **hardware-friendly**
- Performs well even without AVX512
- Milvus relies heavily on raw compute power

---

## 5. Conclusion

Elasticsearch BBQ marks a turning point:

> From “hardware brute force” → to “algorithm-driven efficiency”

---

### When Should You Use BBQ?

- High cloud infrastructure costs  
- Limited or older hardware (no DDR5 / AVX512)  
- Desire to maximize CPU efficiency  

---

### Final Takeaway

> Elasticsearch BBQ is not just an algorithm upgrade—it is a demonstration of strategic foresight and exceptional execution.

It represents a shift toward **cost-efficient, high-performance vector search at scale**.

## Source
https://mp.weixin.qq.com/s/jdG_7YW30ngQszJmzLyOpQ