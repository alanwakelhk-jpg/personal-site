/**
 * GET  /api/messages   留言列表（支持 ?limit=&offset=）
 * POST /api/messages   提交留言（公开，带长度为 20~300 字符校验 + 60 秒防刷）
 */
import { ok, fail, readJson, str, clampInt, clientIp, sha256, noDB } from '../../_lib/utils.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return noDB();

  const url = new URL(request.url);
  const limit = clampInt(url.searchParams.get('limit'), 1, 100, 20);
  const offset = clampInt(url.searchParams.get('offset'), 0, 100000, 0);

  const { results } = await env.DB.prepare(
    `SELECT id, nickname, content, contact, created_at
       FROM messages
      WHERE status = 'visible'
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  const countRow = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM messages WHERE status = 'visible'"
  ).first();

  return ok({ items: results || [], total: countRow ? countRow.total : 0, limit, offset });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return noDB();

  const body = await readJson(request);
  if (!body) return fail('请求体必须是合法 JSON');

  const nickname = str(body.nickname, 30);
  const content = str(body.content, 500);
  const contact = str(body.contact, 100);

  if (!nickname) return fail('昵称不能为空');
  if (nickname.length < 1 || nickname.length > 30) return fail('昵称长度需在 1~30 字符之间');
  if (!content) return fail('留言内容不能为空');
  if (content.length < 2) return fail('留言内容至少 2 个字符');
  if (content.length > 500) return fail('留言内容不能超过 500 字符');

  // ---------- 防刷：同一 IP 60 秒内最多 1 条 ----------
  const ipHash = await sha256(clientIp(request) || 'unknown');
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS c FROM messages WHERE ip_hash = ? AND created_at > ?"
  )
    .bind(ipHash, new Date(Date.now() - 60 * 1000).toISOString())
    .first();
  if (recent && recent.c > 0) {
    return fail('提交过于频繁，请 1 分钟后再试', 429);
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO messages (nickname, content, contact, ip_hash, status, created_at)
     VALUES (?, ?, ?, ?, 'visible', ?)`
  )
    .bind(nickname, content, contact, ipHash, now)
    .run();

  return ok({
    id: result.meta && result.meta.last_row_id ? result.meta.last_row_id : null,
    nickname,
    content,
    contact,
    created_at: now,
  });
}
