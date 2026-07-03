/* Victor Ndunda — Portfolio App
   Particle system, typewriter, command palette, theme toggle, scroll effects */

// ─── Particle Background Canvas ──────────────────────────────────────
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles = [], mouse = { x: null, y: null };

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = canvas.parentElement.offsetHeight;
}
resizeCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.size = Math.random() * 2 + 0.5;
    this.opacity = Math.random() * 0.4 + 0.1;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    if (mouse.x) {
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) { this.x -= dx * 0.015; this.y -= dy * 0.015; }
    }
  }
  draw() {
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? `rgba(0, 212, 255, ${this.opacity})` : `rgba(8, 145, 178, ${this.opacity * 0.4})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  const count = Math.min(70, Math.floor(canvas.width * canvas.height / 18000));
  for (let i = 0; i < count; i++) particles.push(new Particle());
}

function connectParticles() {
  const isDark = document.documentElement.classList.contains('dark');
  for (let a = 0; a < particles.length; a++) {
    for (let b = a + 1; b < particles.length; b++) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        ctx.strokeStyle = isDark
          ? `rgba(0, 212, 255, ${(1 - dist / 130) * 0.12})`
          : `rgba(8, 145, 178, ${(1 - dist / 130) * 0.06})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  connectParticles();
  requestAnimationFrame(animate);
}
initParticles();
animate();

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

// ─── Typewriter Effect ───────────────────────────────────────────────
const taglines = [
  'Building multi-agent intelligence systems.',
  'Founder of Busara AI — 50 agents, one mind.',
  'Building KilimoPRO — AI for African farmers.',
  'Real math, not vibes.',
  'Shipping production AI from Nairobi.',
  '22+ data sources integrated. Live in production.',
];
let tagIdx = 0, charIdx = 0, isDeleting = false;
const twEl = document.getElementById('typewriter');

function typewriter() {
  const current = taglines[tagIdx];
  if (isDeleting) {
    twEl.textContent = current.substring(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) { isDeleting = false; tagIdx = (tagIdx + 1) % taglines.length; setTimeout(typewriter, 500); return; }
    setTimeout(typewriter, 30);
  } else {
    twEl.textContent = current.substring(0, charIdx + 1);
    charIdx++;
    if (charIdx === current.length) { isDeleting = true; setTimeout(typewriter, 2500); return; }
    setTimeout(typewriter, 60);
  }
}
typewriter();

// ─── Navbar Scroll Effect ────────────────────────────────────────────
const navbar = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  // Active section tracking
  let current = '';
  sections.forEach(s => {
    const top = s.offsetTop - 120;
    if (window.scrollY >= top) current = s.id;
  });
  navLinks.forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
  });
});

// ─── Theme Toggle ────────────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'dark';
html.className = savedTheme;

