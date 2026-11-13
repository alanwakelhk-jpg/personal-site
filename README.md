# 个人资源网站（Cloudflare Pages + D1）

一个**零服务器、零付费**的个人资源站：原生 HTML / CSS / JavaScript，托管在 Cloudflare Pages，
文章、留言、照片墙的数据通过 Cloudflare Pages Functions + Cloudflare D1 存储，
`git push` 到 GitHub 后自动构建部署。

## 功能清单

| 功能 | 说明 |
| --- | --- |
| 顶部照片轮播 | 多张自定义照片，自动轮播 + 左右箭头 + 圆点 + 触摸滑动 + 键盘方向键 |
| 站长介绍 | 头像、昵称、身份、简介、技能标签、资源导航卡片 |
| 联系方式 | 邮箱 / GitHub / QQ / 微信 / Telegram / B 站，字段可留空自动隐藏 |
| 音乐播放器 | 本地音频或外链，播放/暂停、上一首/下一首、进度条、音量、播放列表 |
| 文章 | 列表 + 详情页，Markdown 渲染，发布时间、标签、浏览量 |
| 留言板 | 任何人可提交（昵称 + 内容 + 可选联系方式），实时插入展示，带 60 秒防刷 |
| 照片墙 | 网格展示，点击放大预览（灯箱支持左右切换 / ESC 关闭 / 触摸滑动） |
| 深色 / 浅色 | 一键切换，状态保存在 `localStorage`，首次访问跟随系统偏好 |
| 粒子特效 | Canvas 粒子 + 连线 + 鼠标涟漪 + 点击爆散，深/浅色自动适配，尊重 `prefers-reduced-motion` |
| 降级策略 | 后端未部署 / D1 未绑定时，前端自动回退到 `js/config.js` 内的示例数据，页面不会空白 |

## 项目结构

```
personal-site/
├── index.html                     # 首页（轮播 / 关于 / 联系 / 音乐 / 文章 / 照片墙 / 留言）
├── article.html                   # 文章详情页（?id=1）
├── css/
│   └── style.css                  # 全部样式：主题变量、玻璃拟态、霓虹光、响应式
├── js/
│   ├── config.js                  # ★ 全站配置中心（站长信息 / 联系方式 / 轮播 / 歌单 / 标题）
│   ├── main.js                    # 首页入口：主题、导航、轮播、渲染、粒子、模块初始化
│   ├── music.js                   # 音乐播放器
│   ├── articles.js                # 文章列表（分页 / 加载更多）
│   ├── article-page.js            # 文章详情页逻辑
│   ├── gallery.js                 # 照片墙 + 灯箱
│   ├── messages.js                # 留言提交与列表
│   ├── api.js                     # 接口封装 + 失败降级
│   ├── markdown.js                # 极简 Markdown 渲染器（无第三方依赖）
│   ├── particles.js               # Canvas 粒子特效
│   └── ui.js                      # toast / 时间格式化 / 滚动入场动画
├── assets/
│   ├── images/                    # 头像与示例图（替换成自己的照片）
│   └── audio/                     # 放自己的 mp3 / m4a
├── functions/                     # ★ Cloudflare Pages Functions（自动成为 /api/* 接口）
│   ├── _lib/
│   │   └── utils.js               # 公共工具：JSON 响应、鉴权、IP 摘要、CORS
│   └── api/
│       ├── _middleware.js         # 统一 CORS / OPTIONS 预处理
│       ├── articles/
│       │   ├── index.js           # GET 列表 / POST 新建（需管理员令牌）
│       │   └── [id].js            # GET 详情（浏览量 +1）/ PUT / DELETE
│       ├── messages/
│       │   └── index.js           # GET 列表 / POST 提交（公开 + 防刷）
│       └── photos/
│           └── index.js           # GET 列表 / POST 新增（需管理员令牌）
├── schema.sql                     # ★ D1 建表脚本 + 种子数据
├── wrangler.toml                  # 本地开发 & CLI 部署配置（D1 绑定）
├── package.json                   # npm run dev / db:init 等脚本
└── .gitignore
```

---

## 一、快速开始（本地预览）

### 1. 只预览静态页面（不需要后端）

```bash
# 任选一种
npx serve .
python -m http.server 8080
```

此时 `/api/*` 请求会失败，页面自动切换到**演示模式**：显示 `js/config.js` 里的示例文章与示例照片，
留言保存到浏览器 `localStorage`。适合先调样式。

