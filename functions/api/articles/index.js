/**
 * GET  /api/articles        文章列表（支持 ?limit=&offset=&tag=&q=）
 * POST /api/articles        新增文章（需要 ADMIN_TOKEN）
 */
import { ok, fail, readJson, str, clampInt, guardAdmin, noDB } from '../../_lib/utils.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return noDB();

  const url = new URL(request.url);
  const limit = clampInt(url.searchParams.get('limit'), 1, 50, 10);
  const offset = clampInt(url.searchParams.get('offset'), 0, 100000, 0);
  const tag = str(url.searchParams.get('tag'), 50);
  const q = str(url.searchParams.get('q'), 50);

  let sql = 'SELECT id, title, summary, tags, cover, views, created_at, updated_at FROM articles WHERE published = 1';
  const args = [];

  if (tag) {
    sql += ' AND tags LIKE ?';
    args.push('%' + tag + '%');
  }
  if (q) {
    sql += ' AND (title LIKE ? OR summary LIKE ?)';
    args.push('%' + q + '%', '%' + q + '%');
  }

  sql += ' ORDER BY datetime(created_at) DESC, id DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const { results } = await env.DB.prepare(sql).bind(...args).all();

  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) AS total FROM articles WHERE published = 1'
  ).first();

  return ok({
    items: (results || []).map((row) => ({
      ...row,
      tags: row.tags ? String(row.tags).split(',').filter(Boolean) : [],
    })),
    total: countRow ? countRow.total : 0,
    limit,
    offset,
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return noDB();
  const denied = guardAdmin(request, env);
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return fail('请求体必须是合法 JSON');

  const title = str(body.title, 200);
  const content = str(body.content, 200000);
  if (!title) return fail('title 不能为空');
  if (!content) return fail('content 不能为空');

  const summary = str(body.summary, 500) || content.replace(/\s+/g, ' ').slice(0, 120);
  const tags = Array.isArray(body.tags) ? body.tags.map((t) => str(t, 30)).filter(Boolean).join(',') : str(body.tags, 200);
  const cover = str(body.cover, 500);
  const published = body.published === 0 || body.published === false ? 0 : 1;
  const now = new Date().toISOString();

  const result = await env.DB.prepare(
    `INSERT INTO articles (title, summary, content, tags, cover, published, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(title, summary, content, tags, cover, published, now, now)
    .run();

  return ok({
    id: result.meta && result.meta.last_row_id ? result.meta.last_row_id : null,
    created_at: now,
  });
}
