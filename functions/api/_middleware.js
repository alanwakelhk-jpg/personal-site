import { json, fail, corsHeaders } from '../_lib/utils.js';

/**
 * /api/* 全局中间件
 * 作用：统一处理 OPTIONS 预检 + 兜底异常 + 追加 CORS 头
 */
export async function onRequest(context) {
  const { request, env, next } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(env) });
  }

  try {
    const response = await next();
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders(env)).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  } catch (err) {
    return json(
      { ok: false, error: '服务器内部错误：' + (err && err.message ? err.message : String(err)) },
      { status: 500, headers: corsHeaders(env) }
    );
  }
}
