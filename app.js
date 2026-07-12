/* Victor Ndunda — Portfolio App v3.0
   Particle system (spatial-grid optimized), typewriter (reduced-motion aware),
   command palette (with blog search), theme toggle (class-safe), scroll effects (throttled),
   animated count-up stats, tilt/magnetic cards, copy-to-clipboard, toast system */

(function () {
  'use strict';

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsHover = window.matchMedia('(hover: hover)').matches;

  // ═══════════════════════════════════════════════════════════════════
  // 1. PARTICLE BACKGROUND CANVAS — Spatial grid optimization (was O(n²))
  // ═══════════════════════════════════════════════════════════════════
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return; // Only on home page
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: null, y: null };
  let animationId = null;
  let isVisible = true;
  const CONNECT_DIST = 130;
  const CELL_SIZE = CONNECT_DIST; // Grid cell >= connect distance

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);
  }

  class Particle {
    constructor(w, h) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.size = Math.random() * 2 + 0.5;
      this.opacity = Math.random() * 0.4 + 0.1;
    }
    update(w, h) {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
      if (mouse.x !== null) {
        const dx = mouse.x - this.x, dy = mouse.y - this.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 22500) { // 150²
          this.x -= dx * 0.015; this.y -= dy * 0.015;
        }
      }
    }
    draw(isDark) {
      ctx.fillStyle = isDark
        ? `rgba(0, 212, 255, ${this.opacity})`
        : `rgba(8, 145, 178, ${this.opacity * 0.4})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const count = REDUCED_MOTION ? 20 : Math.min(70, Math.floor(w * h / 18000));
    for (let i = 0; i < count; i++) particles.push(new Particle(w, h));
  }

  // Spatial grid for O(n) neighbor lookup instead of O(n²)
  function buildGrid(w, h) {
    const cols = Math.ceil(w / CELL_SIZE) + 1;
    const rows = Math.ceil(h / CELL_SIZE) + 1;
    const grid = new Array(cols * rows);
    for (let i = 0; i < grid.length; i++) grid[i] = [];
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const cx = Math.max(0, Math.min(cols - 1, Math.floor(p.x / CELL_SIZE)));
      const cy = Math.max(0, Math.min(rows - 1, Math.floor(p.y / CELL_SIZE)));
      grid[cy * cols + cx].push(i);
    }
    return { grid, cols, rows };
  }

  function connectParticles(w, h) {
    const isDark = document.documentElement.classList.contains('dark');
    const { grid, cols, rows } = buildGrid(w, h);
    const checked = new Set();

    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const cell = grid[cy * cols + cx];
        if (!cell.length) continue;
        // Check this cell + 4 neighbors (right, down-right, down, down-left) to avoid dupes
        const neighbors = [
          [cx, cy], [cx + 1, cy], [cx - 1, cy + 1],
          [cx, cy + 1], [cx + 1, cy + 1]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          const ncell = grid[ny * cols + nx];
          if (!ncell.length) continue;
          for (let i = 0; i < cell.length; i++) {
            for (let j = 0; j < ncell.length; j++) {
              const a = cell[i], b = ncell[j];
              if (a >= b) continue;
              const key = a * 1000 + b;
              if (checked.has(key)) continue;
              checked.add(key);
              const pa = particles[a], pb = particles[b];
              const dx = pa.x - pb.x, dy = pa.y - pb.y;
              const distSq = dx * dx + dy * dy;
              if (distSq < CONNECT_DIST * CONNECT_DIST) {
                const dist = Math.sqrt(distSq);
                ctx.strokeStyle = isDark
                  ? `rgba(0, 212, 255, ${(1 - dist / CONNECT_DIST) * 0.12})`
                  : `rgba(8, 145, 178, ${(1 - dist / CONNECT_DIST) * 0.06})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
                ctx.stroke();
              }
            }
          }
        }
      }
    }
  }

  function animate() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const isDark = document.documentElement.classList.contains('dark');
    particles.forEach(p => { p.update(w, h); p.draw(isDark); });
    connectParticles(w, h);
    if (!REDUCED_MOTION) animationId = requestAnimationFrame(animate);
  }

  resizeCanvas();
  initParticles();
  if (REDUCED_MOTION) {
    // Draw a single static frame
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const isDark = document.documentElement.classList.contains('dark');
    particles.forEach(p => { p.draw(isDark); });
    connectParticles(w, h);
  } else {
    animate();
  }

  // Pause animation when canvas off-screen (performance)
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isVisible && !REDUCED_MOTION) {
          isVisible = true;
          animate();
        } else if (!entry.isIntersecting && isVisible) {
          isVisible = false;
          if (animationId) cancelAnimationFrame(animationId);
        }
      });
    }, { threshold: 0 });
    heroObserver.observe(canvas);
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resizeCanvas(); initParticles(); }, 200);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 2. TYPEWRITER EFFECT — Reduced-motion aware
  // ═══════════════════════════════════════════════════════════════════
  const taglines = [
    'I build production AI systems — not demos.',
    'Founder of Busara AI · Creator of AgentReplay · Builder of KilimoPRO.',
    'Multi-agent orchestration. Real statistical math. On-device ML.',
    'Shipping from Nairobi to the world. 🇰🇪',
    'Open-source: AgentReplay, KilimoPRO, IntelliFlow.',
    'Real math, not vibes.',
  ];
  const twEl = document.getElementById('typewriter');

  if (twEl) {
    if (REDUCED_MOTION) {
      // Show first tagline statically, cycle slowly via interval
      twEl.textContent = taglines[0];
      let idx = 0;
      setInterval(() => {
        idx = (idx + 1) % taglines.length;
        twEl.textContent = taglines[idx];
      }, 4000);
    } else {
      let tagIdx = 0, charIdx = 0, isDeleting = false;
      function typewriter() {
        const current = taglines[tagIdx];
        if (isDeleting) {
          twEl.textContent = current.substring(0, charIdx - 1);
          charIdx--;
          if (charIdx === 0) {
            isDeleting = false;
            tagIdx = (tagIdx + 1) % taglines.length;
            setTimeout(typewriter, 500);
            return;
          }
          setTimeout(typewriter, 30);
        } else {
          twEl.textContent = current.substring(0, charIdx + 1);
          charIdx++;
          if (charIdx === current.length) {
            isDeleting = true;
            setTimeout(typewriter, 2500);
            return;
          }
          setTimeout(typewriter, 60);
        }
      }
      typewriter();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. NAVBAR SCROLL EFFECT — Throttled with rAF
  // ═══════════════════════════════════════════════════════════════════
  const navbar = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  let scrollTicking = false;

  function onScroll() {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    // Active section tracking
    let current = '';
    sections.forEach(s => {
      const top = s.offsetTop - 120;
      if (window.scrollY >= top) current = s.id;
    });
    navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
    });
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(onScroll);
      scrollTicking = true;
    }
  }, { passive: true });

  // ═══════════════════════════════════════════════════════════════════
  // 4. THEME TOGGLE — Class-safe (was overwriting entire className)
  // ═══════════════════════════════════════════════════════════════════
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';

  // Apply saved theme without clobbering other classes
  html.classList.remove('dark', 'light');
  html.classList.add(savedTheme);

  // Update theme-color meta to match
  function updateThemeColor() {
    const isDark = html.classList.contains('dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0a0e1a' : '#f8fafc');
  }
  updateThemeColor();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = html.classList.contains('dark');
      html.classList.remove('dark', 'light');
      html.classList.add(isDark ? 'light' : 'dark');
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
      updateThemeColor();
      // Re-draw particles with new colors
      if (!REDUCED_MOTION && canvas) {
        // Colors update automatically on next frame
      }
    });
  }

  // Respect system theme changes if user hasn't explicitly chosen
  if (!localStorage.getItem('theme')) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      html.classList.remove('dark', 'light');
      html.classList.add(e.matches ? 'dark' : 'light');
      updateThemeColor();
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 5. MOBILE MENU
  // ═══════════════════════════════════════════════════════════════════
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinksContainer = document.getElementById('navLinks');
  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinksContainer.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });
    navLinks.forEach(a => a.addEventListener('click', () => {
      navLinksContainer.classList.remove('open');
      mobileToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // ═══════════════════════════════════════════════════════════════════
  // 6. TOAST NOTIFICATION SYSTEM
  // ═══════════════════════════════════════════════════════════════════
  window.showToast = function(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      copy: '📋'
    };
    toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // ═══════════════════════════════════════════════════════════════════
  // 7. COPY-TO-CLIPBOARD for contact cards
  // ═══════════════════════════════════════════════════════════════════
  document.querySelectorAll('.contact-card').forEach(card => {
    const valueEl = card.querySelector('.contact-value');
    if (!valueEl) return;
    const value = valueEl.textContent.trim();
    // Add copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'contact-copy';
    copyBtn.setAttribute('aria-label', `Copy ${value}`);
    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    copyBtn.style.cssText = 'background:none;border:none;color:var(--text-dim);cursor:pointer;padding:0.25rem;opacity:0;transition:opacity 0.2s;flex-shrink:0;';
    card.addEventListener('mouseenter', () => copyBtn.style.opacity = '1');
    card.addEventListener('mouseleave', () => copyBtn.style.opacity = '0');
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
        window.showToast(`Copied: ${value}`, 'copy', 2000);
      } catch {
        window.showToast('Copy failed', 'error', 2000);
      }
    });
    card.querySelector('.contact-icon').after(copyBtn);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 8. ANIMATED COUNT-UP STATS (hero)
  // ═══════════════════════════════════════════════════════════════════
  function animateCount(el, target, suffix = '', duration = 1500) {
    const start = 0;
    const startTime = performance.now();
    const isFloat = target % 1 !== 0;

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = start + (target - start) * eased;
      el.textContent = (isFloat ? value.toFixed(0) : Math.floor(value)) + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = (isFloat ? target : target) + suffix;
    }
    requestAnimationFrame(update);
  }

  const heroStats = document.querySelectorAll('.hero-stat .num');
  if (heroStats.length && !REDUCED_MOTION) {
    const statObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const raw = el.textContent.trim();
          const num = parseInt(raw, 10);
          const suffix = raw.replace(/[\d.]/g, '');
          if (!isNaN(num)) animateCount(el, num, suffix, 1500);
          statObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    heroStats.forEach(s => statObserver.observe(s));
  }

  // ═══════════════════════════════════════════════════════════════════
  // 9. COMMAND PALETTE (Cmd+K) — with blog article search
  // ═══════════════════════════════════════════════════════════════════
  const cmdPalette = document.getElementById('cmdPalette');
  const cmdInput = document.getElementById('cmdInput');
  const cmdResults = document.getElementById('cmdResults');
  const cmdOverlay = document.getElementById('cmdOverlay');
  let cmdSelectedIdx = 0;
  let blogPosts = [];
  let blogPostsLoaded = false;

  // Fetch blog posts for search (lazy — only when palette opens first time)
  function loadBlogPosts() {
    if (blogPostsLoaded) return Promise.resolve(blogPosts);
    blogPostsLoaded = true;
    return fetch('/blog/posts.json')
      .then(r => r.json())
      .then(data => {
        blogPosts = (data.posts || []).map(p => ({
          icon: '📝', title: p.title, desc: p.excerpt.substring(0, 60) + '...',
          action: () => window.location.href = p.url
        }));
        return blogPosts;
      })
      .catch(() => []);
  }

  const cmdCommands = [
    { icon: '🏠', title: 'Go to Home', desc: 'Back to the top', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { icon: '👨‍💻', title: 'About Victor', desc: 'Learn about my background', action: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
    { icon: '🚀', title: 'View My Work', desc: 'Busara AI, KilimoPRO & more', action: () => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }) },
    { icon: '📡', title: 'Now / Currently Building', desc: 'What I am working on right now', action: () => document.getElementById('now')?.scrollIntoView({ behavior: 'smooth' }) },
    { icon: '🛠️', title: 'Tech Stack', desc: 'Languages, frameworks & tools', action: () => document.getElementById('techstack')?.scrollIntoView({ behavior: 'smooth' }) },
    { icon: '📝', title: 'Read My Blog', desc: 'Research and technical articles', action: () => window.location.href = '/blog/' },
    { icon: '💼', title: 'Job Portal', desc: 'Search AI engineering jobs', action: () => window.location.href = '/jobs/' },
    { icon: '🛠️', title: 'Services', desc: 'What I can build for you', action: () => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) },
    { icon: '📧', title: 'Contact Me', desc: 'Get in touch', action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
    { icon: '📄', title: 'View Resume', desc: 'Full resume page', action: () => window.location.href = '/resume/' },
    { icon: '⬇️', title: 'Download Resume PDF', desc: 'Victor-Ndunda-Resume.pdf', action: () => window.location.href = '/resume/Victor-Ndunda-Resume.pdf' },
    { icon: '🚀', title: 'Visit Busara AI', desc: 'busaraai.com — live platform', action: () => window.open('https://busaraai.com', '_blank') },
    { icon: '🌱', title: 'Visit KilimoPRO', desc: 'github.com/gadda00/kilimopro', action: () => window.open('https://github.com/gadda00/kilimopro', '_blank') },
    { icon: '🐙', title: 'GitHub Profile', desc: 'github.com/gadda00', action: () => window.open('https://github.com/gadda00', '_blank') },
    { icon: '💼', title: 'LinkedIn', desc: 'linkedin.com/in/victor-ndunda', action: () => window.open('https://www.linkedin.com/in/victor-ndunda', '_blank') },
    { icon: '📧', title: 'Email Me', desc: 'mututandunda@gmail.com', action: () => window.location.href = 'mailto:mututandunda@gmail.com' },
    { icon: '📱', title: 'Call Me', desc: '+254 724 346 971', action: () => window.location.href = 'tel:+254724346971' },
    { icon: '💬', title: 'WhatsApp', desc: 'Chat on WhatsApp', action: () => window.open('https://wa.me/254724346971', '_blank') },
    { icon: '🌓', title: 'Toggle Theme', desc: 'Switch dark/light mode', action: () => themeToggle?.click() },
  ];

  function getAllCommands() {
    return [...cmdCommands, ...blogPosts];
  }

  function renderCmdResults(filter = '') {
    const all = getAllCommands();
    const filtered = filter
      ? all.filter(c =>
          c.title.toLowerCase().includes(filter.toLowerCase()) ||
          c.desc.toLowerCase().includes(filter.toLowerCase()))
      : all;
    cmdSelectedIdx = 0;
    cmdResults.innerHTML = filtered.slice(0, 12).map((c, i) => `
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

  function openCmd() {
    cmdPalette.classList.add('open');
    cmdInput.value = '';
    renderCmdResults();
    // Lazy load blog posts for search
    loadBlogPosts().then(() => {
      if (cmdPalette.classList.contains('open')) renderCmdResults(cmdInput.value);
    });
    setTimeout(() => cmdInput.focus(), 50);
  }
  function closeCmd() { cmdPalette.classList.remove('open'); }

  const cmdTrigger = document.getElementById('cmdTrigger');
  if (cmdTrigger) cmdTrigger.addEventListener('click', openCmd);
  if (cmdOverlay) cmdOverlay.addEventListener('click', closeCmd);

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      cmdPalette.classList.contains('open') ? closeCmd() : openCmd();
    }
    if (e.key === 'Escape') closeCmd();
    if (cmdPalette && cmdPalette.classList.contains('open')) {
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

  if (cmdInput) cmdInput.addEventListener('input', e => renderCmdResults(e.target.value));

  // ═══════════════════════════════════════════════════════════════════
  // 10. SCROLL REVEAL — Staggered, with IntersectionObserver
  // ═══════════════════════════════════════════════════════════════════
  if (!REDUCED_MOTION) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.section, .work-card, .service-card, .about-card, .testimonial-card, .edu-item').forEach((s, i) => {
      s.classList.add('reveal-target');
      s.style.transitionDelay = `${Math.min(i * 0.05, 0.3)}s`;
      revealObserver.observe(s);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 11. SMOOTH SCROLL for anchor links
  // ═══════════════════════════════════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 12. TILT/MAGNETIC EFFECT on work cards (desktop only, non-reduced-motion)
  // ═══════════════════════════════════════════════════════════════════
  if (supportsHover && !REDUCED_MOTION) {
    document.querySelectorAll('.work-card.featured, .about-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rx = ((y - cy) / cy) * -4;
        const ry = ((x - cx) / cx) * 4;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 13. GITHUB ACTIVITY WIDGET — Lazy-loaded when visible
  // ═══════════════════════════════════════════════════════════════════
  const ghWidget = document.getElementById('githubActivity');
  if (ghWidget) {
    let ghLoaded = false;
    function loadGitHubRepos() {
      if (ghLoaded) return;
      ghLoaded = true;
      fetch('https://api.github.com/users/gadda00/repos?sort=updated&per_page=6')
        .then(r => r.json())
        .then(repos => {
          if (!Array.isArray(repos) || repos.length === 0) {
            ghWidget.innerHTML = '<p class="gh-empty">Unable to load recent activity.</p>';
            return;
          }
          const html = repos.slice(0, 6).map(repo => `
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="gh-repo">
              <div class="gh-repo-head">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.6 18 4.9 18 4.9c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
                <span class="gh-repo-name">${repo.name}</span>
              </div>
              <p class="gh-repo-desc">${repo.description || 'No description provided.'}</p>
              <div class="gh-repo-meta">
                <span class="gh-lang" style="--lang-color: ${getLangColor(repo.language)}">${repo.language || 'Various'}</span>
                <span class="gh-stars">★ ${repo.stargazers_count}</span>
                <span class="gh-updated">${timeAgo(repo.updated_at)}</span>
              </div>
            </a>
          `).join('');
          ghWidget.innerHTML = html;
        })
        .catch(() => {
          ghWidget.innerHTML = '<p class="gh-empty">GitHub API rate limited. <a href="https://github.com/gadda00" target="_blank">View profile →</a></p>';
        });
    }

    // Lazy load when the section is near viewport
    if ('IntersectionObserver' in window) {
      const ghObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadGitHubRepos();
            ghObserver.disconnect();
          }
        });
      }, { rootMargin: '200px' });
      ghObserver.observe(ghWidget);
    } else {
      // Fallback: load after 2s
      setTimeout(loadGitHubRepos, 2000);
    }
  }

  function getLangColor(lang) {
    const colors = {
      TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
      Dart: '#00B4AB', HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
      'Jupyter Notebook': '#DA5B0B', Java: '#b07219', Kotlin: '#A97BFF',
      Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95',
    };
    return colors[lang] || '#8b949e';
  }

  function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'today';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 14. LIVE STATUS BADGE — random "currently building" messages
  // ═══════════════════════════════════════════════════════════════════
  const statusEl = document.getElementById('liveStatus');
  if (statusEl) {
    const statuses = [
      'Building a 50-agent DAG pipeline',
      'Training crop disease models',
      'Integrating 22 data sources',
      'Shipping production AI',
      'Optimizing for low-end phones',
      'Writing statistical algorithms',
    ];
    let sIdx = 0;
    statusEl.textContent = statuses[0];
    if (!REDUCED_MOTION) {
      setInterval(() => {
        sIdx = (sIdx + 1) % statuses.length;
        statusEl.style.opacity = '0';
        setTimeout(() => {
          statusEl.textContent = statuses[sIdx];
          statusEl.style.opacity = '1';
        }, 300);
      }, 4000);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 15. KEYBOARD SHORTCUTS — '?' to show help
  // ═══════════════════════════════════════════════════════════════════
  document.addEventListener('keydown', e => {
    // Don't trigger when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      window.showToast('⌘K Command palette · ⌘/ Toggle theme · ESC Close', 'info', 4000);
    }
    // Quick theme toggle with Shift+D
    if (e.shiftKey && (e.key === 'D' || e.key === 'd') && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      themeToggle?.click();
    }
  });

  if (window.location.hostname === 'localhost') console.log('%c Victor Ndunda Portfolio ', 'background:linear-gradient(135deg,#00d4ff,#a855f7);color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px;');

  // ═══════════════════════════════════════════════════════════════════
  // 16. TECH STACK FILTERING
  // ═══════════════════════════════════════════════════════════════════
  const techFilters = document.querySelectorAll('.tech-filter');
  const techItems = document.querySelectorAll('.tech-item');
  techFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat');
      techFilters.forEach(f => {
        f.classList.remove('active');
        f.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      techItems.forEach(item => {
        if (cat === 'all' || item.getAttribute('data-cat') === cat) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 17. NEWSLETTER FORM — Web3Forms with mailto fallback
  // ═══════════════════════════════════════════════════════════════════
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"]').value.trim();
      if (!email) return;
      const submitBtn = newsletterForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Subscribing…'; }

      // Store locally as backup
      try {
        const list = JSON.parse(localStorage.getItem('vn_subscribers') || '[]');
        if (!list.includes(email)) list.push(email);
        localStorage.setItem('vn_subscribers', JSON.stringify(list));
      } catch {}

      // Try Web3Forms if a real key is configured (replace YOUR_ACCESS_KEY)
      const WEB3FORMS_KEY = 'f695c261-e59a-4b77-a6cf-55f4b4883427';
      if (WEB3FORMS_KEY && WEB3FORMS_KEY !== 'YOUR_ACCESS_KEY') {
        try {
          const formData = new FormData();
          formData.append('access_key', WEB3FORMS_KEY);
          formData.append('subject', 'New newsletter subscriber');
          formData.append('from_name', 'Victor Ndunda Portfolio');
          formData.append('email', email);
          formData.append('subscriber_email', email);
          const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST', body: formData,
          });
          const result = await response.json();
          if (result.success) {
            newsletterForm.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--accent-3);font-weight:600">✓ You\'re subscribed! I\'ll only email when something big ships.</div>';
            window.showToast('Subscribed successfully!', 'success', 3000);
            return;
          }
        } catch (err) { /* fall through to mailto */ }
      }

      // Fallback: open mailto with pre-filled subject
      window.location.href = `mailto:mututandunda@gmail.com?subject=Newsletter%20Subscription&body=Please%20add%20me%20to%20your%20newsletter%3A%0A%0AEmail%3A%20${encodeURIComponent(email)}`;
      newsletterForm.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--accent-3);font-weight:600">✓ Opening your email client… (or email mututandunda@gmail.com directly)</div>';
      window.showToast('Subscription opened in your email client', 'info', 4000);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 18. CUSTOM CURSOR (desktop only, non-reduced-motion)
  // ═══════════════════════════════════════════════════════════════════
  if (supportsHover && !REDUCED_MOTION) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.classList.add('active');
      ring.classList.add('active');
      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
    });
    document.addEventListener('mouseleave', () => {
      dot.classList.remove('active');
      ring.classList.remove('active');
    });

    // Smooth ring follow
    function updateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
      requestAnimationFrame(updateRing);
    }
    updateRing();

    // Grow ring on hoverable elements
    document.querySelectorAll('a, button, .work-card, .tech-item, .gh-repo, .nav-link').forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.style.width = '48px';
        ring.style.height = '48px';
      });
      el.addEventListener('mouseleave', () => {
        ring.style.width = '36px';
        ring.style.height = '36px';
      });
    });
  }
})();
