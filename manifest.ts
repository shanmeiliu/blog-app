export interface BlogPost {
  title: string;
  author: string;
  date: Date;
  modifiedDate: Date;
  filename: string;
  tags: string[];
  searchWords: string[];
  hash: string;
}

export const posts: BlogPost[] = [
  {
    title: "My First Blog Post",
    author: "Kitten",
    date: new Date(2025, 11, 12, 12, 12, 12),
    modifiedDate: new Date(2026, 2, 29, 12, 21, 53),
    filename: "post1.md",
    tags: ["blog","typescript","webdev","github"],
    searchWords: ["personal blog","markdown blog","github pages blog","typescript notes","web development","static site","simple blog","lightweight blog","blogging","javascript","web dev"],
    hash: "fe07827968b58d486123963a74a73409d6c1c770bb8b00d73e43881125645459"
  },
  {
    title: "Untitled Post",
    author: "Kitten",
    date: new Date(2026, 0, 1, 1, 1, 1),
    modifiedDate: new Date(2026, 2, 29, 12, 21, 53),
    filename: "post2.md",
    tags: ["gardening","tomatoes","growing","vegetables"],
    searchWords: ["tomato plant care","growing tomatoes","tomato varieties","garden vegetables","tomato problems","best tomatoes"],
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    title: "Designing Robust Prompts for RAG Systems (Eliminating Hallucinations)",
    author: "Kitten",
    date: new Date(2026, 2, 29, 12, 21, 53),
    modifiedDate: new Date(2026, 2, 29, 12, 21, 53),
    filename: "post3.md",
    tags: ["rag","llm","prompting","hallucinations"],
    searchWords: ["rag systems","prompt engineering","knowledge mixing","retrieval augmented generation","llm hallucinations","contextual prompting","rag prompts"],
    hash: "03af5d4294b559258e34c7672061299a59ea2e87cec0bc9fe483584c7bb4eda6"
  },
  {
    title: "Same Chunking, But 10× Better RAG? The Answer Is Hidden Here!",
    author: "Kitten",
    date: new Date(2026, 2, 30, 12, 26, 17),
    modifiedDate: new Date(2026, 2, 30, 12, 30, 25),
    filename: "post4.md",
    tags: ["rag","chunking","llm","ai"],
    searchWords: ["rag chunking strategy","text chunking","retrieval augmented generation","rag architecture","semantic chunking","rag performance","context windows"],
    hash: "4b721ef3c8d9e40482dde683e5d8fb371437989fdbb8000da6cdaa4baf43cd28"
  },
  {
    title: "Elasticsearch BBQ: A Textbook Case of “Overtaking on a Curve” in Vector Search",
    author: "Kitten",
    date: new Date(2026, 2, 30, 15, 25, 22),
    modifiedDate: new Date(2026, 2, 30, 15, 44, 10),
    filename: "post5.md",
    tags: ["vector search","elasticsearch","ai","performance","quantization"],
    searchWords: ["vector database","similarity search","elasticsearch bbq","rabitq","hnsw","memory optimization","ai infrastructure"],
    hash: "777c350482be6c6f5eb0fef52b5ca8bf7e65f757faf917ec455c0a1204b2932c"
  },
  {
    title: "HNSW_SQ for Efficient Indexing: How to Balance RAG Speed, Recall, and Cost at the Same Time",
    author: "Kitten",
    date: new Date(2026, 2, 31, 11, 35, 23),
    modifiedDate: new Date(2026, 2, 31, 11, 35, 23),
    filename: "post6.md",
    tags: ["hnsw","rag","vector","milvus","indexing"],
    searchWords: ["hnsw sq","vector database","rag performance","scalar quantization","high-dimensional vectors","milvus indexing","memory optimization"],
    hash: "9ba39f83e4955f63b085835a787276f846ec1a109a2042c2743b4f940df1ec78"
  }
];