### 2. 完整本地开发（含 Functions + D1）

```bash
# 安装 wrangler
npm install

# 初始化本地 D1（会创建 .wrangler/state 下的本地库）
npm run db:init:local        # = wrangler d1 execute personal-site-db --file=./schema.sql --local

# 启动带 Functions 的本地服务
npm run dev                  # = wrangler pages dev . --d1=DB
# 打开 http://localhost:8788
```

本地开发时如果想测试写接口，可在命令里追加环境变量（或使用 `.dev.vars` 文件）：

```
# .dev.vars（不要提交到 Git）
ADMIN_TOKEN=my-local-token
```

---

## 二、创建 D1 数据库

```bash
npx wrangler login
npx wrangler d1 create personal-site-db
```

命令会输出类似内容，**把 `database_id` 记下来**：

```
[[d1_databases]]
binding = "DB"
database_name = "personal-site-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

把它填进 `wrangler.toml` 的 `database_id`（`database_name` 可自行改名，`binding` 必须保持 `DB`）。

### 初始化表结构

```bash
# 远程（真实数据库）
npx wrangler d1 execute personal-site-db --file=./schema.sql --remote

# 或者：Dashboard → Workers & Pages → D1 → 选择数据库 → Console → 粘贴 schema.sql 内容执行
```

`schema.sql` 建三张表并写入示例数据：

| 表 | 用途 | 主要字段 |
| --- | --- | --- |
| `articles` | 文章 | `title` `summary` `content`(Markdown) `tags`(逗号分隔) `cover` `published` `views` `created_at` `updated_at` |
| `messages` | 留言 | `nickname` `content` `contact` `ip_hash`(防刷) `status` `created_at` |
| `photos` | 照片墙 | `title` `url` `description` `sort` `created_at` |

> 种子数据里照片的 `url` 为空，前端会自动回退到 `config.js` 的示例图。把 `url` 换成你的图片地址即可
> （支持外链，也支持仓库内相对路径 `/assets/images/xxx.jpg`）。

---

## 三、连接 GitHub 自动部署（核心步骤）

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "feat: init personal site"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 2. 在 Cloudflare 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 授权 GitHub，选择刚才的仓库 → **Begin setup**
4. 填写构建配置（**本项目是纯静态、无构建步骤，这一栏很关键**）：

| 配置项 | 填写值 | 说明 |
| --- | --- | --- |
| Project name | `personal-resource-site`（自定义） | 会决定默认域名 `xxx.pages.dev` |
| Production branch | `main` | 推送到该分支即自动生产部署 |
| Framework preset | `None` | 不使用框架 |
| Build command | **留空** | 没有编译步骤 |
| Build output directory | **`/`**（或留空） | 静态文件就在仓库根目录 |

> 为什么不是 `dist`？因为所有 `index.html`、`css/`、`js/` 都在仓库根目录，
> 而 Functions 必须放在仓库根的 `functions/` 目录，Cloudflare 会自动识别并部署为 `/api/*` 接口。

5. 点击 **Save and Deploy**，首次构建完成后访问 `https://<项目名>.pages.dev`。

### 3. 给 Pages 项目绑定 D1

**方式 A：Dashboard（推荐）**

1. 进入项目 → **Settings** → **Bindings**（新版叫 *Bindings* / *Functions*）
2. **Add** → **D1 database**
3. Variable name 填 **`DB`**（必须与代码里的 `env.DB` 一致，不能改）
4. 选择你创建的 `personal-site-db` → Save
5. 回到 **Deployments** → 最新一次部署右侧 **⋯ → Retry deployment**，使绑定生效

**方式 B：wrangler.toml（已内置）**

项目里已写好 `[[d1_databases]]` 段，用 CLI 部署时会自动带上：

```bash
npx wrangler pages deploy . --project-name=personal-resource-site
```

### 4. 配置环境变量

进入 **Settings → Environment variables**（Production 与 Preview 都建议配）：

| 变量名 | 是否敏感 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ADMIN_TOKEN` | **是（Encrypt）** | 写接口必填 | 发布文章 / 新增照片的管理员令牌，随便设一串长随机字符 |
| `ALLOWED_ORIGIN` | 否 | 可选 | CORS 白名单，默认 `*`；填自己的域名更安全，如 `https://blog.example.com` |
| `SITE_NAME` | 否 | 可选 | 站点名（仅备查，前端标题取自 `js/config.js`） |

> 未配置 `ADMIN_TOKEN` 时，所有写操作（POST/PUT/DELETE）会返回
> `503 服务端未配置 ADMIN_TOKEN，写操作已禁用`，这是有意的安全保护。

设置完环境变量后需要**重新部署一次**才会生效：Deployments → ⋯ → Retry deployment。

### 5. 之后如何更新

```bash
# 改完代码
git add .
git commit -m "update"
git push
```

Cloudflare 会监听 `main` 分支的 push 并自动重新构建部署，通常 30 秒内上线。
其他分支 / PR 会生成独立的**预览地址**。

---

## 四、接口文档

所有接口返回统一结构：

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "错误说明" }
```

### 文章

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/articles?limit=10&offset=0&tag=前端&q=关键词` | 公开 | 已发布文章列表，返回 `{ items, total }` |
| POST | `/api/articles` | 管理员 | 新建文章 |
| GET | `/api/articles/:id` | 公开 | 文章详情（`views` 自动 +1） |
| PUT | `/api/articles/:id` | 管理员 | 修改文章 |
| DELETE | `/api/articles/:id` | 管理员 | 删除文章 |

**新增文章示例**

```bash
curl -X POST https://<你的域名>/api/articles \
  -H "content-type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "title": "我的第一篇正式文章",
    "summary": "可选，留空会自动截取正文前 120 字",
    "content": "## 小标题\n\n正文支持 **Markdown**。\n\n```js\nconsole.log(1)\n```",
    "tags": ["前端", "随笔"],
    "published": 1
  }'
```

### 留言

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/messages?limit=20&offset=0` | 公开 | 留言列表 |
| POST | `/api/messages` | 公开 | 提交留言 |

```bash
curl -X POST https://<你的域名>/api/messages \
  -H "content-type: application/json" \
  -d '{"nickname":"小明","content":"网站很好看！","contact":"hi@example.com"}'
```

校验规则：昵称 1~30 字符，内容 2~500 字符；同一 IP 60 秒内最多 1 条（超出返回 429）。
服务端只保存 IP 的 SHA-256 摘要用于限频，不存明文 IP。

### 照片墙

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/photos` | 公开 | 全部照片（按 `sort` 升序） |
| POST | `/api/photos` | 管理员 | 新增照片 |

```bash
curl -X POST https://<你的域名>/api/photos \
  -H "content-type: application/json" \
  -H "X-Admin-Token: <ADMIN_TOKEN>" \
  -d '{"title":"海边","url":"/assets/images/photo-6.svg","description":"2026 夏","sort":10}'
```

### 前端调用示例

```js
// 1) 直接用封装好的模块（推荐）
import { fetchArticles, postMessage } from './api.js';

const list = await fetchArticles({ limit: 5, offset: 0 }); // { items, total, offline }
const created = await postMessage({ nickname: '小明', content: '你好' });

// 2) 原生 fetch
const res = await fetch('/api/articles?limit=5');
const { ok, data, error } = await res.json();
if (!ok) console.error(error);
else console.log(data.items);
```

> `api.js` 已内置 8 秒超时 + 失败降级：接口不可用时返回 `offline: true` 与本地示例数据，
> 因此页面在任何部署状态下都不会白屏。

---

## 五、可替换内容清单（全部集中在 `js/config.js`）

| 想改什么 | 改哪里 |
| --- | --- |
| 站点名称 / 标语 / SEO 描述 | `siteName` `siteSlogan` `siteDescription` |
| 站长昵称 / 身份 | `owner.nickname` `owner.title` |
| 头像 | `owner.avatar`（默认 `./assets/images/avatar.svg`，换成自己的 `avatar.jpg` 即可） |
| 简介 | `owner.bio` |
| 技能标签 | `owner.skills` 数组 |
| 资源导航卡片 | `owner.resources`（`name` `desc` `url` `icon`） |
| 联系方式 | `contacts` 数组，`value` 留空自动隐藏；`url` 支持 `mailto:` / `https://` |
| 首屏轮播照片 | `heroSlides` 的 `url`（留空则用 `gradient` 渐变），间隔改 `carouselInterval` |
| 音乐歌单 | `playlist` 的 `src`（本地 `./assets/audio/xxx.mp3` 或音频直链）与 `cover` |
| 照片墙兜底数据 | `fallbackPhotos` |
| 文章兜底数据 | `fallbackArticles` |

代码中所有可替换处都标了 `【可替换】` 注释。

### 替换头像 / 照片 / 音乐

```bash
# 1. 头像
assets/images/avatar.svg  →  换成 avatar.jpg（同时改 config.js 的 owner.avatar）

# 2. 轮播照片（建议 1600×900，压缩到 200KB 内）
assets/images/banner-1.jpg  然后在 config.js 里 url: './assets/images/banner-1.jpg'

# 3. 音乐
assets/audio/song1.mp3      然后在 config.js 的 playlist 里 src: './assets/audio/song1.mp3'
```

> 网易云 / QQ 音乐的播放地址有防盗链，直接用会播不出来。请用自己上传的文件，
> 或 SoundHelix 这类允许直链的示例音源（默认歌单里已带一个可直链的示例）。

---

## 六、可选：改用 KV 存储

如果你不想用 D1，可把数据存 KV（适合文章条数不多的场景）。改动很小：

1. Dashboard → **Workers & Pages → KV → Create namespace**，命名 `SITE_KV`
2. 在 Pages 项目 **Settings → Bindings** 添加 KV 绑定，变量名填 `KV`
3. 在 `functions/api/` 下改写接口，例如文章列表（示例）：

```js
// functions/api/articles/index.js（KV 版）
export async function onRequestGet({ env }) {
  const raw = (await env.KV.get('articles')) || '[]';
  const items = JSON.parse(raw);
  return new Response(JSON.stringify({ ok: true, data: { items, total: items.length } }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost({ request, env }) {
  // 鉴权逻辑可复用 functions/_lib/utils.js 的 guardAdmin
  const article = await request.json();
  const items = JSON.parse((await env.KV.get('articles')) || '[]');
  article.id = Date.now();
  article.created_at = new Date().toISOString();
  items.unshift(article);
  await env.KV.put('articles', JSON.stringify(items));
  return new Response(JSON.stringify({ ok: true, data: article }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
```

> 对比：D1 支持分页查询、按标签筛选、浏览量自增等真正的数据库操作，**推荐用 D1**；
> KV 读快写慢、无查询能力，更适合纯展示的少量数据。

---

## 七、常见问题

**Q1：页面能打开，但文章/留言/照片都是示例数据？**
说明接口没通。依次检查：
① Pages 项目是否绑定了 D1，变量名是否为 `DB`；② 绑定后是否重新部署过；
③ 有没有执行过 `schema.sql`；④ 浏览器打开 `https://<域名>/api/articles` 看返回的错误信息。

**Q2：`/api/xxx` 返回 500「未绑定 D1 数据库」？**
`env.DB` 不存在。检查绑定名称拼写，改完必须 Retry deployment。

**Q3：发布文章返回 503 / 401？**
503 = 没配 `ADMIN_TOKEN`；401 = 令牌不对。注意请求头是 `Authorization: Bearer <token>`，
中间有**一个空格**。

**Q4：留言提示「提交过于频繁」？**
同一 IP 60 秒限 1 条，等一分钟即可。可在 `functions/api/messages/index.js` 里调整窗口。

**Q5：音乐播放没声音？**
① 确认 `assets/audio/` 里真的有该文件且文件名大小写一致；
② 浏览器会阻止未交互的自动播放，需要用户先点一次播放键（默认已按此设计）；
③ 外链音频可能被防盗链拦截。

**Q6：想用自己的域名？**
Pages 项目 → **Custom domains** → 添加域名，按提示在 DNS 加 CNAME 记录即可，免费且自动签发 HTTPS。

**Q7：怎么隐藏某条留言？**

```sql
UPDATE messages SET status = 'hidden' WHERE id = 3;
```

> 注意：`functions/api/messages/[id].js` 未内置删除接口，如需后台管理，可参照
> `articles/[id].js` 的 `guardAdmin` 写法自行添加。

---

## 八、安全与成本

- **写操作需令牌**：发布文章、新增照片都必须携带 `ADMIN_TOKEN`，令牌只存在 Cloudflare 环境变量中，前端代码不含任何密钥。
- **留言防刷**：同 IP 60 秒 1 条 + 长度校验 + 服务端转义（前端渲染时统一做 HTML 转义防 XSS）。
- **成本**：Cloudflare Pages 静态请求与 Functions 免费额度（每天 10 万次请求）、D1 免费额度（5GB 存储 + 每天 500 万行读）对个人站点完全够用，**0 元**。

## License

MIT，随意使用和修改。
