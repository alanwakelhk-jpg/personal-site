/**
 * 统一接口封装 + 演示模式兜底
 * 若 /api 接口不可用（例如只发布了静态页面、没绑定 D1），自动降级到 config 里的本地数据，
 * 让站点在任何情况下都能正常展示。
 */

const API_BASE = '/api';

/** 内存缓存：判断后端是否可用，避免每次都等超时 */
const state = {
  backendDown: false,
};

async function request(path, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(API_BASE + path, {
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload || payload.ok === false) {
      const msg = (payload && payload.error) || `请求失败（HTTP ${res.status}）`;
      throw new Error(msg);
    }
    state.backendDown = false;
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- 文章 ---------------- */
export async function fetchArticles({ limit = 10, offset = 0 } = {}) {
  try {
    return { ...(await request(`/articles?limit=${limit}&offset=${offset}`)), offline: false };
  } catch (e) {
    state.backendDown = true;
    const { SITE_CONFIG } = await import('./config.js');
    const items = SITE_CONFIG.fallbackArticles.slice(offset, offset + limit);
    return { items, total: SITE_CONFIG.fallbackArticles.length, offline: true, error: e.message };
  }
}

export async function fetchArticle(id) {
  try {
    return { ...(await request(`/articles/${id}`)), offline: false };
  } catch (e) {
    const { SITE_CONFIG } = await import('./config.js');
    const found = SITE_CONFIG.fallbackArticles.find((a) => String(a.id) === String(id));
    if (found) return { ...found, offline: true };
    throw e;
  }
}

/* ---------------- 留言 ---------------- */
export async function fetchMessages({ limit = 20, offset = 0 } = {}) {
  try {
    return { ...(await request(`/messages?limit=${limit}&offset=${offset}`)), offline: false };
  } catch (e) {
    // 演示模式：读取浏览器本地保存的留言
    const local = readLocalMessages();
    return {
      items: local.slice(offset, offset + limit),
      total: local.length,
      offline: true,
      error: e.message,
    };
  }
}

export async function postMessage(payload) {
  try {
    return { data: await request('/messages', { method: 'POST', body: JSON.stringify(payload) }), offline: false };
  } catch (e) {
    // 只有在后端不可用（网络/未部署）时才走本地演示；服务端明确拒绝（如防刷、校验）要如实报错
    if (/提交过于频繁|不能为空|长度|至少|超过/.test(e.message)) throw e;
    const item = {
      id: Date.now(),
      nickname: payload.nickname,
      content: payload.content,
      contact: payload.contact || '',
      created_at: new Date().toISOString(),
    };
    saveLocalMessage(item);
    return { data: item, offline: true };
  }
}

/* ---------------- 照片墙 ---------------- */
export async function fetchPhotos() {
  try {
    const data = await request('/photos');
    const items = (data.items || []).filter((p) => p.url);
    if (items.length) return { items, offline: false };
    const { SITE_CONFIG } = await import('./config.js');
    return { items: SITE_CONFIG.fallbackPhotos, offline: true };
  } catch (e) {
    const { SITE_CONFIG } = await import('./config.js');
    return { items: SITE_CONFIG.fallbackPhotos, offline: true, error: e.message };
  }
}

/* ---------------- 本地留言存储（演示模式） ---------------- */
const LS_KEY = 'site_messages_demo';

function readLocalMessages() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessage(item) {
  try {
    const list = readLocalMessages();
    list.unshift(item);
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (_) {}
}
