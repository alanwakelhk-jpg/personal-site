/**
 * 文章列表（首页）：拉取 /api/articles，支持「加载更多」
 * 后端不可用时回退到 config.fallbackArticles（演示模式）
 */
import { fetchArticles } from './api.js';
import { formatDate } from './ui.js';

const PAGE_SIZE = 5;

export function initArticles() {
  const listEl = document.getElementById('articleList');
  const moreBtn = document.getElementById('articleMore');
  const statusEl = document.getElementById('articleStatus');
  if (!listEl) return;

  let offset = 0;
  let total = 0;
  let loading = false;
  let offline = false;

  // 骨架屏
  listEl.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';

  function escapeText(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function cardHtml(item) {
    const tags = Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',').filter(Boolean);
    const date = formatDate(item.created_at, false);
    return `
      <a class="article-card reveal" href="./article.html?id=${encodeURIComponent(item.id)}">
        <div class="article-meta">
          <span>${escapeText(date)}</span>
          ${item.views ? `<span>阅读 ${Number(item.views) || 0}</span>` : ''}
        </div>
        <h3>${escapeText(item.title)}</h3>
        <p class="article-summary">${escapeText(item.summary || '')}</p>
        <div class="article-tags">
          ${tags.map((t) => `<span class="mini-tag">${escapeText(String(t).trim())}</span>`).join('')}
        </div>
      </a>`;
  }

  async function load(reset = false) {
    if (loading) return;
    loading = true;
    if (moreBtn) moreBtn.disabled = true;

    try {
      const data = await fetchArticles({ limit: PAGE_SIZE, offset: reset ? 0 : offset });
      const items = data.items || [];
      total = data.total || items.length;
      offline = !!data.offline;

      if (reset) {
        listEl.innerHTML = '';
        offset = 0;
      }

      if (!items.length && reset) {
        listEl.innerHTML = '<div class="empty-tip">还没有文章。调用 POST /api/articles（需管理员令牌）即可发布第一篇。</div>';
      } else {
        listEl.insertAdjacentHTML('beforeend', items.map(cardHtml).join(''));
      }

      offset += items.length;

      const shown = offset;
      if (statusEl) {
        statusEl.textContent = offline
          ? `当前为演示模式（后端接口不可用），展示 js/config.js 中的示例文章。`
          : `已加载 ${shown} / ${total} 篇`;
        statusEl.classList.toggle('warn', offline);
      }

      if (moreBtn) moreBtn.hidden = offline || offset >= total;
    } catch (err) {
      if (reset) {
        listEl.innerHTML = `<div class="empty-tip">文章加载失败：${escapeText(err.message)}</div>`;
      }
      if (statusEl) {
        statusEl.textContent = '加载失败：' + err.message;
        statusEl.classList.add('warn');
      }
    } finally {
      loading = false;
      if (moreBtn) moreBtn.disabled = false;
      // 重新观察新加入的卡片
      const { observeReveal } = await import('./ui.js');
      observeReveal('.reveal:not(.visible)');
    }
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', () => load(false));
  }

  load(true);
}
