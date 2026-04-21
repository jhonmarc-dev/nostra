'use strict';

/* ─────────────────────────────────
   CURSOR
───────────────────────────────── */
const cursorEl = document.getElementById('cursor');
let cx = 0, cy = 0;

document.addEventListener('mousemove', e => {
  cx = e.clientX; cy = e.clientY;
  cursorEl.style.left = cx + 'px';
  cursorEl.style.top  = cy + 'px';
  document.body.classList.add('cursor-visible');
});

document.querySelectorAll('a, button, .rt-item').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorEl.style.width = '18px';
    cursorEl.style.height = '18px';
    cursorEl.style.background = '#fff';
  });
  el.addEventListener('mouseleave', () => {
    cursorEl.style.width = '';
    cursorEl.style.height = '';
    cursorEl.style.background = '';
  });
});

/* ─────────────────────────────────
   BACKGROUND PARTICLE CANVAS
───────────────────────────────── */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); seedParticles(); });

const COLORS = [
  [139, 92, 246],  // purple
  [167, 139, 250], // light purple
  [232, 121, 249], // pink
];

let particles = [];

function seedParticles() {
  particles = [];
  const count = Math.floor((canvas.width * canvas.height) / 14000);
  for (let i = 0; i < count; i++) {
    particles.push(makeParticle(true));
  }
}

function makeParticle(randomY = false) {
  const [r, g, b] = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    x: Math.random() * canvas.width,
    y: randomY ? Math.random() * canvas.height : canvas.height + 4,
    r: Math.random() * 1.6 + 0.4,
    vy: -(Math.random() * 0.4 + 0.1),
    vx: (Math.random() - 0.5) * 0.2,
    alpha: Math.random() * 0.55 + 0.1,
    life: 0,
    max: Math.random() * 200 + 120,
    cr: r, cg: g, cb: b,
  };
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p, i) => {
    const prog = p.life / p.max;
    const fade = prog < 0.15 ? prog / 0.15
               : prog > 0.82 ? (1 - prog) / 0.18
               : 1;
    const a = p.alpha * fade;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${a})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(${p.cr},${p.cg},${p.cb},${a * 0.6})`;
    ctx.fill();
    ctx.shadowBlur = 0;

    p.x += p.vx;
    p.y += p.vy;
    p.life++;

    if (p.life >= p.max || p.y < -6) {
      particles[i] = makeParticle();
    }
  });
  requestAnimationFrame(drawParticles);
}

seedParticles();
drawParticles();

/* ─────────────────────────────────
   NAV SCROLL STYLE
───────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ─────────────────────────────────
   COUNT-UP ANIMATION
───────────────────────────────── */
function countUp(el, target, duration = 2000) {
  if (!el) return;
  const start = performance.now();
  const from = 0;
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(from + (target - from) * ease).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(tick);
}

/* ─────────────────────────────────
   DISCORD REAL-TIME MEMBER COUNT
   Uses the public invite API — no auth needed.
   Requires the Nostra server to have "Server Widget"
   OR just works via the invite endpoint with_counts=true.
───────────────────────────────── */
const INVITE_CODE = 'Nostra'; // discord.gg/Nostra
const FALLBACK_TOTAL  = 81134;
const FALLBACK_ONLINE = 1200;

async function fetchDiscordCounts() {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${INVITE_CODE}?with_counts=true&with_expiration=false`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const total  = data.approximate_member_count  ?? FALLBACK_TOTAL;
    const online = data.approximate_presence_count ?? FALLBACK_ONLINE;

    applyDiscordCounts(total, online);
  } catch (err) {
    console.warn('[Nostra] Discord API unavailable, using fallback.', err.message);
    applyDiscordCounts(FALLBACK_TOTAL, FALLBACK_ONLINE);
  }
}

function applyDiscordCounts(total, online) {
  // Hero stat bar
  countUp(document.getElementById('totalMembers'),  total,  1800);
  countUp(document.getElementById('onlineMembers'), online, 1400);

  // Discord card
  countUp(document.getElementById('dcTotal'),   total,  1800);
  countUp(document.getElementById('dcOnline'),  online, 1400);
  countUp(document.getElementById('dcOnline2'), online, 1400);

  // CTA section badge
  const ctaCount = document.getElementById('ctaCount');
  if (ctaCount) {
    ctaCount.textContent = `${total.toLocaleString()} MEMBERS AND GROWING`;
  }
}

// Fetch on load, refresh every 5 minutes
fetchDiscordCounts();
setInterval(fetchDiscordCounts, 5 * 60 * 1000);

/* ─────────────────────────────────
   SCROLL REVEAL
───────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal');

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = parseInt(el.dataset.d ?? 0);
    setTimeout(() => el.classList.add('in'), delay);
    io.unobserve(el);
  });
}, { threshold: 0.12 });

revealEls.forEach(el => io.observe(el));
