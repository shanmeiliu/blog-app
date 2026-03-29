import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({
  path: path.join(process.cwd(), "blog/.env"),
});;

const BLOG_ROOT = path.join(process.cwd(), "blog");
const POSTS_DIR = path.join(BLOG_ROOT, "blogposts");
const OUTPUT_FILE = path.join(BLOG_ROOT, "manifest.ts");
const DEFAULT_AUTHOR = process.env.DEFAULT_BLOG_AUTHOR || "Kitten"; //
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL =
  process.env.OPENAI_API_URL ||
  "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in .env");
}

interface ExistingBlogPost {
  title: string;
  author: string;
  date: string;
  modifiedDate: string;
  filename: string;
  tags: string[];
  searchWords: string[];
  hash: string;
}

interface GeneratedBlogPost {
  title: string;
  author: string;
  date: string;
  modifiedDate: string;
  filename: string;
  tags: string[];
  searchWords: string[];
  hash: string;
}

function toDateExpression(date: Date): string {
  return `new Date(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()}, ${date.getHours()}, ${date.getMinutes()}, ${date.getSeconds()})`;
}

function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function safeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ""
  );

  return cleaned.length > 0 ? cleaned : fallback;
}

function safeJsonArray(text: string | undefined, fallback: string[] = []): string[] {
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text);
    return safeStringArray(parsed, fallback);
  } catch {
    return fallback;
  }
}

function extractTitle(content: string): string {
  const lines = content.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      continue;
    }

    if (line.startsWith("# ")) {
      const title = line.replace(/^# /, "").trim();
      return title || "Untitled Post";
    }

    break;
  }

  return "Untitled Post";
}

function hasUsableMetadata(existing?: ExistingBlogPost): boolean {
  if (!existing) return false;

  const tags = safeStringArray(existing.tags, []);
  const searchWords = safeStringArray(existing.searchWords, []);

  const hasRealTags =
    tags.length > 0 &&
    !(tags.length === 1 && tags[0].toLowerCase() === "uncategorized");

  const hasRealSearchWords = searchWords.length > 0;

  return hasRealTags && hasRealSearchWords;
}

function loadExistingManifest(): Record<string, ExistingBlogPost> {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return {};
  }

  const manifestContent = fs.readFileSync(OUTPUT_FILE, "utf-8");

  const postsArrayMatch = manifestContent.match(
    /export const posts:\s*BlogPost\[\]\s*=\s*\[([\s\S]*?)\]\s*;/
  );

  if (!postsArrayMatch) {
    return {};
  }

  const postsContent = postsArrayMatch[1];
  const postBlocks = postsContent.match(/\{[\s\S]*?\n  \}/g) || [];
  const result: Record<string, ExistingBlogPost> = {};

  for (const block of postBlocks) {
    const filenameMatch = block.match(/filename:\s*"([^"]+)"/);
    if (!filenameMatch) continue;

    const filename = filenameMatch[1];

    const titleMatch = block.match(/title:\s*"([^"]*)"/);
    const authorMatch = block.match(/author:\s*"([^"]*)"/);
    const dateMatch = block.match(/date:\s*(new Date\([^)]+\))/);
    const modifiedDateMatch = block.match(/modifiedDate:\s*(new Date\([^)]+\))/);
    const tagsMatch = block.match(/tags:\s*(\[[\s\S]*?\])/);
    const searchWordsMatch = block.match(/searchWords:\s*(\[[\s\S]*?\])/);
    const hashMatch = block.match(/hash:\s*"([^"]+)"/);

    result[filename] = {
      title: safeString(titleMatch?.[1], "Untitled Post"),
      author: safeString(authorMatch?.[1], DEFAULT_AUTHOR),
      date: safeString(dateMatch?.[1], toDateExpression(new Date())),
      modifiedDate: safeString(
        modifiedDateMatch?.[1],
        safeString(dateMatch?.[1], toDateExpression(new Date()))
      ),
      filename,
      tags: safeJsonArray(tagsMatch?.[1], []),
      searchWords: safeJsonArray(searchWordsMatch?.[1], []),
      hash: safeString(hashMatch?.[1], ""),
    };
  }

  return result;
}

