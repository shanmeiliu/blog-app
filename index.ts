import { posts, BlogPost } from "./manifest.js";

const content = document.getElementById("content") as HTMLElement;
const searchInput = document.getElementById("search") as HTMLInputElement;

let debounceTimer: number | undefined;
const normalizedPosts = normalizePosts(posts);
window.addEventListener("DOMContentLoaded", init);
function normalizePosts(posts: BlogPost[]): BlogPost[] {
  return posts.map(p => ({
    ...p,
    date: new Date(p.date)
  }));
}
/* -------------------- INIT -------------------- */

function init() {
    console.log("Posts loaded:", posts);
    // const normalized = normalizePosts(posts);
    // renderPostList(normalized);
  // Initial route handling (VERY IMPORTANT)
  handleRoute();

  // Listen for URL changes (back/forward buttons)
  window.addEventListener("hashchange", handleRoute);

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);

    debounceTimer = window.setTimeout(() => {
      const query = searchInput.value.toLowerCase();
      const filtered = filterPosts(query);
      renderPostList(filtered);
    }, 300);
  });
}

/* -------------------- SEARCH -------------------- */

function filterPosts(query: string): BlogPost[] {
  if (!query) return sortByDate(posts);

  return posts.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.author.toLowerCase().includes(query) ||
    p.tags.some(tag => tag.toLowerCase().includes(query)) ||
    p.searchWords.some(word => word.toLowerCase().includes(query))
  );
}

function sortByDate(list: BlogPost[]) {
  return [...list].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/* -------------------- RENDER LIST -------------------- */

function renderPostList(list: BlogPost[]) {
  searchInput.style.display = "block";

  content.innerHTML = `
    <div class="post-list">
      ${list.map(renderPostCard).join("")}
    </div>
  `;

  list.forEach(post => {
    const el = document.getElementById(post.filename);
    el?.addEventListener("click", () => openPost(post));
  });
}

function renderPostCard(post: BlogPost): string {
  return `
    <div class="post-card" id="${post.filename}">
      <img src="./thumbs/${post.filename.replace(".md", ".png")}" />
      <div>
        <h3>${post.title}</h3>
        <div class="post-meta">
          ${post.author} • ${post.date.toDateString()}
        </div>
        <div class="tags">
          ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
        </div>
      </div>
    </div>
  `;
}

/* -------------------- OPEN POST -------------------- */
function openPost(post: BlogPost) {
  window.location.hash = `post=${post.filename}`;
}
function handleRoute() {
  const hash = window.location.hash;

  if (hash.startsWith("#post=")) {
    const filename = hash.replace("#post=", "");
    const post = normalizedPosts.find(p => p.filename === filename);

    if (post) {
      renderPost(post);
      return;
    }
  }

  // default: homepage
  renderPostList(normalizedPosts);
}
async function renderPost(post: BlogPost) {
  searchInput.style.display = "none";

  const markdown = await fetch(`./blogposts/${post.filename}`)
    .then(res => res.text());

  const html = parseMarkdown(markdown);

  content.innerHTML = `
    <div class="back-btn" id="backBtn">← Back to Home</div>
    <div class="post-view">
      <h1>${post.title}</h1>
      <div class="post-meta">
        ${post.author} • ${post.date.toDateString()}
      </div>
      <div>${html}</div>
    </div>
  `;

  document.getElementById("backBtn")!
    .addEventListener("click", () => {
      window.location.hash = "";
    });
}

/* -------------------- MARKDOWN PARSER -------------------- */

function parseMarkdown(md: string): string {
  // @ts-ignore
  const renderer = new marked.Renderer();

  renderer.image = (token: any) => {
    let src = token.href;

    if (typeof src !== "string") {
      console.error("Invalid image src:", token);
      return "";
    }

    if (!src.startsWith("http")) {
      src = `./images/${src}`;
    }

    return `<img src="${src}" alt="${token.text || ""}" ${
      token.title ? `title="${token.title}"` : ""
    } />`;
  };

  // @ts-ignore
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  // @ts-ignore
  return marked.parse(md, { renderer });
}

/* -------------------- START -------------------- */

init();