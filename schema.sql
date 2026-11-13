-- ============================================================
-- Cloudflare D1 初始化脚本
--
-- 执行方式（任选其一）：
--   1) 命令行（推荐）：wrangler d1 execute personal-site-db --file=./schema.sql --remote
--   2) 控制台：Cloudflare Dashboard -> Workers & Pages -> D1 -> 选中数据库 -> Console 粘贴执行
--
-- 注意：本脚本使用 CREATE TABLE IF NOT EXISTS，可重复执行不会报错。
-- 种子数据在文件末尾，只在首次初始化时执行一次即可。
-- ============================================================

-- ------------------------------------------------------------
-- 1. 文章表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  summary     TEXT    NOT NULL DEFAULT '',
  content     TEXT    NOT NULL DEFAULT '',   -- Markdown 原文
  tags        TEXT    NOT NULL DEFAULT '',   -- 逗号分隔，如 "前端,Cloudflare"
  cover       TEXT    NOT NULL DEFAULT '',   -- 封面图 URL，可留空
  published   INTEGER NOT NULL DEFAULT 1,    -- 1 发布 / 0 草稿
  views       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL,              -- ISO 时间字符串，如 2026-11-13T08:00:00.000Z
  updated_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_articles_created   ON articles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published, created_at DESC);

-- ------------------------------------------------------------
-- 2. 留言表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname   TEXT NOT NULL,
  content    TEXT NOT NULL,
  contact    TEXT NOT NULL DEFAULT '',                 -- 可选联系方式
  ip_hash    TEXT NOT NULL DEFAULT '',                 -- IP 的 SHA-256 摘要，仅用于频率限制
  status     TEXT NOT NULL DEFAULT 'visible',          -- visible / hidden
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_ip      ON messages (ip_hash, created_at DESC);

-- ------------------------------------------------------------
-- 3. 照片墙表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL DEFAULT '',
  url         TEXT    NOT NULL,                        -- 图片地址（外链或 /assets/images/xxx.jpg）
  description TEXT    NOT NULL DEFAULT '',
  sort        INTEGER NOT NULL DEFAULT 0,              -- 越小越靠前
  created_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_photos_sort ON photos (sort ASC, id ASC);

-- ============================================================
-- 4. 种子数据（可选，首次初始化后建议删除本段）
-- ============================================================
INSERT INTO articles (title, summary, content, tags, cover, published, created_at, updated_at)
VALUES (
  '欢迎来到我的个人资源站',
  '这是一篇示例文章，用来演示 Markdown 渲染、标签与发布时间。你可以在后台接口或数据库里删掉它。',
  '## 你好，世界

这是**示例文章**，支持标准 Markdown 语法：

- 列表项一
- 列表项二
- 列表项三

### 代码块

```js
console.log("Hello, Cloudflare Pages");
```

> 引用块也可以渲染。

[访问 Cloudflare 文档](https://developers.cloudflare.com/pages/)

写完文章后，调用 `POST /api/articles`（需要 ADMIN_TOKEN）即可发布。',
  '公告,示例',
  '',
  1,
  '2026-11-13T08:00:00.000Z',
  '2026-11-13T08:00:00.000Z'
);

INSERT INTO messages (nickname, content, contact, ip_hash, status, created_at)
VALUES (
  '第一位访客',
  '站点做得很酷，粒子效果很带感！',
  '',
  '',
  'visible',
  '2026-11-13T08:10:00.000Z'
);

INSERT INTO photos (title, url, description, sort, created_at)
VALUES
  ('示例照片 1', '/assets/images/photo-5.svg', '把 url 换成你自己的图片地址即可', 1, '2026-11-13T08:20:00.000Z'),
  ('示例照片 2', '/assets/images/photo-6.svg', '支持外链，也支持仓库内 /assets/images/ 相对路径', 2, '2026-11-13T08:21:00.000Z');
