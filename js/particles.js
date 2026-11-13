/**
 * Canvas 粒子背景 + 鼠标交互特效
 * 效果：背景漂浮粒子（含连线）、鼠标移动产生拖尾、点击爆散粒子
 * 自适应：跟随主题切换颜色、跟随窗口尺寸、低性能设备自动降粒子数
 */

let canvas = null;
let ctx = null;
let rafId = null;
let particles = [];
let width = 0;
let height = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);
const mouse = { x: -9999, y: -9999, active: false };
let theme = 'dark';

const PALETTE = {
  dark: { dot: '0,229,255', line: '0,229,255', accent: '124,77,255' },
  light: { dot: '0,120,200', line: '0,120,200', accent: '120,60,220' },
};

function particleCount() {
  const area = width * height;
  // 每 22000 平方像素一个粒子，限制在 40~110 之间
  return Math.max(40, Math.min(110, Math.floor(area / 22000)));
}

function createParticle(x, y, isBurst = false) {
  const angle = Math.random() * Math.PI * 2;
  const speed = isBurst ? 1.5 + Math.random() * 3.5 : 0.15 + Math.random() * 0.45;
  return {
    x: x != null ? x : Math.random() * width,
    y: y != null ? y : Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: isBurst ? 1.2 + Math.random() * 1.8 : 0.8 + Math.random() * 1.8,
    life: isBurst ? 1 : Infinity,
    decay: isBurst ? 0.012 + Math.random() * 0.012 : 0,
    accent: Math.random() > 0.72,
  };
}

function resize() {
  if (!canvas) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const target = particleCount();
  if (particles.length > target) {
    particles = particles.slice(0, target);
  } else {
    while (particles.length < target) particles.push(createParticle());
  }
}

function draw() {
  const colors = PALETTE[theme] || PALETTE.dark;
  ctx.clearRect(0, 0, width, height);

  // 鼠标光晕
  if (mouse.active) {
    const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
    grad.addColorStop(0, `rgba(${colors.dot},0.10)`);
    grad.addColorStop(1, `rgba(${colors.dot},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(mouse.x - 160, mouse.y - 160, 320, 320);
  }

  // 粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // 鼠标轻微吸引
    if (mouse.active) {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 140 && dist > 0.1) {
        p.vx += (dx / dist) * 0.02;
        p.vy += (dy / dist) * 0.02;
      }
    }

    p.x += p.vx;
    p.y += p.vy;

    // 速度阻尼，避免越飘越快
    p.vx *= 0.992;
    p.vy *= 0.992;

    // 边界回绕
    if (p.x < -20) p.x = width + 20;
    if (p.x > width + 20) p.x = -20;
    if (p.y < -20) p.y = height + 20;
    if (p.y > height + 20) p.y = -20;

    const color = p.accent ? colors.accent : colors.dot;

    if (p.decay) {
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
    }

    const alpha = p.decay ? Math.max(p.life, 0) : 0.75;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color},${alpha})`;
    ctx.fill();
  }

  // 近距离连线
  const maxDist = 110;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < maxDist) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${colors.line},${(1 - d / maxDist) * 0.16})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }

  rafId = requestAnimationFrame(draw);
}

function onPointerMove(e) {
  const point = e.touches ? e.touches[0] : e;
  mouse.x = point.clientX;
  mouse.y = point.clientY;
  mouse.active = true;
}

function onPointerLeave() {
  mouse.active = false;
  mouse.x = -9999;
  mouse.y = -9999;
}

function onClick(e) {
  // 点击爆散 12 个粒子
  for (let k = 0; k < 12; k++) {
    particles.push(createParticle(e.clientX, e.clientY, true));
  }
  // 控制总量，防止长时间点击后卡顿
  if (particles.length > 320) particles.splice(0, particles.length - 320);
}

export function setParticleTheme(next) {
  theme = next === 'light' ? 'light' : 'dark';
}

export function initParticles(canvasId = 'particle-canvas') {
  canvas = document.getElementById(canvasId);
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  resize();
  // 低性能设备或开启「减少动画」时不跑粒子
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    canvas.style.display = 'none';
    return;
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('mouseleave', onPointerLeave, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerLeave, { passive: true });
  window.addEventListener('click', onClick, { passive: true });

  draw();
}

export function destroyParticles() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  particles = [];
}
