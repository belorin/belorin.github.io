'use strict';
// Desktop calendar (/#calendar), drawn from wiki/calendar.json (MAINTENANCE.md).
// 연대: time runs down a vertical strip; one row is 100 years, 10 years or 1 year
// depending on the scale, and long empty stretches fold into a single gap row.
// 절기: one year of days, a week per row, months separated by stepped lines.
// The list on the right follows the part of the strip in view; hovering an item
// lights its cells, hovering a cell lights its items. Two looks: 덩어리 (cells
// touch and each filled block gets rounded outer corners, the default) and 칸.
(function () {
  const SCALES = {
    century: {label: '세기', cell: 120, per: 10},
    decade: {label: '10년', cell: 12, per: 10},
    year: {label: '1년', cell: 1, per: 12}
  };
  const LINE = /^(-?\d{1,4})(?:-(\d{2}))?$/;
  const CYCLE = /^(\d{2})(?:-(\d{2}))?$/;
  let data = null, loading = null, mode = 'line', scale = 'decade', look = 'blocks', pendingSection = null;

  const yearLabel = y => y < 0 ? '기원전 ' + (-y) : String(y);
  const level = n => n ? ' l' + Math.min(n, 4) : '';
  // Linear time is counted in months: year * 12 + month index.
  function monthIndex(text, end) {
    const m = LINE.exec(text);
    return +m[1] * 12 + (m[2] ? +m[2] - 1 : end ? 11 : 0);
  }
  function lineSpan(entry) {
    return [monthIndex(entry.from, false), monthIndex(entry.to ?? entry.from, true)];
  }
  function lineWhen(entry) {
    const show = text => { const m = LINE.exec(text); return yearLabel(+m[1]) + (m[2] ? '.' + m[2] : ''); };
    return entry.to && entry.to !== entry.from ? show(entry.from) + '–' + show(entry.to) : show(entry.from);
  }
  // Recurring dates are laid on this year's days; a span past December wraps.
  function cycleRanges(entry, year, days) {
    const day = (month, date) => Math.round((Date.UTC(year, month - 1, date) - Date.UTC(year, 0, 1)) / 864e5);
    const from = CYCLE.exec(entry.every.from), to = CYCLE.exec(entry.every.to ?? entry.every.from);
    const start = day(+from[1], from[2] ? +from[2] : 1);
    const end = to[2] ? day(+to[1], +to[2]) : day(+to[1] + 1, 1) - 1;
    return start <= end ? [[start, end]] : [[start, days - 1], [0, end]];
  }
  function cycleWhen(entry) {
    const show = text => { const m = CYCLE.exec(text); return +m[1] + '월' + (m[2] ? ' ' + +m[2] + '일' : ''); };
    return entry.every.to && entry.every.to !== entry.every.from
      ? show(entry.every.from) + ' – ' + show(entry.every.to) : show(entry.every.from);
  }

  function lineStrip(items, esc) {
    const {cell, per} = SCALES[scale], span = cell * per;
    const rowOf = t => Math.floor(t / span);
    const used = new Set();
    for (const it of items) for (let r = rowOf(it.s); r <= rowOf(it.t); r++) used.add(r);
    const rows = [...used].sort((a, b) => a - b);
    let html = '', empty = 0;
    const flush = r => {
      if (empty >= 3) html += '<div class="cal-gap">⋯ ' + esc(yearLabel(Math.floor((r - empty) * span / 12))) +
        ' – ' + esc(yearLabel(Math.floor(r * span / 12) - 1)) + '</div>';
      else for (let k = r - empty; k < r; k++) html += lineRow(k, []);
      empty = 0;
    };
    const lineRow = (r, hits) => {
      const a = r * span, year = Math.floor(a / 12);
      let cells = '';
      for (let c = 0; c < per; c++) {
        const lo = a + c * cell, hi = lo + cell - 1;
        const ids = hits.filter(it => it.s <= hi && it.t >= lo).map(it => it.e.id);
        cells += '<i class="cal-cell' + level(ids.length) + '"' + (ids.length ? ' data-ids="' + ids.join(' ') + '"' : '') + '></i>';
      }
      return '<div class="cal-row' + (scale === 'decade' && year % 100 === 0 ? ' cal-century' : '') +
        '" data-a="' + a + '" data-b="' + (a + span - 1) + '"><span class="cal-label">' +
        esc(scale === 'year' ? yearLabel(year) : yearLabel(year) + (scale === 'century' ? '년대' : '')) +
        '</span><span class="cal-cells" style="--per:' + per + '">' + cells + '</span></div>';
    };
    for (let i = 0; i < rows.length; i++) {
      if (i && rows[i] - rows[i - 1] > 1) { empty = rows[i] - rows[i - 1] - 1; flush(rows[i]); }
      const a = rows[i] * span, b = a + span - 1;
      html += lineRow(rows[i], items.filter(it => it.s <= b && it.t >= a));
    }
    return html;
  }

  function cycleStrip(items, esc) {
    const now = new Date(), year = now.getFullYear();
    const days = Math.round((Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 864e5);
    const offset = new Date(year, 0, 1).getDay();
    const monthOf = d => new Date(year, 0, 1 + d).getMonth();
    const today = Math.round((Date.UTC(year, now.getMonth(), now.getDate()) - Date.UTC(year, 0, 1)) / 864e5);
    let html = '';
    for (let r = 0; r * 7 - offset < days; r++) {
      let cells = '', label = '', first = null, last = null;
      for (let c = 0; c < 7; c++) {
        const d = r * 7 + c - offset;
        if (d < 0 || d >= days) { cells += '<i class="cal-cell cal-void"></i>'; continue; }
        if (first === null) first = d;
        last = d;
        const month = monthOf(d);
        if (new Date(year, 0, 1 + d).getDate() === 1) label = (month + 1) + '월';
        const ids = items.filter(it => it.ranges.some(([s, t]) => s <= d && d <= t)).map(it => it.e.id);
        const edges = (d >= 7 && monthOf(d - 7) !== month ? ' mt' : '') + (c > 0 && d > 0 && monthOf(d - 1) !== month ? ' ml' : '');
        cells += '<i class="cal-cell' + level(ids.length) + edges + (d === today ? ' today' : '') + '"' +
          (ids.length ? ' data-ids="' + ids.join(' ') + '"' : '') + '></i>';
      }
      html += '<div class="cal-row" data-a="' + first + '" data-b="' + last + '"><span class="cal-label">' + esc(label) +
        '</span><span class="cal-cells" style="--per:7">' + cells + '</span></div>';
    }
    return html;
  }

  function page(ctx) {
    const {esc, byId, permalink} = ctx;
    const entries = (data.entries || []).filter(e => byId(e.doc) && (mode === 'line' ? e.from : e.every));
    const year = new Date().getFullYear();
    const days = Math.round((Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 864e5);
    const items = entries.map(e => mode === 'line'
      ? (([s, t]) => ({e, s, t, key: s}))(lineSpan(e))
      : (ranges => ({e, ranges, key: ranges[0][0]}))(cycleRanges(e, year, days)));
    items.sort((a, b) => a.key - b.key || a.e.id.localeCompare(b.e.id));
    const tab = (value, label, current, attr) => '<button type="button" data-' + attr + '="' + value + '"' +
      (value === current ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"') + '>' + label + '</button>';
    const list = items.map(it => '<li data-id="' + esc(it.e.id) + '"' +
      (mode === 'line' ? ' data-s="' + it.s + '" data-t="' + it.t + '"' : ' data-r="' + it.ranges.map(r => r.join('-')).join(',') + '"') +
      '><a href="' + permalink(it.e.doc) + '"' + (it.e.section ? ' data-section="' + esc(it.e.section) + '"' : '') + '>' +
      '<span class="cal-when">' + esc(mode === 'line' ? lineWhen(it.e) : cycleWhen(it.e)) + '</span>' +
      '<span class="cal-item">' + esc(it.e.label) + '</span>' +
      '<span class="cal-doc">' + esc(byId(it.e.doc).title) + '</span></a></li>').join('');
    return '<div class="cal' + (look === 'blocks' ? ' cal-blocks' : '') + '" data-mode="' + mode + '"><div class="page-heading"><h1>달력</h1></div>' +
      '<div class="cal-bar"><div class="cal-tabs">' + tab('line', '연대', mode, 'cal-mode') + tab('cycle', '절기', mode, 'cal-mode') + '</div>' +
      (mode === 'line' ? '<div class="cal-tabs">' + Object.entries(SCALES).map(([k, v]) => tab(k, v.label, scale, 'cal-scale')).join('') + '</div>' : '') +
      '<div class="cal-tabs cal-look">' + tab('blocks', '덩어리', look, 'cal-look') + tab('cells', '칸', look, 'cal-look') + '</div>' +
      '</div><div class="cal-body"><div class="cal-strip">' + (mode === 'line' ? lineStrip(items, esc) : cycleStrip(items, esc)) + '</div>' +
      '<ol class="cal-list">' + list + '</ol><p class="cal-none" hidden>이 구간에 걸린 글이 없습니다.</p></div>' +
      '<div class="cal-tip" hidden></div></div>';
  }

  function wire(view, ctx) {
    const root = view.querySelector('.cal'), strip = root.querySelector('.cal-strip');
    const list = root.querySelector('.cal-list'), tip = root.querySelector('.cal-tip'), none = root.querySelector('.cal-none');
    const labels = new Map((data.entries || []).map(e => [e.id, e.label]));
    const light = (ids, on) => {
      for (const id of ids) {
        for (const cell of strip.querySelectorAll('[data-ids~="' + id + '"]')) cell.classList.toggle('on', on);
        list.querySelector('[data-id="' + id + '"]')?.classList.toggle('on', on);
      }
    };
    // Show only the items that fall in the rows currently in view.
    const follow = () => {
      const box = strip.getBoundingClientRect();
      let a = Infinity, b = -Infinity;
      for (const row of strip.querySelectorAll('.cal-row')) {
        const r = row.getBoundingClientRect();
        if (r.bottom >= box.top && r.top <= box.bottom) { a = Math.min(a, +row.dataset.a); b = Math.max(b, +row.dataset.b); }
      }
      let shown = 0;
      for (const li of list.children) {
        const hit = li.dataset.r
          ? li.dataset.r.split(',').some(p => { const [s, t] = p.split('-').map(Number); return s <= b && t >= a; })
          : +li.dataset.s <= b && +li.dataset.t >= a;
        li.hidden = !hit;
        shown += hit;
      }
      none.hidden = shown > 0;
    };
    let frame = 0;
    strip.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(follow); });
    follow();
    strip.addEventListener('mouseover', event => {
      const cell = event.target.closest('[data-ids]');
      if (!cell) return;
      const ids = cell.dataset.ids.split(' ');
      light(ids, true);
      tip.innerHTML = ids.map(id => '<div>' + ctx.esc(labels.get(id)) + '</div>').join('');
      tip.hidden = false;
    });
    strip.addEventListener('mousemove', event => {
      tip.style.left = event.clientX + 16 + 'px';
      tip.style.top = event.clientY + 12 + 'px';
    });
    strip.addEventListener('mouseout', event => {
      const cell = event.target.closest('[data-ids]');
      if (cell) { light(cell.dataset.ids.split(' '), false); tip.hidden = true; }
    });
    list.addEventListener('mouseover', event => { const li = event.target.closest('li'); if (li) light([li.dataset.id], true); });
    list.addEventListener('mouseout', event => { const li = event.target.closest('li'); if (li) light([li.dataset.id], false); });
    list.addEventListener('click', event => { pendingSection = event.target.closest('a')?.dataset.section || null; });
    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.calMode) mode = button.dataset.calMode;
      else if (button.dataset.calScale) scale = button.dataset.calScale;
      else if (button.dataset.calLook) look = button.dataset.calLook;
      else return;
      show(view, ctx);
    });
  }

  // Mark the outer corners of each filled block; the 덩어리 look rounds them.
  // Gap rows break a block, as do empty and out-of-year cells.
  function corners(strip) {
    const grid = [...strip.children].map(row => row.classList.contains('cal-row') ? [...row.querySelectorAll('.cal-cell')] : []);
    const filled = (y, x) => Boolean(grid[y] && grid[y][x] && grid[y][x].dataset.ids);
    grid.forEach((cells, y) => cells.forEach((cell, x) => {
      if (!filled(y, x)) return;
      const up = filled(y - 1, x), down = filled(y + 1, x), left = filled(y, x - 1), right = filled(y, x + 1);
      if (!up && !left) cell.classList.add('ctl');
      if (!up && !right) cell.classList.add('ctr');
      if (!down && !right) cell.classList.add('cbr');
      if (!down && !left) cell.classList.add('cbl');
    }));
  }

  function show(view, ctx) {
    view.innerHTML = page(ctx);
    corners(view.querySelector('.cal-strip'));
    wire(view, ctx);
  }

  // Opening an item with a section scrolls the article to that heading.
  window.addEventListener('hashchange', () => {
    if (!pendingSection) return;
    const plain = text => text.replace(/[*`]/g, '').trim();
    const want = plain(pendingSection);
    pendingSection = null;
    const heading = [...document.querySelectorAll('#view h2, #view h3, #view h4')].find(h => plain(h.textContent) === want);
    heading?.scrollIntoView({block: 'start'});
  });

  window.Calendar = {
    lineSpan, cycleRanges, page,
    render(view, ctx) {
      if (!window.matchMedia('(min-width: 900px)').matches) {
        view.innerHTML = '<div class="empty">달력은 데스크톱 화면에서 볼 수 있습니다. <a href="#all">전체 문서 보기 →</a></div>';
        return;
      }
      if (data) return show(view, ctx);
      view.innerHTML = '<p class="muted">달력을 불러오는 중입니다.</p>';
      loading = loading || fetch('wiki/calendar.json', {cache: 'no-cache'}).then(r => { if (!r.ok) throw Error(); return r.json(); });
      loading.then(json => { data = json; if (location.hash === '#calendar') show(view, ctx); })
        .catch(() => { loading = null; view.innerHTML = '<div class="empty">달력 자료를 불러오지 못했습니다.</div>'; });
    },
    // For tests: render with data already in hand.
    setData(json) { data = json; },
    setView(nextMode, nextScale, nextLook) { mode = nextMode; scale = nextScale; if (nextLook) look = nextLook; }
  };
})();
