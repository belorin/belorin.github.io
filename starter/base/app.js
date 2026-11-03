'use strict';
// Viewer for the wiki. Everything particular to this wiki (name, repository,
// address, home and about texts, topic order, calendar, comments) arrives in
// notes.json's "site" object, generated from site.config.json.

const view = document.querySelector('#view');
const search = document.querySelector('#search');
const filters = document.querySelector('#filters');
const randomButton = document.querySelector('#sidebar-random');
const exploreToggle = document.querySelector('#explore-toggle');
const ALL = '전체';
let site = {url: '/', repo: '', branch: 'main', categories: [], home: {}, about: {}};
let notes = [];
let category = ALL;
let randomPick = null;

const repoFile = (kind, id) => 'https://github.com/' + site.repo + '/' + kind + '/' + site.branch +
  '/wiki/' + encodeURIComponent(id) + '.md';
// Comments are GitHub Discussions threads shown through giscus, one per document
// id, so /#id and /notes/id/ share a thread. No categoryId keeps them off.
function giscusAttributes(term) {
  const c = site.comments;
  if (!c || !c.categoryId) return null;
  return {src: 'https://giscus.app/client.js', 'data-repo': site.repo, 'data-repo-id': c.repoId,
    'data-category': c.category, 'data-category-id': c.categoryId, 'data-mapping': 'specific',
    'data-term': term, 'data-strict': '1', 'data-reactions-enabled': '0', 'data-emit-metadata': '0',
    'data-input-position': 'bottom', 'data-theme': site.url + 'giscus-theme.css?v=1', 'data-lang': 'ko',
    'data-loading': 'lazy', crossorigin: 'anonymous'};
}
function loadComments() {
  const box = view.querySelector?.('.giscus');
  const attributes = box && giscusAttributes(box.getAttribute('data-term'));
  if (!attributes) return;
  const script = document.createElement('script');
  for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value);
  box.append(script);
}

function setExploreOpen(open) { exploreToggle.setAttribute('aria-expanded', String(open)); }
exploreToggle.addEventListener('click', () => setExploreOpen(exploreToggle.getAttribute('aria-expanded') !== 'true'));

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));
const validId = id => /^[a-z0-9-]+$/.test(id);
const byId = id => notes.find(note => note.id === id);
const permalink = id => '#' + encodeURIComponent(id);
const sorted = items => items.slice().sort((a,b) =>
  b.updated.localeCompare(a.updated) || notes.indexOf(b) - notes.indexOf(a));
const normalized = s => String(s ?? '').normalize('NFKC').toLocaleLowerCase('ko');
const textMatch = note => normalized([
  note.title, note.summary, note.body, note.category, ...(note.tags || [])
].join(' ')).includes(normalized(search.value.trim()));

