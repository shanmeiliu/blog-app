

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
