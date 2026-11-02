/* Victor Ndunda — schematic.js (v12 "FIELD DRAFT")
   The hero production-line schematic, alive:
   - packets stream from SOURCES through INGEST → EMBED → RETRIEVE →
     GENERATE → EVAL and terminate at the USERS wall
   - ~18% of packets FAIL the eval gate: they turn terracotta and ride
     the EVAL LOOP back through RETRIEVE (caught before users see them)
   - nodes flash when a packet passes; the USERS wall flashes on arrival
   - hover / focus / tap a node → the readout bar shows its real evidence
   - click anywhere → burst of traffic
   Reduced motion: no animation loop; hover/focus readout still works.
   No JS at all: the inline SVG is fully labelled and readable. */
(function () {
  'use strict';

  var svg = document.getElementById('prodLine');
  var readout = document.getElementById('plReadout');
  if (!svg || !readout) return;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var layer = document.getElementById('plPackets');

  /* Real evidence per node — every number from a shipped system. */
  var FACTS = {
    'src-listings': 'SOURCE · LISTINGS — 87+ verified property listings live on keja.app across 12 Kenyan counties (Keja AI public trial)',
    'src-docs': 'SOURCE · DOCS — verified titles & documents, the trust layer under every listing (Keja AI)',
    'src-txns': 'SOURCE · TXNS — 1,000 labelled transactions validated the fraud engine: 84% recall · 1.37% false positives',
    'ingest': 'INGEST — 87+ listings from 12 counties flow through 8 stakeholder workspaces (Keja AI, live public trial)',
    'embed': 'EMBED — one pipeline, three languages: English · Français · Kiswahili (Tapi Learn NLP, 11K+ learners)',
    'retrieve': 'RETRIEVE — hybrid search + reranking with citations, tuned for low-bandwidth clients',
    'generate': 'GENERATE — cited answers for learners; the fraud engine scores in ~33µs per transaction',
    'eval': 'EVAL GATE — 84% recall · 1.37% false positives on 1,000 labelled transactions; every score explainable',
    'users': 'USERS — 11,000+ learners across 38 countries · 4.8/5 client-reported rating (Tapi Learn)'
  };
  var DEFAULT_READOUT = '13 SYSTEMS DESIGNED, BUILT & SHIPPED · TAP A STAGE FOR ITS EVIDENCE';

  /* Node flash points on the main run (x on y=176) + eval + wall. */
  var NODE_EL = {};
  Array.prototype.forEach.call(svg.querySelectorAll('.pl-node'), function (g) {
    NODE_EL[g.getAttribute('data-node')] = g;
  });

  var SOURCES = [{ x: 63, y: 96 }, { x: 63, y: 176 }, { x: 63, y: 256 }];

  /* Waypoint chains (viewBox units). */
  var MAIN = [
    [104, 176], [160, 176],           // ingest
    [288, 176],                       // embed
    [416, 176],                       // retrieve
    [544, 176],                       // generate
    [544, 276], [544, 296],           // eval
    [596, 296]                        // users wall
  ];
  var LOOP = [
    [544, 316], [544, 356],           // down from eval
    [416, 356], [416, 236],           // back to retrieve
    [416, 176], [544, 176],           // re-run generate
    [544, 276], [544, 296],           // eval again — passes this time
    [596, 296]
  ];

  function chainLength(pts) {
    var d = 0;
    for (var i = 1; i < pts.length; i++) {
      d += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
    }
    return d;
  }
  function pointAt(pts, dist) {
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
      var seg = Math.abs(dx) + Math.abs(dy);
      if (dist <= seg) {
        var t = seg === 0 ? 0 : dist / seg;
        return [pts[i - 1][0] + dx * t, pts[i - 1][1] + dy * t];
      }
      dist -= seg;
    }
    return pts[pts.length - 1];
  }

  /* Node flash points: flash when a packet passes a known centre. */
  var CENTERS = [
    { x: 160, y: 176, node: 'ingest' },
    { x: 288, y: 176, node: 'embed' },
    { x: 416, y: 176, node: 'retrieve' },
    { x: 544, y: 176, node: 'generate' },
    { x: 544, y: 296, node: 'eval' }
  ];

  var packets = [];
  var flashes = {}; // node -> timestamp of last flash

  function makePacket() {
    var src = SOURCES[Math.floor(Math.random() * SOURCES.length)];
    var bad = Math.random() < 0.18;
    var head = [[src.x, src.y], [104, src.y]];
    var pts = head.concat(MAIN);
    if (bad) {
      // route through the eval loop after the eval node
      pts = head.concat(MAIN.slice(0, 6)).concat(LOOP);
    }
    var el = document.createElementNS(NS, 'circle');
    el.setAttribute('r', bad ? 3.4 : 3);
    el.setAttribute('class', 'pl-packet' + (bad ? ' bad' : ''));
    layer.appendChild(el);
    packets.push({
      pts: pts,
      dist: 0,
      speed: 105 + Math.random() * 40,
      el: el,
      bad: bad,
      fading: false,
      opacity: 1
    });
    if (packets.length > 14) packets.shift(); // hard cap
  }

  function flashNode(key) {
    var g = NODE_EL[key];
    if (!g) return;
    var now = performance.now();
    if (flashes[key] && now - flashes[key] < 700) return;
    flashes[key] = now;
    g.classList.add('hit');
    setTimeout(function () { g.classList.remove('hit'); }, 420);
  }

  var lastTime = null;
  var running = false;

  function tick(ts) {
    if (!running) return;
    if (lastTime == null) lastTime = ts;
    var dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    for (var i = packets.length - 1; i >= 0; i--) {
      var p = packets[i];
      if (p.fading) {
        p.opacity -= dt * 4;
        if (p.opacity <= 0) {
          p.el.remove();
          packets.splice(i, 1);
          continue;
        }
        p.el.setAttribute('opacity', p.opacity.toFixed(2));
        continue;
      }
      p.dist += p.speed * dt;
      var total = chainLength(p.pts);
      var pt = pointAt(p.pts, p.dist);
      for (var c = 0; c < CENTERS.length; c++) {
        var k = CENTERS[c];
        if (Math.abs(pt[0] - k.x) < 3.5 && Math.abs(pt[1] - k.y) < 3.5) flashNode(k.node);
      }
      if (p.dist >= total) {
        flashNode('users');
        p.fading = true;
        continue;
      }
      p.el.setAttribute('cx', pt[0].toFixed(1));
      p.el.setAttribute('cy', pt[1].toFixed(1));
    }
    requestAnimationFrame(tick);
  }

  function start() {
    if (running || REDUCED) return;
    running = true;
    lastTime = null;
    requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
  }

  if (!REDUCED) {
    /* seed traffic */
    for (var s = 0; s < 3; s++) setTimeout(makePacket, s * 420);
    /* steady spawn */
    setInterval(function () {
      if (running && packets.length < 7) makePacket();
    }, 900);

    /* pause offscreen / hidden */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0 }).observe(svg);
    } else start();
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    /* click → burst */
    svg.addEventListener('click', function () {
      for (var b = 0; b < 4; b++) setTimeout(makePacket, b * 140);
    });
  }

  /* readout: hover / focus / tap */
  function setReadout(node) {
    var id = node ? node.getAttribute('data-node') : null;
    readout.textContent = (id && FACTS[id]) ? FACTS[id] : DEFAULT_READOUT;
  }
  Array.prototype.forEach.call(svg.querySelectorAll('.pl-node'), function (g) {
    g.addEventListener('mouseenter', function () { setReadout(g); });
    g.addEventListener('focus', function () { setReadout(g); });
    g.addEventListener('click', function (e) { e.stopPropagation(); setReadout(g); });
  });
  svg.addEventListener('mouseleave', function () { setReadout(null); });
  svg.addEventListener('blur', function () { setReadout(null); }, true);
})();