function plainInline(text) {
  return esc(text).replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>');
}
function inline(text) {
  const matcher = /\[([^\]]+)\]\(([^)]+)\)/g;
  let result = '', cursor = 0, match;
  while ((match = matcher.exec(text)) !== null) {
    result += plainInline(text.slice(cursor, match.index));
    const href = match[2].trim();
    if (/^https?:\/\/[^\s"'<>]+$/i.test(href) || /^#[a-z0-9-]+$/i.test(href)) {
      const external = /^https?:\/\//i.test(href);
      result += '<a href="' + esc(href) + '"' +
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + plainInline(match[1]) + '</a>';
    } else result += plainInline(match[0]);
    cursor = matcher.lastIndex;
  }
  return result + plainInline(text.slice(cursor));
}
function tableRow(line) {
  const value = line.trim();
  const cells = [];
  let cell = '', code = 0, lastSeparator = -1;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === '\\' && (value[i + 1] === '|' || value[i + 1] === '\\')) {
      cell += value[i + 1] === '|' ? '|' : '\\\\';
      i++;
    } else if (char === '`') {
      let end = i + 1;
      while (value[end] === '`') end++;
      const length = end - i;
      if (!code) code = length;
      else if (code === length) code = 0;
      cell += value.slice(i, end);
      i = end - 1;
    } else if (char === '|' && !code) {
      cells.push(cell.trim()); cell = ''; lastSeparator = i;
    } else cell += char;
  }
  if (lastSeparator < 0) return null;
  cells.push(cell.trim());
  if (value.startsWith('|')) cells.shift();
  if (lastSeparator === value.length - 1) cells.pop();
  return cells.length ? cells : null;
}
// Supports paragraphs, ##–#### headings, lists, quotes, rules, emphasis,
// inline code, links and Markdown tables.
function renderMarkdown(markdown, docId) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const toc = [];
  let html = '', para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) { html += '<p>' + para.map(inline).join(' ') + '</p>'; para = []; } };
  const flushList = () => { if (list) { html += '</' + list + '>'; list = null; } };
  const flushQuote = () => { if (quote.length) { html += '<blockquote>' + quote.map(inline).join(' ') + '</blockquote>'; quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };
  for (let index = 0; index < lines.length; index++) {
    const value = lines[index].trim();
    const heading = /^(#{2,4})\s+(.+)$/.exec(value);
    const bullet = /^[-*+]\s+(.+)$/.exec(value);
    const numbered = /^\d+\.\s+(.+)$/.exec(value);
    const headers = tableRow(value);
    const divider = headers && tableRow(lines[index + 1] || '');
    if (!value) { flushAll(); continue; }
    if (headers && divider && headers.length === divider.length &&
        divider.every(cell => /^:?-{3,}:?$/.test(cell))) {
      flushAll();
      const alignments = divider.map(cell => cell.startsWith(':') && cell.endsWith(':')
        ? 'center' : cell.endsWith(':') ? 'right' : 'left');
      const row = (cells, tag) => '<tr>' + headers.map((_, column) =>
        '<' + tag + (tag === 'th' ? ' scope="col"' : '') +
        ' class="align-' + alignments[column] + '">' + inline(cells[column] || '') +
        '</' + tag + '>').join('') + '</tr>';
      html += '<div class="table-scroll" role="region" aria-label="표 (가로 스크롤 가능)" tabindex="0">' +
        '<table><thead>' + row(headers, 'th') + '</thead><tbody>';
      index++;
      while (index + 1 < lines.length) {
        const next = lines[index + 1].trim();
        if (/^(?:#{2,4}\s|[-*+]\s|\d+\.\s|>\s)/.test(next)) break;
        const cells = tableRow(next);
        if (!cells) break;
        html += row(cells, 'td');
        index++;
      }
      html += '</tbody></table></div>';
    } else if (heading) {
      flushAll();
      const level = heading[1].length;
      const id = docId + '-section-' + (toc.length + 1);
      toc.push({id, title:heading[2], level});
      html += '<h' + level + ' id="' + esc(id) + '">' + inline(heading[2]) + '</h' + level + '>';
    } else if (bullet || numbered) {
      flushPara(); flushQuote();
      const kind = bullet ? 'ul' : 'ol';
      if (list !== kind) { flushList(); list = kind; html += '<' + kind + '>'; }
      html += '<li>' + inline((bullet || numbered)[1]) + '</li>';
    } else if (value.startsWith('> ')) {
      flushPara(); flushList(); quote.push(value.slice(2));
    } else if (/^(-{3,}|\*{3,})$/.test(value)) {
      flushAll(); html += '<hr>';
    } else {
      flushList(); flushQuote(); para.push(value);
    }
  }
  flushAll();
  return {html, toc};
}

function pickRandom(except) {
  const choices = notes.filter(n => n.id !== except);
  return choices.length ? choices[Math.floor(Math.random() * choices.length)] : null;
}
function goRandom() {
  const current = validId(location.hash.slice(1)) ? location.hash.slice(1) : null;
  const chosen = pickRandom(current);
  if (chosen) location.hash = permalink(chosen.id);
}
// Topics follow the order in site.config.json "categories", then size.
function categoryOrder(a, b, counts) {
  const order = site.categories || [];
  const rank = name => order.includes(name) ? order.indexOf(name) : order.length;
  return rank(a) - rank(b) || counts.get(b) - counts.get(a) || a.localeCompare(b, 'ko');
}
function showFilters() {
  const counts = new Map();
  for (const n of notes) counts.set(n.category, (counts.get(n.category) || 0) + 1);
  const choices = [ALL, ...[...counts.keys()].sort((a,b) => categoryOrder(a, b, counts))];
  filters.replaceChildren();
  for (const name of choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = name === category ? 'active' : '';
    button.setAttribute('aria-pressed', String(name === category));
    button.innerHTML = '<span>' + esc(name) + '</span><span class="filter-count">' +
      (name === ALL ? notes.length : counts.get(name)) + '</span>';
    button.addEventListener('click', () => {
      category = name;
      showFilters();
      if (location.hash !== '#all') location.hash = '#all';
      else render();
    });
    filters.append(button);
  }
}
function home() {
  if (!randomPick || !byId(randomPick.id)) randomPick = pickRandom();
  const h = site.home || {};
  const feature = randomPick
    ? '<div class="random-card"><div><div class="eyebrow">' + esc(h.featureLabel || '오늘의 무작위 문서') + '</div>' +
      '<h2>' + esc(randomPick.title) + '</h2><p>' + esc(randomPick.summary) + '</p>' +
      '<a class="link-strong" href="' + permalink(randomPick.id) + '">이 글 읽기 →</a></div>' +
      '<button type="button" class="outline-button" data-shuffle>다른 글 ↻</button></div>'
    : '';
  view.innerHTML =
    '<div class="page-heading"><h1>' + esc(h.title || '문서 탐색') + '</h1><p>' +
    (h.lead ? esc(h.lead) + ' · ' : '') + notes.length + '개 문서</p></div>' + feature +
    '<section><div class="section-heading"><h2>최근 갱신</h2><a href="#all">모든 문서 →</a></div>' +
    '<ul class="compact-list">' + sorted(notes).slice(0, 8).map(n =>
      '<li><a href="' + permalink(n.id) + '"><span class="item-title">' + esc(n.title) +
      '</span><span class="item-date">' + esc(n.updated) + '</span></a></li>').join('') +
    '</ul></section>';
}
function listing() {
  const q = search.value.trim();
  const matches = sorted(notes.filter(n => (category === ALL || n.category === category) && (!q || textMatch(n))));
  view.innerHTML =
    '<div class="page-heading"><h1>' + (q ? '검색 결과' : category === ALL ? '전체 문서' : esc(category)) +
    '</h1><p>' + matches.length + '개 문서' + (q ? ' · 검색어: ' + esc(q) : '') + '</p></div>' +
    (matches.length
      ? matches.map(n => '<div class="list-item"><div class="meta">' + esc(n.category) +
        ' · ' + esc(n.updated) + '</div><h2><a href="' + permalink(n.id) + '">' +
        esc(n.title) + '</a></h2><p>' + esc(n.summary) + '</p></div>').join('')
      : '<div class="empty">해당하는 문서가 없습니다. 검색어나 주제를 변경해 보세요.</div>');
}
function article(note) {
  const rendered = renderMarkdown(note.body, note.id);
  const toc = rendered.toc.length > 1
    ? '<details class="toc"' + (window.matchMedia('(max-width: 800px)').matches ? '' : ' open') +
      '><summary>이 글의 목차 · ' + rendered.toc.length + '개 절</summary><ol>' +
      rendered.toc.map(item => '<li' + (item.level > 2 ? ' class="nested"' : '') +
        '><button type="button" data-jump="' + esc(item.id) + '">' + esc(item.title) + '</button></li>').join('') +
      '</ol></details>'
    : '';
  const connections = [...new Set([...(note.related || []),
    ...notes.filter(n => (n.related || []).includes(note.id)).map(n => n.id)])]
    .filter(id => id !== note.id && byId(id));
  const related = connections.length
    ? '<section class="reader-bottom"><h2>연결된 글</h2><div class="related-grid">' +
      connections.map(id => '<a href="' + permalink(id) + '">' + esc(byId(id).title) + ' →</a>').join('') +
      '</div></section>'
    : '';
  const discussion = giscusAttributes(note.id)
    ? '<section class="reader-bottom comments"><h2>댓글</h2><div class="giscus" data-term="' + esc(note.id) + '"></div></section>'
    : '';
  // GitHub's editor: the owner commits straight to the branch; others get a pull request.
  view.innerHTML = '<article class="reader"><a class="back" href="#all">← 문서 목록</a>' +
    '<header class="reader-header"><div class="meta">' + esc(note.category) +
    ' · ' + esc(note.updated) + ' · ' + esc(note.status) + '</div>' +
    '<h1>' + esc(note.title) + '</h1><p class="reader-lead">' + esc(note.summary) + '</p>' +
    '<div class="reader-tools"><a href="' + repoFile('blob', note.id) + '" target="_blank" rel="noopener noreferrer">Markdown 원고 ↗</a>' +
    '<button type="button" data-copy="' + esc(site.url + 'notes/' + encodeURIComponent(note.id) + '/') + '">LLM용 링크 복사</button>' +
    '<a href="' + repoFile('commits', note.id) + '" target="_blank" rel="noopener noreferrer">개정 이력 ↗</a>' +
    '<a href="' + repoFile('edit', note.id) + '" target="_blank" rel="noopener noreferrer">고치기 ✎</a>' +
    '<button type="button" data-random>무작위 글 ↝</button></div></header>' +
    toc + '<div class="prose">' + rendered.html + '</div>' + related +
    (note.source ? '<p class="reader-source">자료·검토 표기: ' + esc(note.source) + '</p>' : '') +
    discussion + '</article>';
  loadComments();
}
function about() {
  const a = site.about || {};
  const items = (a.links || []).filter(link => byId(link.id));
  view.innerHTML = '<div class="page-heading"><h1>' + esc(a.title || '이 위키에 관하여') + '</h1>' +
    '<p>' + esc(a.lead || site.name) + '</p></div>' +
    (items.length ? '<div class="section-heading"><h2>먼저 읽을 글</h2></div><ul class="compact-list">' +
      items.map(link => '<li><a href="' + permalink(link.id) + '"><span class="item-title">' +
        esc(link.label) + ' — ' + esc(byId(link.id).title) + '</span>→</a></li>').join('') + '</ul>' : '');
}
// The calendar lives in calendar.js, drawn only on desktop screens, and only if enabled.
function calendar() {
  if (site.calendar && window.Calendar) window.Calendar.render(view, {byId, esc, permalink});
  else view.innerHTML = '<div class="empty">달력을 쓸 수 없습니다. <a href="#all">전체 문서 보기 →</a></div>';
}
function render() {
  if (!notes.length) {
    view.setAttribute('aria-busy','false');
    view.innerHTML = '<div class="empty">아직 게시된 문서가 없습니다.</div>';
    return;
  }
  view.setAttribute('aria-busy','false');
  const hash = decodeURIComponent(location.hash.slice(1));
  setExploreOpen(!byId(hash));
  document.body?.classList.toggle('wide', hash === 'calendar');
  if (!hash) home();
  else if (hash === 'all') listing();
  else if (hash === 'about') about();
  else if (hash === 'calendar') calendar();
  else {
    const note = byId(hash);
    if (note) article(note);
    else view.innerHTML = '<div class="empty">문서를 찾을 수 없습니다. <a href="#all">전체 문서 보기 →</a></div>';
  }
}
view.addEventListener('click', event => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.hasAttribute('data-shuffle')) { randomPick = pickRandom(randomPick?.id); home(); }
  else if (target.hasAttribute('data-random')) goRandom();
  else if (target.hasAttribute('data-copy')) copyLink(target);
  else if (target.hasAttribute('data-jump')) {
    document.getElementById(target.getAttribute('data-jump'))?.scrollIntoView({behavior:'smooth',block:'start'});
  }
});
function copyLink(button) {
  const url = button.getAttribute('data-copy');
  const done = () => {
    button.textContent = '복사됨 ✓';
    setTimeout(() => { button.textContent = 'LLM용 링크 복사'; }, 2000);
  };
  const manual = () => window.prompt('이 링크를 복사해 LLM 채팅에 붙여 넣으세요', url);
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, manual);
  else manual();
}
randomButton.addEventListener('click', goRandom);
search.addEventListener('input', () => {
  if (location.hash !== '#all') location.hash = '#all';
  else render();
});
window.addEventListener('hashchange', () => {
  render();
  window.scrollTo({top:0,behavior:'instant'});
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey &&
      !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
    event.preventDefault(); setExploreOpen(true); search.focus();
  }
  if (event.key === 'Escape' && document.activeElement === search) {
    search.value = '';
    search.blur();
    if (location.hash === '#all') render();
  }
});
fetch('notes.json',{cache:'no-cache'})
  .then(response => { if (!response.ok) throw Error('Data unavailable'); return response.json(); })
  .then(data => {
    site = {...site, ...(data.site || {})};
    notes = Array.isArray(data.notes) ? data.notes.filter(n => validId(n.id)) : [];
    showFilters();
    render();
  })
  .catch(() => {
    view.setAttribute('aria-busy','false');
    view.innerHTML = '<div class="empty">문서를 불러오지 못했습니다. 새로고침하거나 GitHub 원고를 확인해 주세요.</div>';
  });
