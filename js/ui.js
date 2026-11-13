/**
 * 通用 UI 工具
 */

/** 轻提示 */
let toastTimer = null;
export function toast(message, duration = 2400) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

/** 把各种时间字符串转成 Date（把 D1 的 "YYYY-MM-DD HH:mm:ss" 当作 UTC） */
export function toDate(value) {
  if (!value) return null;
  let s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) s = s.replace(' ', 'T') + 'Z';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 格式化为本地时间：2026-11-13 16:05 */
export function formatDate(value, withTime = true) {
  const d = toDate(value);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return withTime ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
}

/** 相对时间：刚刚 / 5 分钟前 / 3 天前 / 具体日期 */
export function timeAgo(value) {
  const d = toDate(value);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} 天前`;
  return formatDate(value, false);
}

/** 防抖 */
export function debounce(fn, wait = 200) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** 生成头像文字（昵称首字） */
export function initialOf(name) {
  const s = String(name || '').trim();
  return s ? s.slice(0, 1).toUpperCase() : '匿';
}

/** 元素进入视口时加 class（滚动入场动画） */
export function observeReveal(selector = '.reveal') {
  const els = document.querySelectorAll(selector);
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  els.forEach((el) => io.observe(el));
}
