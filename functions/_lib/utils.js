/**
 * Cloudflare Pages Functions 公共工具
 * 说明：以 _ 开头的目录/文件不会被注册为路由，可安全存放公共模块。
 */

/** 返回 JSON 响应 */
export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

/** 成功响应：{ ok: true, data } */
export function ok(data, extra = {}) {
  return json({ ok: true, data, ...extra });
}

/** 失败响应：{ ok: false, error } */
export function fail(message, status = 400) {
  return json({ ok: false, error: message }, { status });
}

/** 安全读取 JSON body */
export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

/** 字符串清洗：转字符串、去首尾空格、截断、可选去控制字符 */
export function str(value, max = 1000) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

/** 整数取值并夹在区间内 */
export function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** 管理员鉴权：请求头需携带 Authorization: Bearer <ADMIN_TOKEN> 或 X-Admin-Token */
export function isAdmin(request, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) return false; // 未配置 ADMIN_TOKEN 时一律拒绝写操作
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const headerToken = (request.headers.get('x-admin-token') || '').trim();
  return bearer === expected || headerToken === expected;
}

/** 写操作统一守卫：返回 null 表示通过，返回 Response 表示拒绝 */
export function guardAdmin(request, env) {
  if (!env.ADMIN_TOKEN) {
    return fail('服务端未配置 ADMIN_TOKEN，写操作已禁用。请在 Cloudflare Pages 环境变量中添加 ADMIN_TOKEN。', 503);
  }
  if (!isAdmin(request, env)) {
    return fail('未授权：需要有效的管理员令牌', 401);
  }
  return null;
}

/** 取客户端 IP */
export function clientIp(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    ''
  ).split(',')[0].trim();
}

/** SHA-256 十六进制摘要（用于 IP 脱敏存储） */
export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 简单 CORS 头 */
export function corsHeaders(env = {}) {
  return {
    'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-admin-token',
    'access-control-max-age': '86400',
  };
}

/** 数据库未绑定的统一报错 */
export function noDB() {
  return fail('服务端未绑定 D1 数据库（env.DB 不存在）。请按 README 配置 D1 绑定并重新部署。', 500);
}
