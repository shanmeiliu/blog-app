

# Personal Markdown Blog

A lightweight **TypeScript + HTML + CSS personal blog** that uses **Markdown files** for content, supports **search**, **clickable tags**, and **post routing**, without using any front-end framework.



## 🗂 Project Structure

```

/index.html          → Main HTML page
/index.ts            → TypeScript code for rendering posts, search, and tag filtering
/index.css           → Styles for the blog
/manifest.ts         → Array of blog post metadata
/blogposts/          → Markdown files for posts (e.g., post1.md, post2.md)
/thumbs/             → Thumbnails for posts (matching markdown filenames)
/images/             → Images referenced in markdown posts
.env
```

## ✨ Features

- **Markdown-based posts**: All blog content is written in `.md` files.  
- **Search**: Filter posts by keywords as you type.  
- **Clickable tags**: Filter posts by clicking tags. Handles multi-word tags.  
- **Post routing**: Each post has a unique link via hash routing.  
- **Thumbnails**: Default thumbnail if no image provided.  
- **Pure TypeScript + HTML + CSS**: No framework required.

## 📝 Adding a New Post

1. Add a new Markdown file in `/blogposts/`, e.g., `post3.md`.
2. Add a thumbnail in `/thumbs/` named `post3.png`.
3. Update `manifest.ts`:

```ts
{
  title: "My New Post",
  author: "Your Name",
  date: new Date(2026, 2, 28),
  filename: "post3.md",
  tags: ["tag1", "tag2"],
  searchWords: ["keywords", "for", "search"]
}
```


---

## 🛠️ Manifest Generation (`generateManifest.ts`)

This project includes a script to automatically generate `manifest.ts` from markdown blog posts in the `/posts` directory.

### 🚀 Features

#### 📄 Automatic Manifest Generation

* Scans all `.md` files in `/posts`
* Extracts metadata (title, filename, etc.)
* Generates a complete `manifest.ts` file used by the blog

---

#### 🤖 AI-Powered Metadata (Tags & Search)

* Uses OpenAI API to generate:

  * `tags` (3–6 concise labels)
  * `searchWords` (keywords for search functionality)
* Ensures consistent and relevant metadata across posts

---

#### ⚡ Smart Caching with SHA256

* Computes a SHA256 hash of each post’s content
* Skips AI calls for unchanged posts
* Dramatically improves performance and reduces API cost

---

#### 🔁 Intelligent Retry Logic

* Detects invalid or fallback metadata (e.g. `["uncategorized"]`)
* Re-generates metadata even if the post content hasn’t changed
* Prevents permanent bad data from failed previous runs

---

#### 🗓️ Publish Date & Modified Date Tracking

* `date`: preserved as original publish date
* `modifiedDate`: updated only when post content changes
* Ensures accurate timeline tracking for posts

---

#### 🛡️ Robust Error Handling

* Handles OpenAI API errors gracefully
* Logs detailed error information (status, response, message)
* Falls back to safe defaults instead of breaking the build:

  * `tags: ["uncategorized"]`
  * `searchWords: []`

---

#### 🔒 Safe Parsing & Fault Tolerance

* Safely parses existing `manifest.ts`
* Handles missing or malformed fields without crashing
* Applies defaults for all fields:

  * `title`: `"Untitled Post"`
  * `author`: `"Kitten"` (configurable)
  * `tags`, `searchWords`: safe fallbacks

---

#### ⚙️ Environment Configurable

Supports `.env` configuration:

```env
OPENAI_API_KEY=your_api_key
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-4o-mini
DEFAULT_BLOG_AUTHOR=Kitten
```

---

### ▶️ Usage
After Add Script to package.json
```
  "scripts": {
    "generate-manifest": "ts-node scripts/generateManifest.ts"
  }
```
you can then 

```bash
npm run generate-manifest
```

---

### 💡 Notes

* The script is deterministic: unchanged content will not trigger new API calls
* Designed to be resilient — failures will not block manifest generation
* Recommended over git hooks for better control and debugging



## Testing the LLM API with `testLLM.ts`

This project includes a small utility script called `testLLM.ts` to help verify that your LLM API configuration is working before you rely on it inside `generateManifest.ts`.

### Why this file is included

The manifest generator can call an LLM to automatically create metadata such as:

- `tags`
- `searchWords`

If the API key is missing, the endpoint is wrong, the model name is invalid, or the API response format is not what the script expects, the manifest generation step may fail or fall back to default metadata.

`testLLM.ts` is included so you can test your LLM connection in isolation first. This makes debugging much easier because you can confirm:

- your `.env` values are being loaded correctly
- your API key is valid
- your endpoint is reachable
- your selected model works
- the response shape looks correct
- the returned content can be parsed as expected

In short, this file is a simple smoke test for your LLM setup.

---

## What `testLLM.ts` is useful for

You can use `testLLM.ts` when:

- setting up the project for the first time
- changing to a different LLM provider
- changing the API URL
- changing the model name
- debugging API authentication issues
- checking whether the model is returning JSON or wrapped markdown
- confirming that your `.env` file is loaded correctly

This is especially useful before running:

```bash
npm run generate-manifest
````

## Prerequisites

Before running `testLLM.ts`, make sure you have:

### 1. Node.js installed

Recommended: Node.js 18 or newer.

You can check with:

```bash
node -v
npm -v
```

### 2. Project dependencies installed

From the project root, run:

```bash
npm install
```

If your project uses TypeScript directly with `ts-node`, make sure these are installed:

```bash
npm install
```

Typical dependencies used for this script are:

* `typescript`
* `ts-node`
* `dotenv`
* `axios`

If they are not installed yet, you can add them with:

```bash
npm install axios dotenv
npm install -D typescript ts-node @types/node
```

---

## Environment variables

Create a `.env` file in the project root.

Example:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-4o-mini
DEFAULT_BLOG_AUTHOR=Kitten
```


