/**
 * GET  /api/photos   照片墙列表
 * POST /api/photos   新增照片（需要 ADMIN_TOKEN）
 */
import { ok, fail, readJson, str, clampInt, guardAdmin, noDB } from '../../_lib/utils.js';

export async function onRequestGet({ env }) {
  if (!env.DB) return noDB();

  const { results } = await env.DB.prepare(
    'SELECT id, title, url, description, sort, created_at FROM photos ORDER BY sort ASC, id ASC'
  ).all();

  return ok({ items: results || [] });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return noDB();
  const denied = guardAdmin(request, env);
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return fail('请求体必须是合法 JSON');

  const url = str(body.url, 1000);
  if (!url) return fail('url 不能为空');

  const title = str(body.title, 100);
  const description = str(body.description, 300);
  const sort = clampInt(body.sort, 0, 100000, 0);
  const now = new Date().toISOString();

  const result = await env.DB.prepare(
    'INSERT INTO photos (title, url, description, sort, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(title, url, description, sort, now)
    .run();

  return ok({ id: result.meta && result.meta.last_row_id ? result.meta.last_row_id : null, created_at: now });
}
