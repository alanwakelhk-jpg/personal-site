/**
 * 留言板：提交 + 列表展示 + 加载更多
 * 提交成功后实时插入到列表顶部
 */
import { fetchMessages, postMessage } from './api.js';
import { formatDate, timeAgo, initialOf, toast } from './ui.js';
import { SITE_CONFIG } from './config.js';

const PAGE_SIZE = SITE_CONFIG.messagePageSize || 20;

export function initMessages() {
  const form = document.getElementById('messageForm');
  const listEl = document.getElementById('messageList');
  const moreBtn = document.getElementById('messageMore');
  const statusEl = document.getElementById('messageStatus');
  const tipEl = document.getElementById('msgTip');
  const counter = document.getElementById('msgCounter');
  const contentEl = document.getElementById('msgContent');
  const submitBtn = document.getElementById('msgSubmit');
  if (!listEl) return;

  let offset = 0;
  let total = 0;
  let loading = false;
  let offline = false;

  function escapeText(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function itemHtml(m) {
    const nick = escapeText(m.nickname || '匿名');
    return `
      <div class="message-item">
        <div class="msg-avatar">${escapeText(initialOf(m.nickname))}</div>
        <div class="msg-body">
          <div class="msg-head">
            <span class="msg-nick">${nick}</span>
            <span class="msg-time" title="${escapeText(formatDate(m.created_at))}">${escapeText(timeAgo(m.created_at))}</span>
          </div>
          <p class="msg-text">${escapeText(m.content)}</p>
          ${m.contact ? `<span class="msg-contact">${escapeText(m.contact)}</span>` : ''}
        </div>
      </div>`;
  }

  /* ---------------- 加载列表 ---------------- */
  async function load(reset = false) {
    if (loading) return;
    loading = true;
    if (moreBtn) moreBtn.disabled = true;

    try {
      const data = await fetchMessages({ limit: PAGE_SIZE, offset: reset ? 0 : offset });
      const items = data.items || [];
      total = data.total || items.length;
      offline = !!data.offline;

      if (reset) {
        listEl.innerHTML = '';
        offset = 0;
      }

      if (!items.length && reset) {
        listEl.innerHTML = '<div class="empty-tip">还没有留言，来做第一个留言的人吧。</div>';
      } else {
        listEl.insertAdjacentHTML('beforeend', items.map(itemHtml).join(''));
      }

      offset += items.length;

      if (statusEl) {
        statusEl.textContent = offline
          ? '演示模式：留言接口不可用，当前展示本机浏览器缓存的留言。'
          : `已展示 ${offset} / ${total} 条留言`;
        statusEl.classList.toggle('warn', offline);
      }
      if (moreBtn) moreBtn.hidden = offline || offset >= total;
    } catch (err) {
      if (reset) {
        listEl.innerHTML = `<div class="empty-tip">留言加载失败：${escapeText(err.message)}</div>`;
      }
      if (statusEl) {
        statusEl.textContent = '加载失败：' + err.message;
        statusEl.classList.add('warn');
      }
    } finally {
      loading = false;
      if (moreBtn) moreBtn.disabled = false;
    }
  }

  if (moreBtn) moreBtn.addEventListener('click', () => load(false));

  /* ---------------- 字数统计 ---------------- */
  if (contentEl && counter) {
    contentEl.addEventListener('input', () => {
      counter.textContent = `${contentEl.value.length} / 500`;
    });
  }

  function setTip(text, type = '') {
    if (!tipEl) return;
    tipEl.textContent = text;
    tipEl.className = 'form-tip' + (type ? ' ' + type : '');
  }

  /* ---------------- 提交 ---------------- */
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nickname = document.getElementById('msgNickname').value.trim();
      const contact = document.getElementById('msgContact').value.trim();
      const content = contentEl.value.trim();

      if (!nickname) return setTip('请填写昵称', 'error');
      if (nickname.length > 30) return setTip('昵称不能超过 30 个字符', 'error');
      if (!content) return setTip('请填写留言内容', 'error');
      if (content.length < 2) return setTip('留言内容至少 2 个字符', 'error');
      if (content.length > 500) return setTip('留言内容不能超过 500 个字符', 'error');

      submitBtn.disabled = true;
      submitBtn.textContent = '提交中…';
      setTip('');

      try {
        const { data, offline: isOffline } = await postMessage({ nickname, content, contact });

        // 插入到列表顶部
        const emptyTip = listEl.querySelector('.empty-tip');
        if (emptyTip) emptyTip.remove();
        listEl.insertAdjacentHTML('afterbegin', itemHtml(data));
        total++;
        offset++;

        form.reset();
        if (counter) counter.textContent = '0 / 500';
        setTip(isOffline ? '提交成功（演示模式，仅保存在本机浏览器）' : '留言成功，感谢！', 'success');
        toast(isOffline ? '留言已保存在本机（演示模式）' : '留言发布成功');
        setTip('', '');
      } catch (err) {
        setTip(err.message || '提交失败，请稍后重试', 'error');
        toast('提交失败：' + (err.message || '未知错误'), 3000);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '提交留言';
      }
    });
  }

  listEl.innerHTML = '<div class="skeleton" style="height:88px"></div><div class="skeleton" style="height:88px"></div>';
  load(true);
}
