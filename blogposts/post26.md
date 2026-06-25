# From Ollama to the Cloud: Migrating Local LLM Infrastructure to AWS Bedrock, SageMaker, Google Cloud Vertex AI, and Azure AI

> Building with local models such as Qwen and Gemma is an excellent way to prototype AI applications. As systems mature, however, engineering priorities often shift from minimizing cost to maximizing scalability, reliability, governance, and operational efficiency. This article explores what changes when moving from a self-hosted Ollama deployment to managed cloud AI platforms.

---

# Why Teams Start with Ollama

For many AI engineers, Ollama has become the fastest way to experiment with modern open-source models.

A typical development setup looks like:

```text
                    +----------------+
                    |  React / Web   |
                    +--------+-------+
                             |
                       REST / SSE
                             |
                    +--------v-------+
                    | FastAPI / Go   |
                    | RAG Backend    |
                    +--------+-------+
                             |
                       Ollama API
                             |
              +--------------+--------------+
              |                             |
         Qwen 3                    Gemma 3
              |                             |
              +--------------+--------------+
                             |
                     Local GPU Server
```

Advantages include:

* Complete control over model selection
* No API costs
* Full data privacy
* Easy experimentation
* Offline development
* Ability to swap between dozens of open models

A single API endpoint powers multiple models:

```http
POST /api/chat
```

Changing models often becomes as simple as:

```go
model := "qwen3:32b"
```

or

```go
model := "gemma3:27b"
```

The surrounding application architecture remains unchanged.

---

# Typical Local AI Stack

Many production-ready local deployments eventually evolve into something like:

```text
                Client
                   |
             API Gateway
                   |
        ----------------------
        |                    |
   Authentication       Rate Limiter
        |                    |
        +---------+----------+
                  |
          AI Gateway Service
                  |
      -------------------------
      |           |           |
 Embeddings   RAG Search   Chat Service
      |           |           |
 PostgreSQL    pgvector    Ollama
                  |
          Qwen / Gemma
```

This architecture already resembles cloud-native inference services.

---

# When Local Hosting Starts Becoming Difficult

As applications gain users, several operational challenges emerge.

## GPU Capacity Planning

Unlike stateless web services, LLM inference is constrained by GPU memory.

For example:

| Model       | Approximate VRAM |
| ----------- | ---------------: |
| Gemma 3 12B |         10-14 GB |
| Qwen3 14B   |         14-18 GB |
| Qwen3 32B   |         28-40 GB |
| Llama 70B   |           80+ GB |

Scaling is no longer simply adding more CPU containers.

---

## Cold Loading

Large models may require tens of seconds to load.

```text
Request arrives

↓

Model not loaded

↓

Load model into GPU

↓

First token generated
```

Production systems often keep frequently used models permanently loaded, consuming GPU memory.

---

## Multi-Model Scheduling

Suppose customers request:

* Gemma
* Qwen
* DeepSeek
* Llama

Only some models can remain loaded simultaneously.

A scheduler must decide:

* Which models remain resident
* Which are unloaded
* GPU memory allocation
* Request routing

---

## High Availability

One GPU server represents a single point of failure.

Production environments require:

* Multiple inference nodes
* Health checks
* Load balancing
* Failover
* Rolling upgrades

---

# Moving Toward Cloud AI

Eventually many organizations replace local inference with managed services.

Instead of:

```text
Application

↓

Ollama

↓

GPU
```

the architecture becomes:

```text
Application

↓

Cloud AI Endpoint

↓

Managed Model Infrastructure
```

The application code changes very little.

Only the inference provider changes.

---

# AWS Bedrock

Amazon Bedrock is AWS's fully managed foundation model platform.

Instead of provisioning GPUs yourself, AWS exposes models through managed APIs.

```text
                Application
                       |
                Bedrock SDK
                       |
         ----------------------------
         |            |             |
     Claude       Llama       Amazon Nova
```

Characteristics:

* No GPU management
* Fully managed scaling
* IAM integration
* Private networking
* Serverless inference
* Built-in monitoring
* Guardrails
* Knowledge Bases
* Agents

Typical API:

```python
client.invoke_model(...)
```

instead of

```http
POST /api/chat
```

---

# SageMaker

SageMaker offers much greater infrastructure control.

Instead of consuming managed APIs, engineers deploy their own models.

```text
Container

↓

Model Server

↓

GPU Instance

↓

SageMaker Endpoint
```

Suitable for:

* Fine-tuned models
* Custom containers
* Quantized models
* Experimental research
* Proprietary models

You still manage:

* GPU instance types
* Autoscaling
* Container images
* Model versions

Compared with Bedrock, SageMaker provides lower-level infrastructure access.

---

# Bedrock vs SageMaker

| Feature                    | Bedrock         | SageMaker    |
| -------------------------- | --------------- | ------------ |
| GPU management             | None            | User manages |
| Deploy custom models       | Limited         | Yes          |
| Serverless inference       | Yes             | Optional     |
| Fine-tuning                | Selected models | Full control |
| Operational complexity     | Low             | High         |
| Infrastructure flexibility | Medium          | Very High    |

---

# Google Cloud Vertex AI

