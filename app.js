/* pramaan schools v0.1
   two views in one page: the pilot offer and a sample cohort dashboard.
   the dashboard runs on mock data generated from a fixed seed. class aggregates only:
   there is no child-level data anywhere in this file, and nothing leaves the browser.
   all markup below is built from the constants in this file; any text is escaped. */
(function () {
  'use strict';

  /* ---------- theme ---------- */
  document.getElementById('theme').addEventListener('click', function () {
    var root = document.documentElement;
    var dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- mock data ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var SEED = 20260706;
  var rand = mulberry32(SEED);
  function noise(size) { return (rand() * 2 - 1) * size; }
  function round2(x) { return Math.round(x * 100) / 100; }

  var WEEKS = 8;
  var MIN_RESPONSES = 10;
  var START = new Date(2026, 6, 6); // monday 06.07.26
  var SCALES = [
    { key: 'curiosity', name: 'curiosity', inst: 'cei-ii', min: 1, max: 5 },
    { key: 'motivation', name: 'motivation', inst: 'imi short form', min: 1, max: 7 },
    { key: 'efficacy', name: 'self-efficacy', inst: 'pals', min: 1, max: 5 }
  ];
  var CLASSES = [
    { id: '6A', enrolled: 34, base: { curiosity: 3.02, motivation: 4.31, efficacy: 3.14 }, slope: { curiosity: 0.07, motivation: 0.09, efficacy: 0.05 } },
    { id: '6B', enrolled: 33, base: { curiosity: 2.94, motivation: 4.12, efficacy: 3.02 }, slope: { curiosity: 0.05, motivation: 0.07, efficacy: 0.06 } },
    { id: '7A', enrolled: 35, base: { curiosity: 3.18, motivation: 4.45, efficacy: 3.30 }, slope: { curiosity: 0.06, motivation: 0.05, efficacy: 0.04 } },
    { id: '8A', enrolled: 31, base: { curiosity: 3.10, motivation: 4.02, efficacy: 3.21 }, slope: { curiosity: 0.02, motivation: 0.01, efficacy: 0.03 } }
  ];
  var NOTES = [
    { week: 3, text: 'mid-term unit tests; sessions ran as planned.' },
    { week: 5, text: 'heavy rain closed the school on two days, so each section missed one session. 8A was on a field visit and only nine students answered, so its week-five figure is held back.' },
    { week: 8, text: 'full questionnaires in all four sections.' }
  ];

  function weekDate(w) {
    var d = new Date(START.getTime());
    d.setDate(d.getDate() + (w - 1) * 7);
    return d;
  }
  function fmt(d) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2);
  }

  // rows[sectionId] = [{week, date, enrolled, responses, held, curiosity, motivation, efficacy}]
  var rows = {};
  CLASSES.forEach(function (c) {
    rows[c.id] = [];
    for (var w = 1; w <= WEEKS; w++) {
      var responses = c.enrolled - Math.floor(rand() * 5);
      if (c.id === '8A' && w === 5) responses = 9;
      var r = { week: w, date: fmt(weekDate(w)), enrolled: c.enrolled, responses: responses, held: responses < MIN_RESPONSES };
      SCALES.forEach(function (s) {
        var v = c.base[s.key] + c.slope[s.key] * (w - 1) + noise(s.max === 7 ? 0.1 : 0.07);
        if (w === 5) v -= s.max === 7 ? 0.14 : 0.1; // the rain week
        v = Math.max(s.min, Math.min(s.max, v));
        r[s.key] = r.held ? null : round2(v);
      });
      rows[c.id].push(r);
    }
  });

  // whole-school rows: response-weighted mean over the sections shown that week
  var school = [];
  for (var w = 1; w <= WEEKS; w++) {
    var sr = { week: w, date: fmt(weekDate(w)), enrolled: 0, responses: 0, held: false };
    var shown = CLASSES.map(function (c) { return rows[c.id][w - 1]; }).filter(function (r) { return !r.held; });
    CLASSES.forEach(function (c) { sr.enrolled += c.enrolled; sr.responses += rows[c.id][w - 1].responses; });
    SCALES.forEach(function (s) {
      var n = 0, sum = 0;
      shown.forEach(function (r) { sum += r[s.key] * r.responses; n += r.responses; });
      sr[s.key] = round2(sum / n);
    });
    school.push(sr);
  }
  var TOTAL = CLASSES.reduce(function (a, c) { return a + c.enrolled; }, 0);

  /* ---------- helpers ---------- */
  function el(id) { return document.getElementById(id); }
  function put(id, html) {
    el(id).replaceChildren(document.createRange().createContextualFragment(html));
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function sign(x) { return (x > 0 ? '+' : x < 0 ? '−' : '±') + Math.abs(x).toFixed(2); }
  function firstLast(series, key) {
    var vals = series.map(function (r) { return r[key]; });
    var first = null, last = null;
    for (var i = 0; i < vals.length; i++) if (vals[i] != null) { first = vals[i]; break; }
    for (var j = vals.length - 1; j >= 0; j--) if (vals[j] != null) { last = vals[j]; break; }
    return { first: first, last: last, change: round2(last - first) };
  }
  function responseRate(series) {
    var r = 0, e = 0;
    series.forEach(function (x) { r += x.responses; e += x.enrolled; });
    return Math.round(r / e * 100);
  }

  /* ---------- chart (inline svg, tokens only) ---------- */
  var W = 360, H = 210, PAD = { l: 30, r: 34, t: 12, b: 28 };
  function chart(scale, lines) {
    var iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
    function x(week) { return PAD.l + (week - 1) / (WEEKS - 1) * iw; }
    function y(v) { return PAD.t + (1 - (v - scale.min) / (scale.max - scale.min)) * ih; }
    var out = [];
    for (var g = scale.min; g <= scale.max; g++) {
      out.push('<line class="grid" x1="' + PAD.l + '" x2="' + (W - PAD.r) + '" y1="' + y(g) + '" y2="' + y(g) + '"/>');
      out.push('<text class="tick" x="' + (PAD.l - 8) + '" y="' + (y(g) + 4) + '" text-anchor="end">' + g + '</text>');
    }
    for (var wk = 1; wk <= WEEKS; wk++) {
      out.push('<text class="tick" x="' + x(wk) + '" y="' + (H - 8) + '" text-anchor="middle">w' + wk + '</text>');
    }
    var ends = [];
    out.push('<line class="mark" x1="' + x(5) + '" x2="' + x(5) + '" y1="' + PAD.t + '" y2="' + (H - PAD.b) + '"/>');
    lines.forEach(function (ln) {
      var d = '', pen = false, lastPt = null;
      ln.values.forEach(function (v, i) {
        if (v == null) { pen = false; return; }
        d += (pen ? 'L' : 'M') + x(i + 1).toFixed(1) + ' ' + y(v).toFixed(1) + ' ';
        pen = true; lastPt = { x: x(i + 1), y: y(v) };
      });
      out.push('<path class="ln ' + ln.cls + '" d="' + d.trim() + '"/>');
      if (ln.points) {
        ln.values.forEach(function (v, i) {
          if (v == null) return;
          out.push('<circle class="pt ' + ln.cls + '" cx="' + x(i + 1).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="2.6"><title>' +
            esc(ln.label + ', week ' + (i + 1) + ': ' + v.toFixed(2)) + '</title></circle>');
        });
      }
      if (ln.endLabel && lastPt) ends.push({ x: lastPt.x + 5, y: lastPt.y + 4, cls: ln.cls, text: ln.endLabel });
    });
    // keep end labels at least 11 units apart so they never overlap
    ends.sort(function (a, b) { return a.y - b.y; });
    for (var k = 1; k < ends.length; k++) {
      var gap = ends[k].y - ends[k - 1].y;
      if (gap < 11) { ends[k - 1].y -= (11 - gap) / 2; ends[k].y += (11 - gap) / 2; }
    }
    ends.forEach(function (e) {
      out.push('<text class="end ' + e.cls + '" x="' + e.x.toFixed(1) + '" y="' + e.y.toFixed(1) + '">' + esc(e.text) + '</text>');
    });
    return out.join('');
  }

  /* ---------- render ---------- */
  var current = 'all';

  function renderPills() {
    var opts = [{ id: 'all', label: 'whole school' }].concat(CLASSES.map(function (c) { return { id: c.id, label: c.id }; }));
    put('class-pills', opts.map(function (o) {
      return '<a class="pill" href="#dashboard' + (o.id === 'all' ? '' : '/' + o.id) + '" aria-pressed="' + (o.id === current) + '">' + esc(o.label) + '</a>';
    }).join(''));
  }

  function renderTiles(series) {
    put('tiles', SCALES.map(function (s) {
      var fl = firstLast(series, s.key);
      return '<div class="tile">' +
        '<p class="tile-name">' + s.name + '<span class="count">' + esc(s.inst) + '</span></p>' +
        '<p class="tile-move"><span class="mono">' + fl.first.toFixed(2) + '</span> <span class="faint">→</span> <span class="mono big">' + fl.last.toFixed(2) + '</span></p>' +
        '<p class="caption"><span class="mono ' + (fl.change > 0 ? 'ok' : '') + '">' + sign(fl.change) + '</span> from week 1 to week 8, on a ' + s.min + ' to ' + s.max + ' scale</p>' +
        '</div>';
    }).join(''));
  }

  function renderCharts() {
    put('charts', SCALES.map(function (s) {
      var lines, aria, fl;
      if (current === 'all') {
        lines = CLASSES.map(function (c) {
          return { cls: 'faint-ln', label: c.id, values: rows[c.id].map(function (r) { return r[s.key]; }) };
        });
        lines.push({ cls: 'main', label: 'whole school', points: true, endLabel: 'all', values: school.map(function (r) { return r[s.key]; }) });
        fl = firstLast(school, s.key);
        aria = s.name + ', whole school average, week 1 ' + fl.first.toFixed(2) + ', week 8 ' + fl.last.toFixed(2) + ', on a ' + s.min + ' to ' + s.max + ' scale.';
      } else {
        lines = [
          { cls: 'compare', label: 'whole school', endLabel: 'all', values: school.map(function (r) { return r[s.key]; }) },
          { cls: 'main', label: current, points: true, endLabel: current, values: rows[current].map(function (r) { return r[s.key]; }) }
        ];
        fl = firstLast(rows[current], s.key);
        aria = s.name + ', section ' + current + ' average, week 1 ' + fl.first.toFixed(2) + ', week 8 ' + fl.last.toFixed(2) + ', on a ' + s.min + ' to ' + s.max + ' scale.';
      }
      return '<figure class="chart">' +
        '<figcaption><span class="chart-name">' + s.name + '</span><span class="count">' + s.min + ' to ' + s.max + '</span></figcaption>' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(aria) + '">' + chart(s, lines) + '</svg>' +
        '</figure>';
    }).join(''));
    put('legend', current === 'all'
      ? '<span><span class="key key-main"></span>whole school average</span> <span><span class="key key-faint"></span>each section</span> <span><span class="key key-mark"></span>week 5, rain closures</span>'
      : '<span><span class="key key-main"></span>' + esc(current) + '</span> <span><span class="key key-compare"></span>whole school average</span> <span><span class="key key-mark"></span>week 5, rain closures</span>');
  }

  function renderTable() {
    var h;
    if (current === 'all') {
      el('table-label').textContent = 'by section, week 1 → week 8';
      h = '<table><thead><tr><th>section</th><th class="right">enrolled</th>' +
        SCALES.map(function (s) { return '<th class="right">' + s.name + '</th>'; }).join('') +
        '<th class="right">answered</th><th><span class="sr-only">open</span></th></tr></thead><tbody>';
      CLASSES.forEach(function (c) {
        h += '<tr><td class="data">' + c.id + '</td><td class="data right">' + c.enrolled + '</td>';
        SCALES.forEach(function (s) {
          var fl = firstLast(rows[c.id], s.key);
          h += '<td class="data right nowrap">' + fl.first.toFixed(2) + ' → ' + fl.last.toFixed(2) + ' <span class="' + (fl.change > 0 ? 'ok' : 'muted') + '">' + sign(fl.change) + '</span></td>';
        });
        h += '<td class="data right">' + responseRate(rows[c.id]) + '%</td>' +
          '<td class="right"><a class="pill" href="#dashboard/' + c.id + '">open ' + c.id + '</a></td></tr>';
      });
      h += '</tbody></table>';
    } else {
      el('table-label').textContent = current + ', week by week';
      h = '<table><thead><tr><th>week</th><th>from</th>' +
        SCALES.map(function (s) { return '<th class="right">' + s.name + '</th>'; }).join('') +
        '<th class="right">answered</th></tr></thead><tbody>';
      rows[current].forEach(function (r) {
        h += '<tr><td class="data">w' + r.week + '</td><td><time>' + r.date + '</time></td>';
        SCALES.forEach(function (s) {
          h += '<td class="data right">' + (r.held ? '<span class="muted">held back</span>' : r[s.key].toFixed(2)) + '</td>';
        });
        h += '<td class="data right nowrap">' + r.responses + ' / ' + r.enrolled + '</td></tr>';
      });
      h += '</tbody></table>';
    }
    put('table', h);

    put('notes', NOTES.map(function (n) {
      return '<li><span class="mono">w' + n.week + ' · ' + fmt(weekDate(n.week)) + '</span> ' + esc(n.text) + '</li>';
    }).join('') +
      '<li><span class="mono">rule</span> a class figure is held back when fewer than ten students answered that week. the whole-school line uses the sections shown.</li>');
  }

  function renderDashboard() {
    var last = weekDate(WEEKS); last.setDate(last.getDate() + 5);
    el('dash-meta').textContent = 'pilot ' + fmt(START) + ' → ' + fmt(last) + ' · ' + CLASSES.length + ' sections · grades 6 to 8 · ' + TOTAL + ' enrolled · seed ' + SEED;
    el('scope-label').textContent = current === 'all' ? 'whole school, week 1 to week 8' : 'section ' + current + ', week 1 to week 8';
    el('export').textContent = 'export csv' + (current === 'all' ? '' : ' for ' + current);
    renderPills();
    renderTiles(current === 'all' ? school : rows[current]);
    renderCharts();
    renderTable();
  }

  /* ---------- csv export (blob, works from file://) ---------- */
  function csvCell(v) {
    var s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function buildCsv() {
    var head = ['data', 'school', 'section', 'week', 'week_starting', 'enrolled', 'answered',
      'curiosity_cei2_1to5', 'motivation_imi_1to7', 'self_efficacy_pals_1to5', 'note'];
    var out = [head.join(',')];
    function push(section, r) {
      out.push([
        'example', 'hill view school', section, r.week, r.date, r.enrolled, r.responses,
        r.curiosity, r.motivation, r.efficacy,
        r.held ? 'held back: fewer than 10 answered' : ''
      ].map(csvCell).join(','));
    }
    var ids = current === 'all' ? CLASSES.map(function (c) { return c.id; }) : [current];
    ids.forEach(function (id) { rows[id].forEach(function (r) { push(id, r); }); });
    if (current === 'all') school.forEach(function (r) { push('whole school', r); });
    return out.join('\n') + '\n';
  }
  el('export').addEventListener('click', function () {
    var blob = new Blob([buildCsv()], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pramaan-pilot-' + (current === 'all' ? 'whole-school' : current) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  /* ---------- router: #offer (and its anchors), #dashboard, #dashboard/6A ---------- */
  function route() {
    var hash = (location.hash || '#offer').slice(1);
    var isDash = hash === 'dashboard' || hash.indexOf('dashboard/') === 0;
    var wasDash = !el('view-dashboard').hidden;
    el('view-offer').hidden = isDash;
    el('view-dashboard').hidden = !isDash;
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (a) {
      var on = (a.getAttribute('data-nav') === 'dashboard') === isDash;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-end]'), function (a) {
      a.hidden = (a.getAttribute('data-end') === 'dashboard') === isDash;
    });
    document.title = isDash ? 'dashboard · pramaan for schools' : 'pramaan for schools';
    if (isDash) {
      var id = hash.split('/')[1];
      current = CLASSES.some(function (c) { return c.id === id; }) ? id : 'all';
      renderDashboard();
      if (!wasDash) window.scrollTo(0, 0); // switching sections keeps your place
    } else {
      var target = hash !== 'offer' && document.getElementById(hash);
      if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
    }
  }
  window.addEventListener('hashchange', route);
  route();

  // exposed for the test script
  window.PRAMAAN_MOCK = { rows: rows, school: school, csv: buildCsv };
})();
