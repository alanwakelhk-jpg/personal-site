/**
 * 音乐播放器：播放/暂停、上一首/下一首、进度条、音量、播放列表
 * 曲目数据来自 js/config.js 的 playlist（支持本地文件与音频直链）
 */
import { SITE_CONFIG } from './config.js';
import { toast } from './ui.js';

export function initMusic() {
  const audio = document.getElementById('audio');
  const playlistEl = document.getElementById('playlist');
  if (!audio || !playlistEl) return;

  const tracks = (SITE_CONFIG.playlist || []).filter((t) => t && t.src);
  const els = {
    title: document.getElementById('trackTitle'),
    artist: document.getElementById('trackArtist'),
    cover: document.getElementById('trackCover'),
    playBtn: document.getElementById('playBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    seek: document.getElementById('seekBar'),
    volume: document.getElementById('volumeBar'),
    curTime: document.getElementById('curTime'),
    durTime: document.getElementById('durTime'),
    disc: document.getElementById('disc'),
    eq: document.querySelector('.eq'),
  };

  if (!tracks.length) {
    playlistEl.innerHTML = '<li style="cursor:default;color:var(--text-faint)">尚未配置曲目，请编辑 js/config.js 的 playlist</li>';
    return;
  }

  let current = 0;
  let seeking = false;

  /* ---------------- 渲染播放列表 ---------------- */
  function renderPlaylist() {
    playlistEl.innerHTML = tracks
      .map(
        (t, i) => `
        <li data-index="${i}" class="${i === current ? 'active' : ''}">
          <span class="idx">${String(i + 1).padStart(2, '0')}</span>
          <span class="name">${escapeText(t.title || '未命名曲目')}</span>
        </li>`
      )
      .join('');
  }

  function escapeText(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  playlistEl.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-index]');
    if (!li) return;
    load(Number(li.dataset.index), true);
  });

  /* ---------------- 载入曲目 ---------------- */
  function load(index, autoplay = false) {
    current = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[current];

    audio.src = track.src;
    audio.load();

    if (els.title) els.title.textContent = track.title || '未命名曲目';
    if (els.artist) els.artist.textContent = track.artist || '—';
    if (els.cover) {
      if (track.cover) {
        els.cover.src = track.cover;
        els.cover.style.display = 'block';
      } else {
        els.cover.removeAttribute('src');
        els.cover.style.display = 'none';
      }
    }
    if (els.seek) els.seek.value = 0;
    if (els.curTime) els.curTime.textContent = '00:00';
    if (els.durTime) els.durTime.textContent = '00:00';

    playlistEl.querySelectorAll('li').forEach((li, i) => li.classList.toggle('active', i === current));

    if (autoplay) play();
  }

  /* ---------------- 播放 / 暂停 ---------------- */
  function play() {
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        // 浏览器自动播放限制或文件不存在
        if (err && err.name === 'NotAllowedError') {
          toast('浏览器已阻止自动播放，请手动点击播放', 2600);
        } else {
          toast('该曲目无法播放，可能是文件不存在或链接失效', 2600);
        }
        setPlayingUI(false);
      });
    }
  }

  function togglePlay() {
    if (audio.paused) play();
    else audio.pause();
  }

  function setPlayingUI(playing) {
    if (els.playBtn) els.playBtn.classList.toggle('playing', playing);
    if (els.disc) els.disc.classList.toggle('playing', playing);
    if (els.eq) els.eq.classList.toggle('active', playing);
    if (els.playBtn) els.playBtn.setAttribute('aria-label', playing ? '暂停' : '播放');
  }

  /* ---------------- 事件绑定 ---------------- */
  if (els.playBtn) els.playBtn.addEventListener('click', togglePlay);
  if (els.prevBtn) els.prevBtn.addEventListener('click', () => load(current - 1, true));
  if (els.nextBtn) els.nextBtn.addEventListener('click', () => load(current + 1, true));

  audio.addEventListener('play', () => setPlayingUI(true));
  audio.addEventListener('pause', () => setPlayingUI(false));
  audio.addEventListener('ended', () => load(current + 1, true));

  audio.addEventListener('error', () => {
    setPlayingUI(false);
    toast('音频加载失败：' + (tracks[current].title || '未知曲目') + '，已跳到下一首', 2800);
    // 避免所有曲目都失效时无限循环
    if (tracks.length > 1) setTimeout(() => load(current + 1, false), 600);
  });

  // 进度更新
  audio.addEventListener('timeupdate', () => {
    if (seeking) return;
    const dur = audio.duration || 0;
    if (els.seek && dur > 0) {
      els.seek.value = Math.round((audio.currentTime / dur) * 1000);
      const percent = (audio.currentTime / dur) * 100;
      els.seek.style.background = `linear-gradient(90deg, var(--neon) ${percent}%, rgba(140,160,200,0.24) ${percent}%)`;
    }
    if (els.curTime) els.curTime.textContent = fmt(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    if (els.durTime) els.durTime.textContent = fmt(audio.duration);
  });

  // 拖动进度条
  if (els.seek) {
    els.seek.addEventListener('input', () => {
      seeking = true;
      const dur = audio.duration || 0;
      if (dur > 0 && els.curTime) els.curTime.textContent = fmt((Number(els.seek.value) / 1000) * dur);
    });
    els.seek.addEventListener('change', () => {
      const dur = audio.duration || 0;
      if (dur > 0) audio.currentTime = (Number(els.seek.value) / 1000) * dur;
      seeking = false;
    });
  }

  // 音量
  if (els.volume) {
    audio.volume = Number(els.volume.value) / 100;
    els.volume.addEventListener('input', () => {
      audio.volume = Number(els.volume.value) / 100;
      if (audio.volume === 0) toast('已静音', 1200);
    });
  }

  // 键盘：空格播放/暂停（输入框内不拦截）
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.code === 'Space' && document.getElementById('music')) {
      const rect = document.getElementById('music').getBoundingClientRect();
      // 音乐区在可视范围内时才响应
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        e.preventDefault();
        togglePlay();
      }
    }
  });

  function fmt(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  renderPlaylist();
  load(0, false);
}
