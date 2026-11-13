/**
 * 主入口：主题切换、导航、首屏轮播、站长介绍、联系方式、粒子特效
 * 各功能模块（音乐 / 文章 / 照片墙 / 留言）从这里统一初始化
 */
import { SITE_CONFIG, CONTACT_ICONS } from './config.js';
import { initParticles, setParticleTheme } from './particles.js';
import { observeReveal, toast } from './ui.js';
import { initMusic } from './music.js';
import { initArticles } from './articles.js';
import { initGallery } from './gallery.js';
import { initMessages } from './messages.js';

/* ============================================================
   1. 主题（深色 / 浅色）
   ============================================================ */
const THEME_KEY = 'site-theme';

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  // 未保存过时跟随系统
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setParticleTheme(theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#eef3fb' : '#05070f');
}

function initTheme() {
  applyTheme(getPreferredTheme());

  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    toast(next === 'light' ? '已切换到浅色模式' : '已切换到深色模式', 1500);
  });

  // 用户没手动设置过时，跟随系统变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });
  }
}

/* ============================================================
   2. 顶部导航
   ============================================================ */
function initHeader() {
  const header = document.getElementById('siteHeader');
  const nav = document.getElementById('mainNav');
  const toggle = document.getElementById('navToggle');

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  // 滚动高亮当前区块
  const links = [...document.querySelectorAll('.nav-link')].filter((a) => a.hash);
  const sections = links
    .map((a) => document.querySelector(a.hash))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => {
            a.classList.toggle('active', a.hash === '#' + entry.target.id);
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
  }
}

/* ============================================================
   3. 首屏照片轮播
   ============================================================ */
function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const dotsBox = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const carousel = document.getElementById('carousel');
  if (!track || !carousel) return;

  const slides = SITE_CONFIG.heroSlides || [];
  if (!slides.length) return;

  let index = 0;
  let autoTimer = null;
  const INTERVAL = SITE_CONFIG.carouselInterval || 0;

  // 渲染幻灯片
  track.innerHTML = slides
    .map((slide, i) => {
      const bg = slide.url
        ? `background-image:url('${slide.url.replace(/'/g, "\\'")}')`
        : `background:${slide.gradient || 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)'}`;
      return `
        <div class="slide ${i === 0 ? 'active' : ''}" data-index="${i}">
          <div class="slide-bg" style="${bg}"></div>
          <div class="slide-caption">
            <span class="hero-badge">${escapeText(SITE_CONFIG.siteName)}</span>
            <h1>${escapeText(slide.title || '')}</h1>
            <p>${escapeText(slide.subtitle || '')}</p>
          </div>
        </div>`;
    })
    .join('');

  // 指示点
  if (dotsBox) {
    dotsBox.innerHTML = slides
      .map((_, i) => `<button type="button" data-index="${i}" class="${i === 0 ? 'active' : ''}" aria-label="第 ${i + 1} 张"></button>`)
      .join('');
    dotsBox.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-index]');
      if (!btn) return;
      goTo(Number(btn.dataset.index), true);
    });
  }

  function goTo(next, manual = false) {
    const total = slides.length;
    index = ((next % total) + total) % total;
    track.style.transform = `translateX(-${index * 100}%)`;
    track.querySelectorAll('.slide').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
    if (dotsBox) {
      dotsBox.querySelectorAll('button').forEach((d, i) => d.classList.toggle('active', i === index));
    }
    if (manual) restartAuto();
  }

  function next() {
    goTo(index + 1);
  }
  function prev() {
    goTo(index - 1);
  }

  function startAuto() {
    if (!INTERVAL) return;
    stopAuto();
    autoTimer = setInterval(next, INTERVAL);
  }
  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }
  function restartAuto() {
    stopAuto();
    startAuto();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAuto(); });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopAuto() : startAuto();
  });

  // 键盘左右切换
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prev(); restartAuto(); }
    if (e.key === 'ArrowRight') { next(); restartAuto(); }
  });

  // 触摸滑动
  let touchStartX = 0;
  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAuto();
  }, { passive: true });
  carousel.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 46) delta > 0 ? prev() : next();
    startAuto();
  }, { passive: true });

  startAuto();
}

