/**
 * 文章详情页：读取 ?id=X，拉取文章并用 Markdown 渲染
 */
import { SITE_CONFIG } from './config.js';
import { fetchArticle } from './api.js';
import { renderMarkdown } from './markdown.js';
import { formatDate, toast } from './ui.js';
import { initParticles, setParticleTheme } from './particles.js';

const THEME_KEY = 'site-theme';

function escapeText(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ---------------- 主题 ---------------- */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme =
    saved === 'dark' || saved === 'light'
      ? saved
      : window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';

  document.documentElement.setAttribute('data-theme', theme);
  setParticleTheme(theme);

  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    setParticleTheme(next);
    localStorage.setItem(THEME_KEY, next);
    toast(next === 'light' ? '已切换到浅色模式' : '已切换到深色模式', 1500);
  });
}

/* ---------------- 页面初始化 ---------------- */
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initParticles('particle-canvas');

  const brand = document.getElementById('brandText');
  if (brand) brand.textContent = SITE_CONFIG.siteName;
  const footerName = document.getElementById('footerName');
  if (footerName) footerName.textContent = SITE_CONFIG.siteName;
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const holder = document.getElementById('articleDetail');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id) {
    holder.innerHTML = '<div class="empty-tip">缺少文章 id，请从文章列表进入。</div>';
    return;
  }

  try {
    const article = await fetchArticle(id);
    const tags = Array.isArray(article.tags)
      ? article.tags
      : String(article.tags || '').split(',').filter(Boolean);

    document.title = `${article.title} · ${SITE_CONFIG.siteName}`;

    holder.innerHTML = `
      <header class="article-head">
        <h1>${escapeText(article.title)}</h1>
        <div class="article-meta">
          <span>发布于 ${escapeText(formatDate(article.created_at))}</span>
          ${article.views ? `<span>阅读 ${Number(article.views) || 0}</span>` : ''}
          ${article.offline ? '<span style="color:#ffb340">演示数据</span>' : ''}
        </div>
        <div class="article-tags">
          ${tags.map((t) => `<span class="mini-tag">${escapeText(String(t).trim())}</span>`).join('')}
        </div>
      </header>
      <div class="markdown-body">${renderMarkdown(article.content || '')}</div>
    `;
  } catch (err) {
    holder.innerHTML = `<div class="empty-tip">文章加载失败：${escapeText(err.message)}</div>`;
  }
});
