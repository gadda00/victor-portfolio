/* Victor Ndunda — Social Media Composer
   - Generates platform-specific posts from one topic
   - 6 platforms: LinkedIn, X, Facebook, Instagram, TikTok, WhatsApp
   - 4 tones: professional, casual, technical, story
   - Char count + platform limits
   - Copy to clipboard + direct links to composers
   - History saved to localStorage
*/
(function () {
  'use strict';

  function $(s) { return document.querySelector(s); }

  // ── Theme bootstrap ───────────────────────────────────────────────
  var stored = localStorage.getItem('theme');
  var theme = stored || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);
  var tt = $('#themeToggle');
  if (tt) tt.addEventListener('click', function () {
    var cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var nxt = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.remove(cur);
    document.documentElement.classList.add(nxt);
    localStorage.setItem('theme', nxt);
  });
  var mt = $('#mobileToggle');
  var nl = $('#navLinks');
  if (mt && nl) mt.addEventListener('click', function () {
    nl.classList.toggle('open');
    mt.setAttribute('aria-expanded', nl.classList.contains('open') ? 'true' : 'false');
  });

  // ── State ─────────────────────────────────────────────────────────
  var state = {
    tone: 'professional',
    topic: '',
    posts: {},
  };
  var HISTORY_KEY = 'vn_social_history';
  var MAX_HISTORY = 50;

  // ── Platform configs ──────────────────────────────────────────────
  var PLATFORMS = {
    linkedin: { name: 'LinkedIn', icon: '💼', limit: 3000, composeUrl: 'https://www.linkedin.com/feed/?shareActive=true' },
    x: { name: 'X (Twitter)', icon: '𝕏', limit: 280, composeUrl: 'https://twitter.com/intent/tweet?text=' },
    facebook: { name: 'Facebook', icon: '📘', limit: 63206, composeUrl: 'https://www.facebook.com/sharer/sharer.php?u=' },
    instagram: { name: 'Instagram', icon: '📷', limit: 2200, composeUrl: 'https://www.instagram.com/' },
    tiktok: { name: 'TikTok', icon: '🎵', limit: 150, composeUrl: 'https://www.tiktok.com/upload' },
    whatsapp: { name: 'WhatsApp', icon: '💬', limit: 65536, composeUrl: 'https://wa.me/?text=' },
  };

  // ── Post generators ───────────────────────────────────────────────
  function generatePost(platform, topic, tone) {
    var t = topic.trim();
    if (!t) return '';

    var hooks = {
      professional: {
        linkedin: 'I just shipped something I want to share:\n\n' + t + '\n\nHere\'s what I learned:\n• Real engineering beats demo engineering every time\n• The math underneath matters — not just the model\n• Built for Nairobi, works for the world\n\nIf you\'re building AI in Africa, let\'s connect.\n\n#AI #MachineLearning #Nairobi #AfricaTech',
        x: t + '\n\nReal math. Real shipping. Built in Nairobi. 🇰🇪\n\n#AI #MachineLearning',
        facebook: 'Just published: ' + t + '\n\nI build AI systems that work in Swahili, run on cheap phones, and ship to real users. This is what that looks like in practice.\n\nRead the full story at victorndunda.com/blog/',
        instagram: 'New drop 🚀\n\n' + t + '\n\nBuilt in Nairobi for Africa and the world. Real math, not wrappers. 🇰🇪\n\n#AI #MachineLearning #Nairobi #Kenya #AfricaTech #Developer #Engineering',
        tiktok: 'POV: you build AI in Nairobi 🇰🇪\n\n' + t.slice(0, 80) + '\n\nReal math. Real shipping. 🚀',
        whatsapp: 'Hi! I just published something you might find interesting:\n\n' + t + '\n\nRead it here: victorndunda.com/blog/',
      },
      casual: {
        linkedin: 'Okay this was fun to build 👇\n\n' + t + '\n\nNo buzzwords. Just code that works. Real users. Real impact.\n\nWho else is building cool AI stuff in Africa? 👋',
        x: 'just shipped: ' + t.toLowerCase() + '\n\nno vibes, just code. built in nairobi 🇰🇪',
        facebook: 'So I built a thing 😅\n\n' + t + '\n\nTurns out AI that actually works in Africa needs to work offline, in Swahili, on $80 phones. Who knew?',
        instagram: 'built a thing 🛠️\n\n' + t + '\n\nnairobi → the world 🇰🇪✨\n\n#AI #Nairobi #BuiltInAfrica #DeveloperLife',
        tiktok: 'me: let\'s build AI\nalso me: *builds AI in Nairobi* 🇰🇪\n\n' + t.slice(0, 60),
        whatsapp: 'Hey! Check this out:\n\n' + t + '\n\nLink: victorndunda.com/blog/',
      },
      technical: {
        linkedin: 'Technical deep dive:\n\n' + t + '\n\nArchitecture:\n• Multi-agent DAG pipeline (7 stages, 50 agents)\n• Real statistical algorithms: Holt-Winters, OLS, K-Means++, Granger\n• TypeScript + Next.js 15 + PostgreSQL + Redis\n• Circuit breakers + smart caching\n\nNo wrappers. No vibes. Just math that ships.\n\n#AI #TypeScript #MultiAgent #DataEngineering',
        x: 'technical: ' + t + '\n\n50 agents · 7-stage DAG · real stats (Holt-Winters, OLS, K-Means++) · TypeScript\n\nno wrappers. just math.',
        facebook: 'For the engineers:\n\n' + t + '\n\nStack: TypeScript, Next.js 15, PostgreSQL, Redis, Docker. Real algorithms implemented from scratch — Holt-Winters forecasting, Z-score/IQR/EWMA anomaly ensembles, OLS regression, Granger causality, K-Means++ clustering.\n\nCode + architecture: victorndunda.com/blog/',
        instagram: 'for the builders 🛠️\n\n' + t + '\n\n50 agents · 7-stage DAG · real math\n\n#AI #Engineering #TypeScript #MultiAgent #Nairobi',
        tiktok: 'how I built a 50-agent AI system 🧠\n\n' + t.slice(0, 60) + '\n\ndag pipeline. real stats. no vibes.',
        whatsapp: 'Technical writeup:\n\n' + t + '\n\nFull breakdown: victorndunda.com/blog/',
      },
      story: {
        linkedin: 'A story about building in Nairobi:\n\n' + t + '\n\nTwo years ago I was consulting — building forecasts for fintechs, dashboards for logistics companies. Good work, but I kept hitting the same wall: every client wanted "AI" but nobody had the infrastructure.\n\nSo I built Busara AI — a 50-agent platform that does the heavy lifting. And KilimoPRO — AI for farmers that works on $80 phones, offline, in Swahili.\n\nThe lesson? Build for the constraints. The constraints are the product.\n\n#AI #Nairobi #AfricaTech #FounderJourney',
        x: '2 years ago: consulting, building dashboards\n\ntoday: ' + t + '\n\nbuild for the constraints. the constraints are the product. 🇰🇪',
        facebook: 'I want to tell you a story.\n\n' + t + '\n\nI started by building forecasts for fintechs. Then fraud detection. Then customer segmentation. Every client wanted AI — but nobody had the data infrastructure.\n\nSo I built the infrastructure. Now Busara AI runs 50 agents in a DAG pipeline. KilimoPRO runs on $80 phones, offline, in Swahili.\n\nBuild for the constraints. The constraints ARE the product.\n\nRead more: victorndunda.com/',
        instagram: 'a story 📖\n\n' + t + '\n\nfrom consulting → building busara AI\nfrom dashboards → 50-agent DAGs\nfrom "AI would be nice" → AI that works on $80 phones in Swahili\n\nbuild for the constraints. the constraints are the product. 🇰🇪\n\n#FounderJourney #AI #Nairobi #AfricaTech',
        tiktok: '2 years ago: building dashboards\ntoday: ' + t.slice(0, 50) + '\n\nbuild for the constraints. 🇰🇪',
        whatsapp: 'A quick story:\n\n' + t + '\n\nI went from building dashboards to building 50-agent AI systems. The lesson? Build for the constraints — the constraints are the product.\n\nMore: victorndunda.com/',
      },
    };

    return hooks[tone][platform] || hooks.professional[platform];
  }

  // ── Generate all posts ────────────────────────────────────────────
  function generateAll() {
    var topic = $('#topicInput').value.trim();
    if (!topic) {
      alert('Enter a topic first.');
      return;
    }
    state.topic = topic;
    state.posts = {};
    Object.keys(PLATFORMS).forEach(function (p) {
      state.posts[p] = generatePost(p, topic, state.tone);
    });
    renderPosts();
    saveToHistory(topic);
  }

  // ── Render posts ──────────────────────────────────────────────────
  function renderPosts() {
    var grid = $('#postsGrid');
    if (!Object.keys(state.posts).length) {
      grid.innerHTML = '<div class="social-empty"><h3>Your posts will appear here</h3><p>Enter a topic above and click Generate.</p></div>';
      return;
    }
    grid.innerHTML = Object.keys(PLATFORMS).map(function (p) {
      var config = PLATFORMS[p];
      var content = state.posts[p] || '';
      var len = content.length;
      var charClass = len <= config.limit * 0.8 ? 'ok' : (len <= config.limit ? 'warn' : 'over');
      var encoded = encodeURIComponent(content);
      var composeUrl = config.composeUrl;
      if (p === 'x') composeUrl = 'https://twitter.com/intent/tweet?text=' + encoded;
      if (p === 'whatsapp') composeUrl = 'https://wa.me/?text=' + encoded;
      if (p === 'facebook') composeUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent('https://victorndunda.com') + '&quote=' + encoded;

      return '<div class="post-card">' +
        '<div class="post-card-head">' +
          '<div class="post-platform-icon ' + p + '">' + config.icon + '</div>' +
          '<div class="post-platform-name">' + config.name + '</div>' +
          '<div class="post-char-count ' + charClass + '">' + len + '/' + config.limit + '</div>' +
        '</div>' +
        '<div class="post-content" id="post-' + p + '">' + escapeHtml(content) + '</div>' +
        '<div class="post-actions">' +
          '<button data-action="copy" data-platform="' + p + '">Copy</button>' +
          '<a href="' + composeUrl + '" target="_blank" rel="noopener" data-action="open" data-platform="' + p + '"><button type="button">Open ' + config.name + ' ↗</button></a>' +
        '</div>' +
      '</div>';
    }).join('');

    // Wire copy buttons
    grid.querySelectorAll('[data-action="copy"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.dataset.platform;
        var content = state.posts[p] || '';
        navigator.clipboard.writeText(content).then(function () {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
        });
      });
    });
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── History ───────────────────────────────────────────────────────
  function saveToHistory(topic) {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      arr.push({ topic: topic, tone: state.tone, ts: Date.now(), platforms: Object.keys(PLATFORMS) });
      if (arr.length > MAX_HISTORY) arr = arr.slice(-MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
      renderHistory();
    } catch (e) { /* ignore */ }
  }

  function renderHistory() {
    var list = $('#historyList');
    var raw = localStorage.getItem(HISTORY_KEY);
    var arr = raw ? JSON.parse(raw) : [];
    if (!arr.length) {
      list.innerHTML = '<div class="history-empty">No posts generated yet.</div>';
      return;
    }
    list.innerHTML = arr.slice().reverse().slice(0, 20).map(function (h) {
      var d = new Date(h.ts);
      var time = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      return '<div class="history-item">' +
        '<span class="history-time">' + time + '</span>' +
        '<span class="history-topic">' + escapeHtml(h.topic.slice(0, 80)) + (h.topic.length > 80 ? '…' : '') + '</span>' +
        '<span class="history-platforms">' + h.platforms.length + ' posts · ' + h.tone + '</span>' +
      '</div>';
    }).join('');
  }

  // ── Load latest article ───────────────────────────────────────────
  function loadLatestArticle() {
    fetch('/blog/posts.json').then(function (r) { return r.json(); }).then(function (data) {
      var posts = data.posts || [];
      if (!posts.length) {
        alert('No blog posts found.');
        return;
      }
      var latest = posts[0];
      $('#topicInput').value = 'I just published a new article: "' + latest.title + '" — ' + latest.excerpt;
    }).catch(function () { alert('Could not load blog posts.'); });
  }

  // ── Wire up ───────────────────────────────────────────────────────
  function $$(s) { return Array.from(document.querySelectorAll(s)); }

  $('#generateBtn').addEventListener('click', generateAll);
  $('#loadArticleBtn').addEventListener('click', loadLatestArticle);
  $('#clearBtn').addEventListener('click', function () {
    $('#topicInput').value = '';
    state.posts = {};
    renderPosts();
  });
  $('#clearHistoryBtn').addEventListener('click', function () {
    if (!confirm('Clear all post history?')) return;
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });
  $$('.tone-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.tone-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.tone = btn.dataset.tone;
      if (state.topic) generateAll();
    });
  });

  // Init
  renderHistory();
})();