async function generateMetadata(content: string): Promise<{
  tags: string[];
  searchWords: string[];
}> {
  if (!OPENAI_API_KEY) {
    console.warn("⚠️ Missing OPENAI_API_KEY. Using fallback metadata.");
    return {
      tags: ["uncategorized"],
      searchWords: [],
    };
  }

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You generate structured metadata for blog posts.",
          },
          {
            role: "user",
            content: `Return JSON only in exactly this format:
{
  "tags": ["3-5 short lowercase tags"],
  "searchWords": ["3-7 relevant lowercase search keywords or short phrases"]
}

Rules:
- tags should be concise
- searchWords should help blog search
- do not include explanations
- do not wrap the JSON in markdown
- all values must be strings
- avoid duplicates

Blog post content:
${content.slice(0, 4000)}`,
          },
        ],
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;

    if (typeof text !== "string" || text.trim() === "") {
      throw new Error("Empty AI response content");
    }

    const parsed = JSON.parse(text);

    return {
      tags: safeStringArray(parsed.tags, ["uncategorized"]),
      searchWords: safeStringArray(parsed.searchWords, []),
    };
  } catch (error) {
    console.warn("⚠️ AI metadata generation failed, using fallback.");
    if (axios.isAxiosError(error)) {
    if (error.response) {
      console.error("🔴 OpenAI API Error:");
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("🔴 No response received from OpenAI:", error.request);
    } else {
      console.error("🔴 Axios error message:", error.message);
    }
  } else if (error instanceof Error) {
    console.error("🔴 Error message:", error.message);
  } else {
    console.error("🔴 Unknown error:", error);
  }

  return {
    tags: ["uncategorized"],
    searchWords: [],
  };
  }
}

async function main() {
  console.log("🔍 Generating manifest...");

  const existingPosts = loadExistingManifest();

  if (!fs.existsSync(POSTS_DIR)) {
    throw new Error(`Posts directory not found: ${POSTS_DIR}`);
  }

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();

  const posts: GeneratedBlogPost[] = [];

  for (const file of files) {
    console.log(`📄 Processing ${file}...`);

    const fullPath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    const hash = hashContent(content);
    const title = extractTitle(content);
    const existing = existingPosts[file];
    const nowExpr = toDateExpression(new Date());

    let tags: string[];
    let searchWords: string[];
    let publishDate: string;
    let modifiedDate: string;
    let author: string;

    if (!existing) {
      console.log("🤖 New post, generating metadata...");
      const metadata = await generateMetadata(content);

      tags = metadata.tags;
      searchWords = metadata.searchWords;
      publishDate = nowExpr;
      modifiedDate = nowExpr;
      author = DEFAULT_AUTHOR;
    } else if (existing.hash === hash && hasUsableMetadata(existing)) {
      console.log("⚡ Unchanged, reusing existing metadata...");
      tags = safeStringArray(existing.tags, ["uncategorized"]);
      searchWords = safeStringArray(existing.searchWords, []);
      publishDate = safeString(existing.date, nowExpr);
      modifiedDate = safeString(existing.modifiedDate, publishDate);
      author = safeString(existing.author, DEFAULT_AUTHOR);
    } else if (existing.hash === hash) {
      console.log("🔁 Unchanged content, but cached metadata is missing/invalid. Regenerating...");
      const metadata = await generateMetadata(content);

      tags = metadata.tags;
      searchWords = metadata.searchWords;
      publishDate = safeString(existing.date, nowExpr);
      modifiedDate = safeString(existing.modifiedDate, publishDate);
      author = safeString(existing.author, DEFAULT_AUTHOR);
    } else {
      console.log("🤖 Changed content, regenerating metadata...");
      const metadata = await generateMetadata(content);

      tags = metadata.tags;
      searchWords = metadata.searchWords;
      publishDate = safeString(existing.date, nowExpr);
      modifiedDate = nowExpr;
      author = safeString(existing.author, DEFAULT_AUTHOR);
    }

    posts.push({
      title,
      author,
      date: publishDate,
      modifiedDate,
      filename: file,
      tags,
      searchWords,
      hash,
    });
  }

  const output = `export interface BlogPost {
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
${posts
  .map(
    (post) => `  {
    title: ${JSON.stringify(post.title)},
    author: ${JSON.stringify(post.author)},
    date: ${post.date},
    modifiedDate: ${post.modifiedDate},
    filename: ${JSON.stringify(post.filename)},
    tags: ${JSON.stringify(post.tags)},
    searchWords: ${JSON.stringify(post.searchWords)},
    hash: ${JSON.stringify(post.hash)}
  }`
  )
  .join(",\n")}
];
`;

  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");

  console.log("✅ manifest.ts generated successfully.");
}

main().catch((error) => {
  console.error("❌ Failed to generate manifest:", error);
  process.exit(1);
});