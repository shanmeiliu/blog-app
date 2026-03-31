# HNSW_SQ for Efficient Indexing: How to Balance RAG Speed, Recall, and Cost at the Same Time

In high-dimensional vector retrieval scenarios such as RAG, we often run into an impossible triangle:

If hardware stays the same, achieving faster query speed usually means sacrificing some recall. If you want both high recall and high speed, then you generally have to increase your hardware budget...

So, is there a way to break this deadlock? In the latest Milvus capability upgrade, the answer is: **HNSW_SQ**.

By combining HNSW’s efficient retrieval capability with the extreme compression characteristics of Scalar Quantization (SQ), it becomes possible to balance performance, speed, and cost at the same time.

Compared with standard HNSW, the biggest drawback of HNSW_SQ may be that, while maintaining recall, index build time increases slightly.

## 01  
## What Are HNSW and SQ?

Before understanding HNSW_SQ, we first need a basic understanding of the two underlying technologies: **HNSW** and **SQ**.

Let’s start with HNSW.

Its core idea is to build a **multi-layer graph structure**, where each vector in the dataset corresponds to a node in the graph. Connections between nodes are established based on vector similarity. During search, the algorithm can quickly navigate from the sparse graph in the upper layers to a region in the denser lower layers, greatly reducing the scope that needs to be traversed. This is the key reason why it can achieve both high-speed retrieval and high recall.

But HNSW alone is not enough. When dealing with massive volumes of high-dimensional vectors, memory overhead is still a major problem. That is where **Scalar Quantization (SQ)** comes in.

The principle of SQ is simple: it uses fewer bits to represent the floating-point values in a vector, thereby compressing the data.

For example:

* **SQ8** uses 8 bits, which maps values into 256 levels
* **SQ6** uses 6 bits, corresponding to 64 levels

After compression, vector size is reduced significantly, which not only lowers memory usage but also speeds up data transfer and computation.

Of course, compression introduces a small amount of precision loss, but as long as it is controlled properly, that loss is completely acceptable.

```text
Scalar Quantization Example

Original float values:
[0.13, 0.72, -0.41, 0.05]

After SQ8:
[132, 219,  61, 118]

After SQ6:
[33, 55, 15, 30]
```

In addition, for scenarios that pursue **extreme speed** and **minimal memory usage**, Milvus 2.6.8 and later also introduces an even more aggressive quantization technique: **SQ4U**.

SQ4U is a **4-bit uniform scalar quantization** scheme. It compresses the floating-point value of each dimension into a **4-bit unsigned integer**, where the “U” stands for **Uniform**.

Unlike traditional non-uniform scalar quantization, which computes extrema independently for each dimension (per-dimension quantization), SQ4U adopts a **global uniform quantization strategy**:

It computes a unified minimum value `vmin` and value range `vdiff` for the entire vector or vector segment, then evenly divides that range into 16 intervals. All floating-point values across all dimensions are mapped into 4-bit integers from `0` to `15` using this same set of parameters.

This design brings three major advantages:

### 1. Maximum Compression Ratio

Compared with FP32, it can achieve **8x compression**. Compared with SQ8, it can still compress data by another **2x**, greatly relieving memory bandwidth bottlenecks.

### 2. Better Use of Modern CPU SIMD Instructions

Instruction sets such as **AVX2** and **AVX-512** can process more dimensions per cycle, and the global-parameter design avoids repeatedly loading different scaling and offset values during distance computation. This keeps the instruction pipeline saturated.

### 3. Better CPU Cache Efficiency

Smaller vectors mean more data can fit in CPU cache, reducing latency caused by frequent memory access.

However, one thing to note is that because SQ4U is **globally uniform**, it performs better on datasets where the data has been normalized, or where the value distribution across dimensions is relatively consistent.

## 02

## How Does HNSW_SQ Work?

After all that, how exactly do HNSW and SQ work together?

The process can be divided into **three steps**:

### Step 1: Data Compression

