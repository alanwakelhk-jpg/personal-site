/**
 * 极简 Markdown 渲染器（无任何第三方依赖）
 * 支持：标题、粗体/斜体/删除线、行内代码、代码块、有序/无序列表、引用、分隔线、链接、图片、表格（基础）、换行
 */

export function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 仅允许安全协议，防止 javascript: 注入 */
function safeUrl(url) {
  const u = String(url || '').trim();
  if (/^(https?:|mailto:|tel:|\/|\.\/|#|data:image\/)/i.test(u)) return u;
  return '#';
}

/** 行内元素解析 */
function inline(text) {
  let out = escapeHtml(text);

  // 行内代码（先处理，避免其中内容被其它规则改写）
  const codeSpans = [];
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(code);
    return `\u0000CODE${codeSpans.length - 1}\u0000`;
  });

  // 图片 ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, url) => {
    return `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy" />`;
  });

  // 链接 [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, url) => {
    return `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  // 粗体、斜体、删除线
  out = out
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // 还原行内代码
  out = out.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => `<code>${codeSpans[Number(i)]}</code>`);

  return out;
}

export function renderMarkdown(md) {
  if (!md) return '';

  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let i = 0;

  // 代码块
  const flushFence = () => {
    const lang = lines[i].replace(/^```/, '').trim();
    i++;
    const code = [];
    while (i < lines.length && !/^```/.test(lines[i])) {
      code.push(lines[i]);
      i++;
    }
    i++; // 跳过结束围栏
    html.push(
      `<pre class="md-code"><code data-lang="${escapeHtml(lang)}">${escapeHtml(code.join('\n'))}</code></pre>`
    );
  };

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (!line.trim()) {
      i++;
      continue;
    }

    // 代码块
    if (/^```/.test(line)) {
      flushFence();
      continue;
    }

    // 分隔线
    if (/^\s*([-*_])\s*\1\s*\1[\s\S]*$/.test(line) && line.replace(/[\s\-*_]/g, '') === '') {
      html.push('<hr />');
      i++;
      continue;
    }

    // 标题
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    // 引用
    if (/^\s*>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      html.push(`<blockquote>${renderMarkdown(buf.join('\n'))}</blockquote>`);
      continue;
    }

    // 表格（基础：| a | b | + | --- | --- |）
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const parseRow = (row) =>
        row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const header = parseRow(line);
      i += 2;
      const bodyRows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        bodyRows.push(parseRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${bodyRows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`;
      html.push(`<div class="md-table-wrap"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    // 无序列表
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      html.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ul>`);
      continue;
    }

    // 有序列表
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      html.push(`<ol>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ol>`);
      continue;
    }

    // 普通段落（连续行合并）
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*\|.*\|\s*$/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    html.push(`<p>${para.map((t) => inline(t)).join('<br />')}</p>`);
  }

  return html.join('\n');
}

/** 去掉 Markdown 标记，用于生成摘要 */
export function stripMarkdown(md, max = 120) {
  const text = String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~`|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? text.slice(0, max) + '…' : text;
}
