/**
 * GET    /api/articles/:id   文章详情（自动 +1 浏览量）
 * PUT    /api/articles/:id   更新文章（需要 ADMIN_TOKEN）
 * DELETE /api/articles/:id   删除文章（需要 ADMIN_TOKEN）
 */
import { ok, fail, readJson, str, guardAdmin, noDB, clampInt } from '../../_lib/utils.js';

export async function onRequestGet({ params, env }) {
  if (!env.DB) return noDB();
  const id = clampInt(params.id, 1, Number.MAX_SAFE_INTEGER, 0);
  if (!id) return fail('文章 id 无效', 400);

  const row = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
  if (!row) return fail('文章不存在', 404);

  // 浏览量自增（失败不影响返回）
  try {
    await env.DB.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').bind(id).run();
  } catch (_) {}

  return ok({
    ...row,
    views: (row.views || 0) + 1,
    tags: row.tags ? String(row.tags).split(',').filter(Boolean) : [],
  });
}

export async function onRequestPut({ params, request, env }) {
  if (!env.DB) return noDB();
  const denied = guardAdmin(request, env);
  if (denied) return denied;

  const id = clampInt(params.id, 1, Number.MAX_SAFE_INTEGER, 0);
  if (!id) return fail('文章 id 无效', 400);

  const exists = await env.DB.prepare('SELECT id FROM articles WHERE id = ?').bind(id).first();
  if (!exists) return fail('文章不存在', 404);

  const body = await readJson(request);
  if (!body) return fail('请求体必须是合法 JSON');

  const fields = [];
  const args = [];
  if (body.title !== undefined) {
    const title = str(body.title, 200);
    if (!title) return fail('title 不能为空');
    fields.push('title = ?');
    args.push(title);
  }
  if (body.summary !== undefined) {
    fields.push('summary = ?');
    args.push(str(body.summary, 500));
  }
  if (body.content !== undefined) {
    const content = str(body.content, 200000);
    if (!content) return fail('content 不能为空');
    fields.push('content = ?');
    args.push(content);
  }
  if (body.tags !== undefined) {
    const tags = Array.isArray(body.tags)
      ? body.tags.map((t) => str(t, 30)).filter(Boolean).join(',')
      : str(body.tags, 200);
    fields.push('tags = ?');
    args.push(tags);
  }
  if (body.cover !== undefined) {
    fields.push('cover = ?');
    args.push(str(body.cover, 500));
  }
  if (body.published !== undefined) {
    fields.push('published = ?');
    args.push(body.published === 0 || body.published === false ? 0 : 1);
  }

  if (!fields.length) return fail('没有需要更新的字段');

  fields.push('updated_at = ?');
  args.push(new Date().toISOString());
  args.push(id);

  await env.DB.prepare(`UPDATE articles SET ${fields.join(', ')} WHERE id = ?`).bind(...args).run();
  return ok({ id });
}

export async function onRequestDelete({ params, request, env }) {
  if (!env.DB) return noDB();
  const denied = guardAdmin(request, env);
  if (denied) return denied;

  const id = clampInt(params.id, 1, Number.MAX_SAFE_INTEGER, 0);
  if (!id) return fail('文章 id 无效', 400);

  const result = await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
  if (result.meta && result.meta.changes === 0) return fail('文章不存在', 404);
  return ok({ id, deleted: true });
}