/* ============================================================
   4. 站长介绍 + 联系方式
   ============================================================ */
function escapeText(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderOwner() {
  const { owner } = SITE_CONFIG;

  const avatar = document.getElementById('ownerAvatar');
  if (avatar) {
    avatar.src = owner.avatar || '';
    avatar.alt = owner.nickname + ' 的头像';
    avatar.onerror = () => {
      // 头像加载失败时用文字占位
      avatar.style.display = 'none';
      const box = avatar.parentElement;
      if (box && !box.querySelector('.avatar-fallback')) {
        const span = document.createElement('span');
        span.className = 'avatar-fallback';
        span.style.cssText = 'display:grid;place-items:center;width:100%;height:100%;border-radius:23px;font-size:44px;font-weight:700;color:#021018;background:linear-gradient(135deg,#00e5ff,#7c4dff)';
        span.textContent = (owner.nickname || 'A').slice(0, 1);
        box.appendChild(span);
      }
    };
  }

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  };
  setText('ownerName', owner.nickname);
  setText('ownerTitle', owner.title);
  setText('ownerBio', owner.bio);

  const skills = document.getElementById('ownerSkills');
  if (skills) {
    skills.innerHTML = (owner.skills || []).map((s) => `<span class="tag">${escapeText(s)}</span>`).join('');
  }

  const grid = document.getElementById('resourceGrid');
  if (grid) {
    grid.innerHTML = (owner.resources || [])
      .map(
        (r) => `
        <a class="resource-card reveal" href="${escapeText(r.url || '#')}"${/^https?:/.test(r.url || '') ? ' target="_blank" rel="noopener noreferrer"' : ''}>
          <span class="resource-icon">${escapeText(r.icon || '🔗')}</span>
          <div class="resource-name">${escapeText(r.name || '')}</div>
          <div class="resource-desc">${escapeText(r.desc || '')}</div>
        </a>`
      )
      .join('');
  }
}

function renderContacts() {
  const grid = document.getElementById('contactGrid');
  if (!grid) return;

  const items = (SITE_CONFIG.contacts || []).filter((c) => c && (c.value || c.url));
  if (!items.length) {
    grid.innerHTML = '<div class="empty-tip">还没有配置联系方式，请在 js/config.js 的 contacts 中添加。</div>';
    return;
  }

  grid.innerHTML = items
    .map((c) => {
      const icon = CONTACT_ICONS[c.icon] || CONTACT_ICONS.link;
      const tag = c.url ? 'a' : 'div';
      const attrs = c.url
        ? `href="${escapeText(c.url)}"${/^https?:/.test(c.url) ? ' target="_blank" rel="noopener noreferrer"' : ''}`
        : '';
      return `
        <${tag} class="contact-item" ${attrs}>
          <span class="contact-icon">${icon}</span>
          <span class="contact-text">
            <span class="contact-label">${escapeText(c.label || '')}</span>
            <span class="contact-value">${escapeText(c.value || '')}</span>
          </span>
        </${tag}>`;
    })
    .join('');
}

/* ============================================================
   5. 初始化
   ============================================================ */
function initBrand() {
  const brand = document.getElementById('brandText');
  if (brand) brand.textContent = SITE_CONFIG.siteName;
  const footerName = document.getElementById('footerName');
  if (footerName) footerName.textContent = SITE_CONFIG.siteName;
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  document.title = SITE_CONFIG.siteName;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && SITE_CONFIG.siteDescription) desc.setAttribute('content', SITE_CONFIG.siteDescription);
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initBrand();
  initHeader();
  initParticles('particle-canvas');
  renderOwner();
  renderContacts();
  initCarousel();
  observeReveal('.reveal');

  // 功能模块
  initMusic();
  initArticles();
  initGallery();
  initMessages();
});