themeToggle.addEventListener('click', () => {
  const isDark = html.classList.contains('dark');
  html.className = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

// ─── Mobile Menu ─────────────────────────────────────────────────────
const mobileToggle = document.getElementById('mobileToggle');
const navLinksContainer = document.getElementById('navLinks');
mobileToggle.addEventListener('click', () => navLinksContainer.classList.toggle('open'));
navLinks.forEach(a => a.addEventListener('click', () => navLinksContainer.classList.remove('open')));

// ─── Command Palette (Cmd+K) ─────────────────────────────────────────
const cmdPalette = document.getElementById('cmdPalette');
const cmdInput = document.getElementById('cmdInput');
const cmdResults = document.getElementById('cmdResults');
const cmdOverlay = document.getElementById('cmdOverlay');
let cmdSelectedIdx = 0;

const cmdCommands = [
  { icon: '🏠', title: 'Go to Home', desc: 'Back to the top', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
  { icon: '👨‍💻', title: 'About Victor', desc: 'Learn about my background', action: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
  { icon: '🚀', title: 'View My Work', desc: 'Busara AI, KilimoPRO & more', action: () => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }) },
  { icon: '📝', title: 'Read My Blog', desc: 'Research and technical articles', action: () => window.location.href = '/blog/' },
  { icon: '💼', title: 'Job Portal', desc: 'Search AI engineering jobs', action: () => window.location.href = '/jobs/' },
  { icon: '🛠️', title: 'Services', desc: 'What I can build for you', action: () => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) },
  { icon: '📧', title: 'Contact Me', desc: 'Get in touch', action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
  { icon: '🚀', title: 'Visit Busara AI', desc: 'busaraai.com — live platform', action: () => window.open('https://busaraai.com', '_blank') },
  { icon: '🌱', title: 'Visit KilimoPRO', desc: 'github.com/gadda00/kilimopro', action: () => window.open('https://github.com/gadda00/kilimopro', '_blank') },
  { icon: '🐙', title: 'GitHub Profile', desc: 'github.com/gadda00', action: () => window.open('https://github.com/gadda00', '_blank') },
  { icon: '💼', title: 'LinkedIn', desc: 'linkedin.com/in/victor-ndunda', action: () => window.open('https://www.linkedin.com/in/victor-ndunda', '_blank') },
  { icon: '📧', title: 'Email Me', desc: 'mututandunda@gmail.com', action: () => window.location.href = 'mailto:mututandunda@gmail.com' },
  { icon: '📱', title: 'Call Me', desc: '+254 724 346 971', action: () => window.location.href = 'tel:+254724346971' },
  { icon: '💬', title: 'WhatsApp', desc: 'Chat on WhatsApp', action: () => window.open('https://wa.me/254724346971', '_blank') },
];

function renderCmdResults(filter = '') {
  const filtered = filter
    ? cmdCommands.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()) || c.desc.toLowerCase().includes(filter.toLowerCase()))
    : cmdCommands;
  cmdSelectedIdx = 0;
  cmdResults.innerHTML = filtered.map((c, i) => `
    <div class="cmd-item ${i === 0 ? 'selected' : ''}" data-idx="${i}">
      <div class="cmd-item-icon">${c.icon}</div>
      <div class="cmd-item-text">
        <div class="cmd-item-title">${c.title}</div>
        <div class="cmd-item-desc">${c.desc}</div>
      </div>
    </div>
  `).join('') || '<div style="padding:1rem;color:var(--text-muted);text-align:center;">No results found</div>';
  
  cmdResults.querySelectorAll('.cmd-item').forEach((el, i) => {
    el.addEventListener('click', () => { filtered[i].action(); closeCmd(); });
    el.addEventListener('mouseenter', () => {
      cmdResults.querySelectorAll('.cmd-item').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      cmdSelectedIdx = i;
    });
  });
}

function openCmd() { cmdPalette.classList.add('open'); cmdInput.value = ''; renderCmdResults(); setTimeout(() => cmdInput.focus(), 50); }
function closeCmd() { cmdPalette.classList.remove('open'); }

document.getElementById('cmdTrigger').addEventListener('click', openCmd);
cmdOverlay.addEventListener('click', closeCmd);

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); cmdPalette.classList.contains('open') ? closeCmd() : openCmd(); }
  if (e.key === 'Escape') closeCmd();
  if (cmdPalette.classList.contains('open')) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const items = cmdResults.querySelectorAll('.cmd-item');
      if (items.length === 0) return;
      cmdSelectedIdx = Math.min(cmdSelectedIdx + 1, items.length - 1);
      items.forEach(el => el.classList.remove('selected'));
      items[cmdSelectedIdx]?.classList.add('selected');
      items[cmdSelectedIdx]?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const items = cmdResults.querySelectorAll('.cmd-item');
      if (items.length === 0) return;
      cmdSelectedIdx = Math.max(cmdSelectedIdx - 1, 0);
      items.forEach(el => el.classList.remove('selected'));
      items[cmdSelectedIdx]?.classList.add('selected');
      items[cmdSelectedIdx]?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const items = cmdResults.querySelectorAll('.cmd-item');
      items[cmdSelectedIdx]?.click();
    }
  }
});

cmdInput.addEventListener('input', e => renderCmdResults(e.target.value));

// ─── Scroll Reveal ───────────────────────────────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.section').forEach(s => {
  s.style.opacity = '0';
  s.style.transform = 'translateY(30px)';
  s.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  observer.observe(s);
});

// Make hero visible immediately
const hero = document.querySelector('.hero');
if (hero) { hero.style.opacity = '1'; hero.style.transform = 'translateY(0)'; }

// ─── Smooth scroll for anchor links ──────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
