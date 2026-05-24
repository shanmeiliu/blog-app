import { posts } from "./manifest.js";
const content = document.getElementById("content");
const searchInput = document.getElementById("search");
const searchModeSelect = document.getElementById("searchMode");
const advancedFilter = document.getElementById("advancedFilter");
const tagSearchInput = document.getElementById("tagSearch");
const selectedTagsEl = document.getElementById("selectedTags");
const tagLettersEl = document.getElementById("tagLetters");
const tagBrowserEl = document.getElementById("tagBrowser");
const logicOrBtn = document.getElementById("logicOr");
const logicAndBtn = document.getElementById("logicAnd");
let searchMode = "default";
let selectedTags = [];
let advancedLogic = "OR";
let activeTagLetter = "A";
let tagSearchQuery = "";
let debounceTimer;
let mermaidInitialized = false;
let activeSearchQuery = "";
const normalizedPosts = normalizePosts(posts);
window.addEventListener("DOMContentLoaded", init);
function normalizePosts(posts) {
    return posts.map((p) => ({
        ...p,
        date: new Date(p.date),
        modifiedDate: new Date(p.modifiedDate),
    }));
}
function init() {
    console.log("Posts loaded:", normalizedPosts);
    handleRoute();
    window.addEventListener("hashchange", handleRoute);
    searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
            activeSearchQuery = searchInput.value.trim().toLowerCase();
            window.location.hash = "";
            renderPostList(filterPosts(normalizedPosts));
        }, 300);
    });
    searchModeSelect.addEventListener("change", () => {
        searchMode = searchModeSelect.value;
        selectedTags = [];
        tagSearchQuery = "";
        tagSearchInput.value = "";
        activeSearchQuery = "";
        searchInput.value = "";
        if (searchMode === "advanced") {
            searchInput.style.display = "none";
            advancedFilter.classList.remove("hidden");
            renderAdvancedFilter();
            applyAdvancedFilter();
        }
        else {
            advancedFilter.classList.add("hidden");
            searchInput.style.display = "block";
            renderPostList(filterPosts(normalizedPosts));
        }
    });
    logicOrBtn.addEventListener("click", () => {
        advancedLogic = "OR";
        logicOrBtn.classList.add("active");
        logicAndBtn.classList.remove("active");
        applyAdvancedFilter();
    });
    logicAndBtn.addEventListener("click", () => {
        advancedLogic = "AND";
        logicAndBtn.classList.add("active");
        logicOrBtn.classList.remove("active");
        applyAdvancedFilter();
    });
    tagSearchInput.addEventListener("input", () => {
        tagSearchQuery = tagSearchInput.value.trim();
        renderAdvancedFilter();
    });
    tagLettersEl.addEventListener("click", (e) => {
        const button = e.target.closest(".tag-letter");
        if (!button)
            return;
        activeTagLetter = button.dataset.letter || "A";
        tagSearchQuery = "";
        tagSearchInput.value = "";
        renderAdvancedFilter();
    });
    tagBrowserEl.addEventListener("click", (e) => {
        const button = e.target.closest(".filter-tag");
        if (!button)
            return;
        const tag = button.dataset.filterTag;
        if (!tag)
            return;
        selectedTags = selectedTags.includes(tag)
            ? selectedTags.filter((t) => t !== tag)
            : [...selectedTags, tag];
        applyAdvancedFilter();
    });
    selectedTagsEl.addEventListener("click", (e) => {
        const button = e.target.closest(".selected-tag");
        if (!button)
            return;
        const tag = button.dataset.removeTag;
        if (!tag)
            return;
        selectedTags = selectedTags.filter((t) => t !== tag);
        applyAdvancedFilter();
    });
    content.addEventListener("click", (e) => {
        const tagEl = e.target.closest(".tag");
        if (!tagEl)
            return;
        e.preventDefault();
        e.stopPropagation();
        const tag = tagEl.dataset.tag;
        if (!tag)
            return;
        // Reset advanced filter state when using the old tag filter
        searchMode = "default";
        searchModeSelect.value = "default";
        selectedTags = [];
        tagSearchQuery = "";
        tagSearchInput.value = "";
        advancedFilter.classList.add("hidden");
        searchInput.style.display = "block";
        activeSearchQuery = "";
        searchInput.value = "";
        window.location.hash = `tag=${encodeURIComponent(tag.trim())}`;
    });
}
function filterPosts(list) {
    const query = activeSearchQuery;
    if (!query) {
        return sortByDate(list);
    }
    return sortByDate(list.filter((p) => p.title.toLowerCase().includes(query) ||
        p.author.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        p.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        p.searchWords.some((word) => word.toLowerCase().includes(query))));
}
function sortByDate(list) {
    return [...list].sort((a, b) => b.date.getTime() - a.date.getTime());
}
function getAllTags() {
    return Array.from(new Set(normalizedPosts.flatMap((post) => post.tags))).sort((a, b) => a.localeCompare(b));
}
function filterPostsByAdvancedTags(list) {
    if (selectedTags.length === 0)
        return sortByDate(list);
    return sortByDate(list.filter((post) => {
        const postTags = post.tags.map((tag) => tag.toLowerCase());
        if (advancedLogic === "AND") {
            return selectedTags.every((tag) => postTags.includes(tag.toLowerCase()));
        }
        return selectedTags.some((tag) => postTags.includes(tag.toLowerCase()));
    }));
}
function renderAdvancedFilter() {
    const allTags = getAllTags();
    selectedTagsEl.innerHTML = selectedTags
        .map((tag) => `
        <button class="selected-tag" data-remove-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)} ×
        </button>
      `)
        .join("");
    const letters = Array.from(new Set(allTags.map((tag) => tag[0]?.toUpperCase()).filter(Boolean)));
    tagLettersEl.innerHTML = letters
        .map((letter) => `
        <button class="tag-letter ${letter === activeTagLetter ? "active" : ""}" data-letter="${letter}">
          ${letter}
        </button>
      `)
        .join("");
    const visibleTags = allTags.filter((tag) => {
        const matchesLetter = tag.toUpperCase().startsWith(activeTagLetter);
        const matchesSearch = tag
            .toLowerCase()
            .includes(tagSearchQuery.toLowerCase());
        return tagSearchQuery ? matchesSearch : matchesLetter;
    });
    tagBrowserEl.innerHTML = visibleTags
        .map((tag) => `
        <button class="filter-tag ${selectedTags.includes(tag) ? "active" : ""}" data-filter-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)}
        </button>
      `)
        .join("");
}
function applyAdvancedFilter() {
    window.location.hash = "";
    renderPostList(filterPostsByAdvancedTags(normalizedPosts));
    renderAdvancedFilter();
}
function highlightMatch(text) {
    if (!activeSearchQuery)
        return escapeHtml(text);
    const escapedText = escapeHtml(text);
    const escapedQuery = activeSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    return escapedText.replace(regex, "<mark>$1</mark>");
}
function renderPostList(list) {
    // searchInput.style.display = "block";
    searchInput.style.display = searchMode === "default" ? "block" : "none";
    advancedFilter.classList.toggle("hidden", searchMode !== "advanced");
    const isTagPage = window.location.hash.startsWith("#tag=");
    const tagName = isTagPage
        ? decodeURIComponent(window.location.hash.replace("#tag=", ""))
        : "";
    const filterLabel = isTagPage
        ? `<button class="clear-filter" id="clearTagFilter">Clear tag: #${escapeHtml(tagName)}</button>`
        : "";
    content.innerHTML = `
    ${filterLabel}

    <div class="result-count">
      ${list.length} post${list.length === 1 ? "" : "s"} found
    </div>

    <div class="post-list">
      ${list.map(renderPostCard).join("")}
    </div>
  `;
    list.forEach((post) => {
        const el = document.getElementById(post.filename);
        el?.addEventListener("click", (e) => {
            const target = e.target;
            if (target.closest(".tag")) {
                return;
            }
            openPost(post);
        });
    });
    document.getElementById("clearTagFilter")?.addEventListener("click", () => {
        history.pushState("", document.title, window.location.pathname + window.location.search);
        activeSearchQuery = "";
        searchInput.value = "";
        handleRoute();
    });
    const images = content.querySelectorAll(".post-card img");
    images.forEach((el) => {
        const img = el;
        img.onerror = () => {
            img.onerror = null;
            img.src = "thumbs/fallback.png";
        };
    });
}
function renderPostCard(post) {
    const isActiveTag = (tag) => {
        const hash = window.location.hash;
        if (!hash.startsWith("#tag="))
            return false;
        const activeTag = decodeURIComponent(hash.replace("#tag=", ""));
        return activeTag.toLowerCase() === tag.toLowerCase();
    };
    return `
    <article class="post-card" id="${escapeHtml(post.filename)}">
      <img 
        src="./thumbs/${escapeHtml(post.filename.replace(".md", ".png"))}" 
        alt="${escapeHtml(post.title)} thumbnail"
      />

      <div>
        <h3>${highlightMatch(post.title)}</h3>

        <div class="post-meta">
          ${highlightMatch(post.author)} • ${post.date.toDateString()} • ${escapeHtml(post.readingTime)}
        </div>

        <p class="post-excerpt">
          ${highlightMatch(post.excerpt)}
        </p>

        <div class="tags">
          ${post.tags
        .map((tag) => `
                <span 
                  class="tag ${isActiveTag(tag) ? "active-tag" : ""}" 
                  data-tag="${escapeHtml(tag)}"
                >
                  ${highlightMatch(tag)}
                </span>
              `)
        .join("")}
        </div>
      </div>
    </article>
  `;
}
function openPost(post) {
    window.location.hash = `post=${encodeURIComponent(post.filename)}`;
}
function handleRoute() {
    const hash = window.location.hash;
    if (hash.startsWith("#post=")) {
        const filename = decodeURIComponent(hash.replace("#post=", ""));
        const post = normalizedPosts.find((p) => p.filename === filename);
        if (post) {
            void renderPost(post);
            return;
        }
    }
    if (hash.startsWith("#tag=")) {
        const tag = decodeURIComponent(hash.replace("#tag=", "")).trim();
        const filtered = normalizedPosts.filter((post) => post.tags.some((t) => t.trim().toLowerCase() === tag.toLowerCase()));
        searchInput.style.display = "block";
        searchInput.value = "";
        activeSearchQuery = "";
        renderPostList(sortByDate(filtered));
        return;
    }
    renderPostList(filterPosts(normalizedPosts));
}
async function renderPost(post) {
    searchInput.style.display = "none";
    const markdown = await fetch(`./blogposts/${post.filename}`).then((res) => res.text());
    const html = parseMarkdown(stripDuplicateTitle(markdown, post.title));
    content.innerHTML = `
    <button class="back-btn" id="backBtn">← Back to Home</button>

    <article class="post-view">
      <h1>${escapeHtml(post.title)}</h1>

      <div class="post-meta">
        ${escapeHtml(post.author)} • ${post.date.toDateString()} • ${escapeHtml(post.readingTime)}
      </div>

      ${html}
    </article>
  `;
    document.getElementById("backBtn").addEventListener("click", () => {
        history.pushState("", document.title, window.location.pathname + window.location.search);
        activeSearchQuery = "";
        searchInput.value = "";
        handleRoute();
    });
    await renderMermaidDiagrams();
    initCodeCopyButtons();
}
function parseMarkdown(md) {
    const markedLib = window.marked;
    const renderer = new markedLib.Renderer();
    renderer.image = (token) => {
        let src = token.href;
        const alt = token.text || "";
        const title = token.title || "";
        if (typeof src !== "string") {
            console.error("Invalid image src:", token);
            return "";
        }
        if (!src.startsWith("http")) {
            src = `./images/${src}`;
        }
        return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" title="${escapeHtml(title)}" />`;
    };
    renderer.code = (token) => {
        const lang = (token.lang || "").trim().toLowerCase();
        const code = token.text || "";
        if (lang === "mermaid") {
            return `
        <pre class="mermaid">
${escapeHtml(code)}
        </pre>
      `;
        }
        const className = lang ? ` class="language-${escapeHtml(lang)}"` : "";
        return `
  <div class="code-block-wrapper">
    <button class="copy-code-btn" type="button">Copy</button>
    <pre><code${className}>${escapeHtml(code)}</code></pre>
  </div>
`;
    };
    markedLib.setOptions({
        breaks: true,
        gfm: true,
    });
    return markedLib.parse(md, { renderer });
}
async function renderMermaidDiagrams() {
    const mermaidBlocks = content.querySelectorAll("pre.mermaid");
    if (!mermaidBlocks.length)
        return;
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
    }
    catch (error) {
        console.error("Failed to render Mermaid diagram(s):", error);
    }
}
function stripDuplicateTitle(markdown, title) {
    const lines = markdown.split("\n");
    const firstMeaningfulLineIndex = lines.findIndex((line) => line.trim());
    if (firstMeaningfulLineIndex === -1)
        return markdown;
    const firstLine = lines[firstMeaningfulLineIndex].trim();
    const normalizedTitle = title.trim().toLowerCase();
    if (firstLine.startsWith("# ") &&
        firstLine.replace(/^#\s+/, "").trim().toLowerCase() === normalizedTitle) {
        lines.splice(firstMeaningfulLineIndex, 1);
    }
    return lines.join("\n").trimStart();
}
function initCodeCopyButtons() {
    const buttons = content.querySelectorAll(".copy-code-btn");
    buttons.forEach((button) => {
        button.addEventListener("click", async () => {
            const wrapper = button.closest(".code-block-wrapper");
            const code = wrapper?.querySelector("code")?.textContent || "";
            if (!code)
                return;
            await navigator.clipboard.writeText(code);
            button.textContent = "Copied!";
            window.setTimeout(() => {
                button.textContent = "Copy";
            }, 1200);
        });
    });
}
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