Based on the configured `sq_type`, such as `SQ6` or `SQ8`, the original vectors are compressed into a low-bit representation.

Although the compressed vectors lose a little precision, their small size allows the system to handle much larger datasets.

### Step 2: Build the HNSW Graph

The multi-layer HNSW graph is built using the compressed vectors.

Because the data size becomes smaller, the graph itself also becomes smaller. As a result, later retrieval becomes faster.

### Step 3: Candidate Vector Retrieval

When a query vector arrives, the algorithm uses the compressed graph data to quickly filter out a batch of candidate vectors that are likely to be similar.

If you need higher query accuracy, you can also enable a **fourth step**:

### Step 4: Result Refinement

The core of this step involves several key parameters:

* **`refine`**
  Controls whether refinement is enabled. If enabled, the system recalculates distances using higher-precision data.

* **`refine_type`**
  Determines the precision used during refinement, such as `SQ8`, `BF16`, or even `FP32`.
  Higher precision gives more accurate results, but also increases memory overhead.
  Its precision must also be higher than the previously configured `sq_type`.

* **`refine_k`**
  A multiplier. For example, if you want the Top 100 results and set `refine_k = 2`, the system will first select the Top 200 candidates, and then rerank them to produce the most accurate Top 100.

## 03

## How to Use HNSW_SQ Effectively

Now that the theory is covered, let’s move on to practical usage.

### Step 1: Build an HNSW_SQ Index

First, prepare the index parameters. Specify the vector field name with `add_index()`, set the index type (`index_type`) to `HNSW_SQ`, and then configure the distance metric (`metric_type`) and other key parameters according to your needs.

```python
from pymilvus import MilvusClient

# Initialize client
client = MilvusClient("your_milvus_uri")

# Prepare index parameters
index_params = client.prepare_index_params()

index_params.add_index(
    field_name="your_vector_field_name",
    index_type="HNSW_SQ",
    index_name="vector_index",
    metric_type="L2",  # COSINE, IP, etc. are also supported
    params={
        "M": 64,                  # maximum number of connections per node
        "efConstruction": 100,    # number of candidate neighbors considered during index build
        "sq_type": "SQ6",         # choose quantization type
        "refine": True,           # enable result refinement
        "refine_type": "SQ8"      # use higher precision during refinement
    }
)

# Create index
client.create_index(
    collection_name="your_collection_name",
    index_params=index_params
)
```

Several of these parameters can be adjusted according to business requirements:

* **`M`**
  The larger it is, the higher the index accuracy, but build time and query time also increase. It is generally recommended to keep it between **5 and 100**.

* **`efConstruction`**
  The larger it is, the better the index quality, but the longer the build time. The recommended range is **50 to 500**.

### Step 2: Search Using the HNSW_SQ Index

After the index is built, you can start similarity search. The key is to configure the search parameters properly.

```python
# Configure search parameters
search_params = {
    "params": {
        "ef": 10,        # number of nodes traversed during search; affects accuracy and speed
        "refine_k": 1    # candidate expansion factor during refinement stage
    }
}

# Execute search
res = client.search(
    collection_name="your_collection_name",
    anns_field="your_vector_field_name",
    data=[[0.1, 0.2, 0.3, 0.4, 0.5]],  # your query vector
    limit=3,                           # return Top 3 similar results
    search_params=search_params
)

# View results
print(res)
```

The `ef` parameter in the search settings is especially important. It determines the breadth of traversal during search.

* Larger values mean higher accuracy
* But they also make search slower

In general, it is recommended to set it between **K and 10K**, where **K** is the number of results you want to return.

Overall, **HNSW_SQ** is a vector index solution that can flexibly balance **speed, memory usage, and accuracy**.

By adjusting the quantization type, index parameters, and search parameters according to your business needs, you can find the configuration that suits your scenario best.

Whether you need fast retrieval on large-scale datasets, or memory optimization under tight resource constraints, it can handle both with ease.