Google Cloud consolidates its AI capabilities under Vertex AI.

Architecture:

```text
Application

↓

Vertex AI Endpoint

↓

Gemini
Open Models
Custom Models
```

Vertex AI combines:

* Model Garden
* Managed endpoints
* Prompt management
* Evaluation
* Embeddings
* RAG Engine
* Agent Builder
* Pipelines

A typical workflow includes:

```text
Document

↓

Embedding

↓

Vector Search

↓

Retriever

↓

Gemini

↓

Response
```

Many retrieval components become managed services.

---

# Azure AI

Azure's AI ecosystem closely integrates with Microsoft's enterprise offerings.

```text
Application

↓

Azure AI Foundry

↓

Azure OpenAI
Open Models
Custom Models
```

Common integrations include:

* Microsoft Entra ID
* Azure Key Vault
* Azure Monitor
* Cosmos DB
* Azure AI Search
* Logic Apps
* Power Platform

Organizations already invested in Microsoft infrastructure often find Azure particularly attractive.

---

# Cloud Platform Comparison

| Capability                | AWS Bedrock | SageMaker | Google Vertex AI | Azure AI  |
| ------------------------- | ----------- | --------- | ---------------- | --------- |
| Managed foundation models | Excellent   | Moderate  | Excellent        | Excellent |
| Custom model deployment   | Limited     | Excellent | Excellent        | Excellent |
| Serverless inference      | Yes         | Partial   | Yes              | Yes       |
| Fine tuning               | Limited     | Excellent | Excellent        | Excellent |
| Built-in RAG tooling      | Good        | Moderate  | Excellent        | Good      |
| Enterprise identity       | IAM         | IAM       | IAM              | Entra ID  |
| MLOps tooling             | Moderate    | Excellent | Excellent        | Excellent |
| Operational complexity    | Low         | High      | Medium           | Medium    |

---

# Migration Strategy

Most production systems migrate incrementally rather than rewriting everything.

```text
Stage 1

Application
      |
   Ollama

↓

Stage 2

Inference Interface

↓

Ollama Provider

↓

Bedrock Provider

↓

Vertex Provider

↓

Azure Provider

↓

Stage 3

Configuration selects provider

↓

No application code changes
```

The inference layer becomes an abstraction.

Example:

```go
type LLMProvider interface {
    Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error)
    Embed(ctx context.Context, text string) ([]float32, error)
}
```

Implementations:

```text
OllamaProvider
BedrockProvider
VertexProvider
AzureProvider
OpenAIProvider
AnthropicProvider
```

The rest of the application interacts only with the interface.

---

# Cloud Architecture Evolution

A mature cloud deployment typically looks like:

```text
                   Users
                      |
               API Gateway
                      |
          Kubernetes / ECS / Cloud Run
                      |
             AI Gateway Service
      -------------------------------
      |              |              |
 Embeddings      Retrieval      Chat Service
      |              |              |
 Vector DB      Redis Cache    Cloud LLM
      |                             |
 PostgreSQL                 Bedrock / Vertex / Azure
                      |
              Observability Stack
      Metrics • Logs • Traces • Cost Monitoring
```

The application architecture remains largely unchanged.

The largest operational shift is moving GPU management from application teams to cloud-managed AI infrastructure.

---

# Cost Considerations

Local hosting shifts spending toward infrastructure:

* GPU servers
* Power consumption
* Cooling
* Hardware maintenance
* Capacity planning

Managed cloud platforms shift spending toward usage-based APIs:

* Tokens processed
* Requests served
* Model selection
* Embeddings
* Fine-tuning
* Storage

Each approach optimizes a different operational model.

---

# Security Evolution

A production migration often introduces enterprise security controls.

Local deployment:

```text
Application

↓

Ollama

↓

GPU
```

Cloud deployment:

```text
Application

↓

IAM / Entra ID

↓

Private VPC Endpoint

↓

Managed AI Service

↓

Audit Logs

↓

Encryption
```

Managed platforms typically provide:

* Identity-based authorization
* Network isolation
* Encryption at rest
* Encryption in transit
* Audit logging
* Secrets management
* Compliance integrations

---

# Operational Observability

Cloud-native deployments expand beyond traditional application metrics.

Typical telemetry includes:

* Request latency
* First-token latency
* Token throughput
* Prompt size
* Completion size
* Cost per request
* Model utilization
* Error rates
* Retry frequency
* Cache hit ratio

This enables engineering teams to optimize both performance and operating costs.

---

# Final Thoughts

Migrating from Ollama-hosted Qwen or Gemma models to managed cloud AI services is less about replacing models and more about evolving operational architecture. The core application—retrieval pipelines, business logic, authentication, and APIs—often remains intact, while the inference layer transitions from self-managed GPU infrastructure to cloud-managed services. AWS Bedrock emphasizes serverless simplicity, SageMaker provides deep infrastructure control, Google Vertex AI offers an integrated AI development platform, and Azure AI aligns closely with enterprise Microsoft ecosystems. Designing applications around provider abstractions allows the inference backend to evolve independently, making it easier to adopt new models, scale workloads, and support multi-cloud AI strategies without significant application rewrites.
