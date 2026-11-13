/**
 * ============================================================
 * 全站配置中心 —— 你只需要改这个文件，就能替换大部分内容
 * 所有【可替换】标记处都可以自由修改
 * ============================================================
 */

export const SITE_CONFIG = {
  /* ---------------- 基础信息【可替换】 ---------------- */
  siteName: 'Alan 的资源站',            // 浏览器标题 / 导航栏 Logo 文案
  siteSlogan: '代码、音乐与远方',        // 首屏副标题
  siteDescription: '一个轻量的个人资源站点，记录文章、照片与想法。',

  /* ---------------- 站长信息【可替换】 ---------------- */
  owner: {
    nickname: 'Alan',                   // 昵称
    avatar: './assets/images/avatar.svg', // 头像：本地路径或任意图片 URL
    title: '全栈开发者 / 独立创作者',     // 一句话身份
    bio: '你好，我是 Alan。喜欢折腾前端与边缘计算，业余时间写点小工具、听点老歌。这个站点用来放我的文章、照片和收藏的资源，随时欢迎交流。',
    skills: ['JavaScript', 'Cloudflare', 'Node.js', 'UI 设计', '摄影', '自动化'],
    // 个人资源导航（卡片形式展示）
    resources: [
      { name: '我的博客', desc: '技术文章与随笔', url: '#articles', icon: '📝' },
      { name: '工具集', desc: '自建小工具合集', url: '#gallery', icon: '🧰' },
      { name: 'GitHub', desc: '开源代码仓库', url: 'https://github.com/', icon: '💻' },
      { name: '留言板', desc: '给我留句话', url: '#messages', icon: '✉️' },
    ],
  },

  /* ---------------- 联系方式【可替换】 ---------------- */
  // 留空字符串则会自动隐藏该项
  contacts: [
    { label: '邮箱', value: 'your-mail@example.com', url: 'mailto:your-mail@example.com', icon: 'mail' },
    { label: 'GitHub', value: 'github.com/yourname', url: 'https://github.com/yourname', icon: 'github' },
    { label: 'QQ', value: '100000000', url: 'https://wpa.qq.com/msgrd?v=3&uin=100000000&site=qq&menu=yes', icon: 'qq' },
    { label: '微信', value: 'your_wechat_id', url: '', icon: 'wechat' },
    { label: 'Telegram', value: '@yourname', url: 'https://t.me/yourname', icon: 'telegram' },
    { label: 'B 站', value: 'space.bilibili.com/000000', url: 'https://space.bilibili.com/000000', icon: 'bilibili' },
  ],

  /* ---------------- 顶部照片轮播【可替换】 ----------------
   * url 留空时自动使用 gradient 渐变底色（零图片也能跑起来）
   */
  // 想用自己的照片：把 url 换成图片地址（如 './assets/images/banner1.jpg' 或 https:// 外链）
  // url 为空时自动降级为 gradient 渐变底色
  heroSlides: [
    { url: './assets/images/photo-1.svg', gradient: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)', title: '欢迎来到我的小站', subtitle: '记录 · 分享 · 折腾' },
    { url: './assets/images/photo-2.svg', gradient: 'linear-gradient(135deg,#1a2a6c,#b21f1f,#fdbb2d)', title: '写代码，也写生活', subtitle: '前端 / 边缘计算 / 自动化' },
    { url: './assets/images/photo-3.svg', gradient: 'linear-gradient(135deg,#42275a,#734b6d,#00c6ff)', title: '把喜欢的东西放在一起', subtitle: '文章 · 照片 · 音乐' },
    { url: './assets/images/photo-4.svg', gradient: 'linear-gradient(135deg,#000428,#004e92,#00e5ff)', title: '保持好奇，持续输出', subtitle: 'Keep hacking, keep shipping' },
  ],
  carouselInterval: 5000,               // 自动轮播间隔（毫秒），0 表示不自动

  /* ---------------- 音乐播放列表【可替换】 ----------------
   * src 支持：本地文件（./assets/audio/xxx.mp3）或任意音频直链
   * 注意：部分平台（网易云/QQ音乐）的播放链接有防盗链，建议用自己上传的文件或可直链的音频
   */
  playlist: [
    // 外链示例（可直链，开箱即可播放）
    { title: 'SoundHelix Song 1', artist: 'SoundHelix', cover: '', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { title: 'SoundHelix Song 3', artist: 'SoundHelix', cover: '', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    // 本地文件示例：把 mp3 放进 assets/audio/ 后取消下面这行的注释即可
    // { title: '示例曲目一', artist: 'Unknown Artist', cover: './assets/images/photo-2.svg', src: './assets/audio/sample1.mp3' },
  ],

  /* ---------------- 照片墙兜底数据【可替换】 ----------------
   * 当 /api/photos 不可用（未部署后端）时，展示这里的数据
   */
  fallbackPhotos: [
    { title: '霓虹夜色', url: './assets/images/photo-1.svg', description: '替换为你自己的图片地址' },
    { title: '城市天际线', url: './assets/images/photo-2.svg', description: '替换为你自己的图片地址' },
    { title: '山间晨雾', url: './assets/images/photo-3.svg', description: '替换为你自己的图片地址' },
    { title: '代码与咖啡', url: './assets/images/photo-4.svg', description: '替换为你自己的图片地址' },
    { title: '街头光影', url: './assets/images/photo-5.svg', description: '替换为你自己的图片地址' },
    { title: '海边日落', url: './assets/images/photo-6.svg', description: '替换为你自己的图片地址' },
  ],

  /* ---------------- 文章兜底数据【可替换】 ----------------
   * 当 /api/articles 不可用（未部署后端）时，首页展示这里的示例文章
   */
  fallbackArticles: [
    {
      id: 1,
      title: '欢迎来到我的个人资源站',
      summary: '这是一篇本地兜底演示文章。后端接口连通后，这里会自动展示 D1 数据库里的真实文章。',
      tags: ['公告'],
      created_at: '2026-11-13T08:00:00.000Z',
      content:
        '## 本地演示模式\n\n当前页面没有取到后端数据，展示的是 `js/config.js` 里的示例文章。\n\n- 部署 Cloudflare Pages Functions 后会自动切换为真实数据\n- 文章详情支持 Markdown 渲染\n\n> 这是引用块示例。',
    },
  ],

  /* ---------------- 其他 ---------------- */
  apiBase: '/api',                       // 接口前缀，正常情况无需修改
  messagePageSize: 20,                   // 留言每页条数
};

/** 联系方式图标（内联 SVG，避免依赖图标库 CDN） */
export const CONTACT_ICONS = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 7 9 6 9-6"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-1.9c-3.12.68-3.78-1.5-3.78-1.5-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.49-.28-5.11-1.25-5.11-5.55 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.15a10.6 10.6 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.68.11 2.96.72.79 1.16 1.79 1.16 3.02 0 4.31-2.63 5.26-5.13 5.54.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z"/></svg>',
  qq: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.8c-3.3 0-6 2.7-6 6v1.6c-.9 1.5-1.6 3.4-1.6 4.9 0 .9.2 1.4.5 1.4.2 0 .4-.3.6-.8.3 1 .8 1.9 1.4 2.6-.5.2-.8.6-.8 1 0 .7 1.2 1.3 2.7 1.3.4.3 1 .5 1.6.6h.4c.6-.1 1.2-.3 1.6-.6 1.5 0 2.7-.6 2.7-1.3 0-.4-.3-.8-.8-1 .6-.7 1.1-1.6 1.4-2.6.2.5.4.8.6.8.3 0 .5-.5.5-1.4 0-1.5-.7-3.4-1.6-4.9V7.8c0-3.3-2.7-6-6-6Zm-2.2 6.6c.6 0 1.1.6 1.1 1.3s-.5 1.3-1.1 1.3-1.1-.6-1.1-1.3.5-1.3 1.1-1.3Zm4.4 0c.6 0 1.1.6 1.1 1.3s-.5 1.3-1.1 1.3-1.1-.6-1.1-1.3.5-1.3 1.1-1.3Z"/></svg>',
  wechat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.7 3C4.9 3 1.8 5.6 1.8 8.8c0 1.8 1 3.4 2.6 4.5l-.7 2.1 2.4-1.2c.8.2 1.6.4 2.5.4h.6a5.5 5.5 0 0 1-.2-1.5c0-3.1 3-5.6 6.7-5.6h.6C15.6 4.9 12.5 3 8.7 3Zm-2.3 3.4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1Zm4.6 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1Z"/><path d="M22.2 13.1c0-2.7-2.7-4.9-6-4.9s-6 2.2-6 4.9 2.7 4.9 6 4.9c.7 0 1.4-.1 2.1-.3l2 1-.6-1.7c1.5-.9 2.5-2.3 2.5-3.9Zm-8-1.7c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9Zm4 0c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9Z"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L7 13.1l-4.5-1.4c-1-.3-1-1 .2-1.4l17.5-6.8c.8-.3 1.5.2 1.7 1.8Z"/></svg>',
  bilibili: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3 4.5 5.8M17 3l2.5 2.8"/><rect x="2.5" y="5.8" width="19" height="14.2" rx="3.5"/><path d="M8.5 11v3M15.5 11v3"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7L11.5 6"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.5-1.2"/></svg>',
};
