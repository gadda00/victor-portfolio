/* Victor Ndunda — Portfolio App v3.0
   Particle system (spatial-grid optimized), typewriter (reduced-motion aware),
   theme toggle (class-safe), scroll effects (throttled),
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

  /* ── v9: ROUTING CONSTELLATION ────────────────────────────────
     Replaces the generic drifting particle web (a template cliché)
     with a system topology that mirrors the logo: a few bright nodes
     (cyan / violet / emerald) on stable nearest-neighbour edges, with
     PACKETS routing node-to-node along the edges — data flowing
     through production systems. Arrival makes the node pulse.
     Same public API as the old particle system (particles array,
     initParticles, connectParticles, animate) so the visibility
     observer, resize debounce and mouse hooks keep working.       */

  const PALETTE_DARK  = [[34,211,238],[34,211,238],[34,211,238],[129,140,248],[52,211,153]];
  const PALETTE_LIGHT = [[8,145,178],[8,145,178],[8,145,178],[79,70,229],[4,120,87]];
  let edges = [];   /* [{a,b,dist}] node index pairs */
  let packets = []; /* [{a,b,t,speed}] travelling along an edge */

  class Particle { /* a node in the constellation */
    constructor(w, h) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.12;
      this.vy = (Math.random() - 0.5) * 0.12;
      this.size = Math.random() * 1.3 + 1.1;
      this.opacity = Math.random() * 0.25 + 0.4;
      this.phase = Math.random() * Math.PI * 2;
      this.flash = 0;
      const pal = document.documentElement.classList.contains('light') ? PALETTE_LIGHT : PALETTE_DARK;
      this.rgb = pal[Math.floor(Math.random() * pal.length)];
    }
    update(w, h) {
      this.x += this.vx; this.y += this.vy;
      this.phase += 0.02;
      if (this.flash > 0.01) this.flash *= 0.94; else this.flash = 0;
      if (this.x < 0 || this.x > w) { this.vx *= -1; this.x = Math.max(0, Math.min(w, this.x)); }
      if (this.y < 0 || this.y > h) { this.vy *= -1; this.y = Math.max(0, Math.min(h, this.y)); }
      if (mouse.x !== null) {
        const dx = mouse.x - this.x, dy = mouse.y - this.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 22500) { this.x -= dx * 0.006; this.y -= dy * 0.006; }
      }
    }
    draw(isDark) {
      const pulse = 0.5 + 0.5 * Math.sin(this.phase);
      let a = this.opacity + pulse * 0.18 + this.flash * 0.5;
      if (a > 1) a = 1;
      if (mouse.x !== null) {
        const dx = mouse.x - this.x, dy = mouse.y - this.y;
        if (dx * dx + dy * dy < 32400) a = Math.min(1, a + 0.3); /* brighten near cursor */
      }
      const [r, g, b] = this.rgb;
      /* arrival pulse ring */
      if (this.flash > 0.05) {
        ctx.strokeStyle = `rgba(${r},${g},${b},${(this.flash * 0.35).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 2 + (1 - this.flash) * 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + this.flash * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const count = REDUCED_MOTION ? 10 : Math.max(6, Math.min(16, Math.floor(w * h / 60000)));
    for (let i = 0; i < count; i++) particles.push(new Particle(w, h));

    /* topology: each node links to its 2 nearest neighbours (dedup) */
    edges = [];
    const seen = new Set();
    for (let i = 0; i < particles.length; i++) {
      const near = [];
      for (let j = 0; j < particles.length; j++) {
        if (i === j) continue;
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        near.push([dx * dx + dy * dy, j]);
      }
      near.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < Math.min(2, near.length); k++) {
        const j = near[k][1];
        const key = i < j ? i + ':' + j : j + ':' + i;
        if (seen.has(key)) continue;
        if (near[k][0] > 300 * 300) continue; /* no hair-spanning edges */
        seen.add(key);
        edges.push({ a: Math.min(i, j), b: Math.max(i, j), dist: Math.sqrt(near[k][0]) });
      }
    }
    /* packets: bright signals routing through the mesh */
    packets = [];
    const pc = REDUCED_MOTION ? 0 : Math.min(9, edges.length);
    for (let p = 0; p < pc; p++) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      packets.push({ a: e.a, b: e.b, t: Math.random(), speed: 0.005 + Math.random() * 0.006 });
    }
  }

  function connectParticles(w, h) {
    const isDark = !document.documentElement.classList.contains('light');
    /* edges */
    for (const e of edges) {
      const pa = particles[e.a], pb = particles[e.b];
      if (!pa || !pb) continue;
      const alpha = Math.max(0, 1 - e.dist / 300) * (isDark ? 0.14 : 0.07);
      ctx.strokeStyle = isDark
        ? `rgba(100,190,255,${alpha.toFixed(3)})`
        : `rgba(8,145,178,${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
    /* packets */
    for (const p of packets) {
      const A = particles[p.a], B = particles[p.b];
      if (!A || !B) continue;
      p.t += p.speed;
      if (p.t >= 1) {
        /* arrived: pulse the node, route onward from here */
        B.flash = 1;
        const next = edges.filter(e => e.a === p.b || e.b === p.b);
        const e = next.length ? next[Math.floor(Math.random() * next.length)]
                              : edges[Math.floor(Math.random() * edges.length)];
        if (e) { p.a = p.b; p.b = (e.a === p.b) ? e.b : e.a; }
        p.t = 0;
        continue;
      }
      const x = A.x + (B.x - A.x) * p.t;
      const y = A.y + (B.y - A.y) * p.t;
      const [r, g, b] = B.rgb;
      /* trail */
      const t0 = Math.max(0, p.t - 0.09);
      ctx.strokeStyle = isDark
        ? `rgba(34,211,238,${(0.30 * (1 - p.t * 0.4)).toFixed(3)})`
        : `rgba(8,145,178,0.22)`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(A.x + (B.x - A.x) * t0, A.y + (B.y - A.y) * t0);
      ctx.lineTo(x, y);
      ctx.stroke();
      /* head */
      ctx.fillStyle = isDark ? 'rgba(160,240,255,0.95)' : 'rgba(8,145,178,0.85)';
      ctx.beginPath();
      ctx.arc(x, y, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isDark ? 'rgba(34,211,238,0.16)' : 'rgba(8,145,178,0.12)';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function animate() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const isDark = !document.documentElement.classList.contains('light');
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
    'I build AI systems that run in production.',
    'Creator of Busara AI & AgentReplay · Builder of Keja AI, Tapi Learn & KilimoPRO.',
    'Multi-agent orchestration. Statistical modeling. On-device ML.',
    'Shipping from Nairobi to the world. 🇰🇪',
    'Open-source: AgentReplay, KilimoPRO, IntelliFlow.',
    'Evaluation and observability, built in.',
  ];
  const twEl = document.getElementById('typewriter');

  if (twEl) {
    if (REDUCED_MOTION) {
      // Reduced motion: static tagline, no rotation, no interval
      twEl.textContent = taglines[0];
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
  // 5b. FAB — hide while the final booking CTA band is on screen, so the
  // floating button never competes with the real close (v15)
  // ═══════════════════════════════════════════════════════════════════
  const fabStack = document.querySelector('.fab-stack');
  const bookingBand = document.querySelector('.booking-cta-band');
  if (fabStack && bookingBand && 'IntersectionObserver' in window) {
    const ctaObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        fabStack.style.opacity = entry.isIntersecting ? '0' : '';
        fabStack.style.pointerEvents = entry.isIntersecting ? 'none' : '';
      });
    }, { threshold: 0.35 });
    ctaObserver.observe(bookingBand);
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
    copyBtn.style.cssText = 'background:none;border:none;color:var(--text-dim);cursor:pointer;padding:0.5rem;margin:-0.25rem;opacity:0;transition:opacity 0.2s;flex-shrink:0;';
    card.addEventListener('mouseenter', () => copyBtn.style.opacity = '1');
    card.addEventListener('mouseleave', () => copyBtn.style.opacity = '0');
    copyBtn.addEventListener('focus', () => copyBtn.style.opacity = '1');
    copyBtn.addEventListener('blur', () => copyBtn.style.opacity = '0');
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
  // 8. COUNT-UP STATS — provided by liquid.js (.lg-count[data-count]).
  //    The previous duplicate here fought liquid.js for the same
  //    textContent (both ran rAF loops on the hero numbers).
  // ═══════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════
  // 9. COMMAND PALETTE — moved to /palette.js in v12: one palette, every
  //    page, with services/guides/articles/FAQ search + recent pages.
  // ═══════════════════════════════════════════════════════════════════

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
      const WEB3FORMS_KEY = '4bf37d31-374a-4f3e-add6-3d2e36f7b784';
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

// ═══════════════════════════════════════════════════════════════════
// 14. CONVERSION EVENT HOOKS (privacy-friendly, zero network)
// CTAs carry data-track="..." attributes. Events are queued in-memory
// (window.__vnEvents) and mirrored to console.debug. To wire a provider
// later (Plausible, Umami, GA4), set window.__vnTrack = fn(event) before
// this script runs, or read from window.__vnEvents. No data leaves the
// visitor's browser until a provider is explicitly connected.
// ═══════════════════════════════════════════════════════════════════
(function () {
  'use strict';
  window.__vnEvents = window.__vnEvents || [];
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-track]') : null;
    if (!el) return;
    var ev = {
      event: 'cta_click',
      id: el.getAttribute('data-track'),
      page: window.location.pathname,
      ts: new Date().toISOString()
    };
    window.__vnEvents.push(ev);
    if (typeof window.__vnTrack === 'function') {
      try { window.__vnTrack(ev); } catch (err) { /* provider errors must never break the page */ }
    }
    if (window.console && console.debug) console.debug('[vn-event]', ev.id, ev.page);
  }, { passive: true });
})();
