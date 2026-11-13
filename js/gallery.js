/**
 * 照片墙：网格展示 + 点击放大预览（灯箱，支持左右切换、键盘操作、触摸滑动）
 */
import { fetchPhotos } from './api.js';

export function initGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const caption = document.getElementById('lightboxCaption');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  let photos = [];
  let current = 0;

  function escapeText(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function placeholderText(item, index) {
    return item.title ? escapeText(item.title) : `SAMPLE ${String(index + 1).padStart(2, '0')}`;
  }

  function render(items) {
    photos = items || [];
    if (!photos.length) {
      grid.innerHTML = '<div class="empty-tip">还没有照片。可在 D1 的 photos 表中插入，或修改 js/config.js 的 fallbackPhotos。</div>';
      return;
    }

    grid.innerHTML = photos
      .map((p, i) => {
        const hasImg = !!p.url;
        return `
        <div class="gallery-item reveal" data-index="${i}" tabindex="0" role="button" aria-label="查看图片 ${escapeText(p.title || i + 1)}">
          ${hasImg ? `<img src="${escapeText(p.url)}" alt="${escapeText(p.title || '照片')}" loading="lazy" />` : `<div class="gallery-placeholder">${placeholderText(p, i)}</div>`}
          <div class="gallery-caption">${escapeText(p.title || '')}</div>
        </div>`;
      })
      .join('');
  }

  /* ---------------- 灯箱 ---------------- */
  function open(index) {
    if (!photos.length) return;
    current = (index + photos.length) % photos.length;
    const item = photos[current];

    if (!item.url) {
      // 没有真实图片时给出提示，不打开空灯箱
      import('./ui.js').then(({ toast }) => toast('这张图还没有配置真实图片地址'));
      return;
    }

    img.src = item.url;
    img.alt = item.title || '照片';
    if (caption) {
      const parts = [item.title, item.description].filter(Boolean);
      caption.textContent = parts.join(' · ') || `${current + 1} / ${photos.length}`;
    }
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    closeBtn && closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    img.src = '';
    document.body.classList.remove('lightbox-open');
  }

  function step(delta) {
    let next = current;
    // 跳过没有图片的项
    for (let i = 0; i < photos.length; i++) {
      next = (next + delta + photos.length) % photos.length;
      if (photos[next].url) break;
    }
    open(next);
  }

  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    open(Number(item.dataset.index));
  });

  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    e.preventDefault();
    open(Number(item.dataset.index));
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => step(1));

  lightbox.addEventListener('click', (e) => {
    // 点击空白区域关闭
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // 触摸滑动
  let startX = 0;
  lightbox.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 46) step(delta > 0 ? -1 : 1);
  }, { passive: true });

  /* ---------------- 加载数据 ---------------- */
  grid.innerHTML = '<div class="skeleton" style="height:160px"></div><div class="skeleton" style="height:160px"></div><div class="skeleton" style="height:160px"></div>';

  fetchPhotos()
    .then((data) => {
      render(data.items);
      import('./ui.js').then(({ observeReveal }) => observeReveal('.gallery-item.reveal'));
    })
    .catch((err) => {
      grid.innerHTML = `<div class="empty-tip">照片加载失败：${escapeText(err.message)}</div>`;
    });
}
