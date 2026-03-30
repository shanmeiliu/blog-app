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
    tags: ["uncategorized"],
    searchWords: [],
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
  }
];
