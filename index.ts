import { posts, BlogPost } from "./manifest.js";

declare global {
  interface Window {
    marked: any;
    mermaid: any;
  }
}

const content = document.getElementById("content") as HTMLElement;
const searchInput = document.getElementById("search") as HTMLInputElement;

let debounceTimer: number | undefined;
let mermaidInitialized = false;

const normalizedPosts = normalizePosts(posts);

window.addEventListener("DOMContentLoaded", init);

function normalizePosts(posts: BlogPost[]): BlogPost[] {
  return posts.map((p) => ({
    ...p,
    date: new Date(p.date),
  }));
}

function init() {
  console.log("Posts loaded:", posts);

  handleRoute();
  window.addEventListener("hashchange", handleRoute);

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);

    debounceTimer = window.setTimeout(() => {
      const query = searchInput.value.toLowerCase();
      const filtered = filterPosts(query);
      renderPostList(filtered);
    }, 300);
  });

  content.addEventListener("click", (e) => {
    const tagEl = (e.target as HTMLElement).closest(".tag") as HTMLElement;
    if (!tagEl) return;

    const tag = tagEl.dataset.tag;
    if (!tag) return;

    window.location.hash = `tag=${encodeURIComponent(tag.trim())}`;
  });
}

function filterPosts(query: string): BlogPost[] {
  if (!query) return sortByDate(normalizedPosts);

  return normalizedPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(query) ||
      p.author.toLowerCase().includes(query) ||
      p.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      p.searchWords.some((word) => word.toLowerCase().includes(query))
  );
}

function sortByDate(list: BlogPost[]) {
  return [...list].sort((a, b) => b.date.getTime() - a.date.getTime());
}

function renderPostList(list: BlogPost[]) {
  searchInput.style.display = "block";

  content.innerHTML = `
    <div class="post-list">
      ${list.map(renderPostCard).join("")}
    </div>
  `;

  list.forEach((post) => {
    const el = document.getElementById(post.filename);
    el?.addEventListener("click", () => openPost(post));
  });

  const images = content.querySelectorAll(".post-card img");

  images.forEach((el) => {
    const img = el as HTMLImageElement;
    img.onerror = () => {
      img.onerror = null;
      img.src = "thumbs/fallback.png";
    };
  });
}

function renderPostCard(post: BlogPost): string {
  const thumb = `./thumbs/${post.filename.replace(".md", ".png")}`;

  return `
    <div class="post-card" id="${post.filename}">
      <img src="${thumb}" class="post-thumb" alt="${post.title}" />
      <div>
        <h3>${post.title}</h3>
        <div class="post-meta">
          ${post.author} • ${post.date.toDateString()}
        </div>
        <div class="tags">
          ${post.tags
            .map(
              (tag) => `
            <span class="tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>
          `
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

function openPost(post: BlogPost) {
  window.location.hash = `post=${post.filename}`;
}

function handleRoute() {
  const hash = window.location.hash;

  if (hash.startsWith("#post=")) {
    const filename = hash.replace("#post=", "");
    const post = normalizedPosts.find((p) => p.filename === filename);

    if (post) {
      void renderPost(post);
      return;
    }
  }

  if (hash.startsWith("#tag=")) {
    const tag = decodeURIComponent(hash.replace("#tag=", "").trim());
    const filtered = normalizedPosts.filter((post) =>
      post.tags.some((t) => t.trim().toLowerCase() === tag.toLowerCase())
    );

    searchInput.style.display = "block";
    searchInput.value = "";
    renderPostList(filtered);
    return;
  }

  renderPostList(normalizedPosts);
}

async function renderPost(post: BlogPost) {
  searchInput.style.display = "none";

  const markdown = await fetch(`./blogposts/${post.filename}`).then((res) =>
    res.text()
  );

  const html = parseMarkdown(markdown);

  content.innerHTML = `
    <div class="back-btn" id="backBtn">← Back to Home</div>
    <div class="post-view">
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-meta">
        ${escapeHtml(post.author)} • ${post.date.toDateString()}
      </div>
      <div class="post-body">${html}</div>
    </div>
  `;

  document.getElementById("backBtn")!.addEventListener("click", () => {
    window.location.hash = "";
  });

  await renderMermaidDiagrams();
}

function parseMarkdown(md: string): string {
  const markedLib = window.marked;
  const renderer = new markedLib.Renderer();

  renderer.image = (token: any) => {
    let src = token.href;

    if (typeof src !== "string") {
      console.error("Invalid image src:", token);
      return "";
    }

    if (!src.startsWith("http")) {
      src = `./images/${src}`;
    }

    return `<img src="${src}" alt="${escapeHtml(token.text || "")}" ${
      token.title ? `title="${escapeHtml(token.title)}"` : ""
    } />`;
  };

  renderer.code = (token: any) => {
    const lang = (token.lang || "").trim().toLowerCase();
    const code = token.text || "";

    if (lang === "mermaid") {
      return `<pre class="mermaid">${escapeHtml(code)}</pre>`;
    }

    const className = lang ? ` class="language-${escapeHtml(lang)}"` : "";
    return `<pre><code${className}>${escapeHtml(code)}</code></pre>`;
  };

  markedLib.setOptions({
    breaks: true,
    gfm: true,
  });

  return markedLib.parse(md, { renderer });
}

async function renderMermaidDiagrams() {
  const mermaidBlocks = content.querySelectorAll("pre.mermaid");
  if (!mermaidBlocks.length) return;

  if (!mermaidInitialized) {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });
    mermaidInitialized = true;
  }

  try {
    await window.mermaid.run({
      nodes: mermaidBlocks,
    });
  } catch (error) {
    console.error("Failed to render Mermaid diagram(s):", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

init();