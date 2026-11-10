'use strict';

const view = document.querySelector('#view');
const search = document.querySelector('#search');
const filters = document.querySelector('#filters');
const randomButton = document.querySelector('#sidebar-random');
const exploreToggle = document.querySelector('#explore-toggle');
const repo = 'https://github.com/belorin/belorin.github.io';
// LLM chats read the static article page (rendered HTML, no JavaScript needed).
const pageBase = 'https://belorin.github.io/notes/';
// Comments are GitHub Discussions threads shown through giscus, one thread per
// document id, so /#id and /notes/id/ share it. An empty categoryId keeps them off.
const comments = {repo: 'belorin/belorin.github.io', repoId: 'R_kgDOGw_oUg', category: 'Announcements', categoryId: 'DIC_kwDOGw_oUs4DJuTH'};
function giscusAttributes(term) {
  return {src: 'https://giscus.app/client.js', 'data-repo': comments.repo, 'data-repo-id': comments.repoId,
    'data-category': comments.category, 'data-category-id': comments.categoryId, 'data-mapping': 'specific',
    'data-term': term, 'data-strict': '1', 'data-reactions-enabled': '0', 'data-emit-metadata': '0',
    'data-input-position': 'bottom', 'data-theme': 'https://belorin.github.io/giscus-theme.css?v=2', 'data-lang': 'ko', 'data-loading': 'lazy', crossorigin: 'anonymous'};
}
function loadComments() {
  const box = view.querySelector?.('.giscus');
  if (!box) return;
  const script = document.createElement('script');
  for (const [name, value] of Object.entries(giscusAttributes(box.getAttribute('data-term')))) script.setAttribute(name, value);
  box.append(script);
}
let notes = [];
let category = '전체';
let randomPick = null;
// The site first loads data/index.json (every note without its body, built at
// deploy) and fetches a body only when its article is opened. Full-text search
// loads notes.json once. Without the deploy files (local use) notes.json serves both.
let allBodies = null;
const siteTitle = 'belorin · 열린 노트';
const hasBody = note => typeof note.body === 'string';
const getJson = (url, options) => fetch(url, options).then(response => {
  if (!response.ok) throw Error('Data unavailable');
  return response.json();
});
function loadAllBodies() {
  if (notes.every(hasBody)) return Promise.resolve();
  allBodies = allBodies || getJson('notes.json', {cache: 'no-cache'}).then(data => {
    const bodies = new Map(data.map(n => [n.id, n.body]));
    for (const note of notes) if (!hasBody(note) && bodies.has(note.id)) note.body = bodies.get(note.id);
  }).catch(() => { allBodies = null; });
  return allBodies;
}
function loadBody(note) {
  if (hasBody(note)) return Promise.resolve();
  note.loading = note.loading || getJson('data/notes/' + encodeURIComponent(note.id) + '.json')
    .then(data => { if (typeof data.body === 'string') { note.body = data.body; note.knowledge = data.knowledge; } })
    .catch(() => loadAllBodies())
    .then(() => { note.loading = null; });
  return note.loading;
}
// An address is #<document-id>, optionally followed by /<section number>.
const rawHash = () => {
  let raw = location.hash.slice(1);
  try { raw = decodeURIComponent(raw); } catch {}
  return raw;
};
const currentHash = () => {
  const raw = rawHash().replace(/\/\d+$/, '');
  // Preserve the original public permalink after the two silent-film articles were consolidated.
  return raw === 'silent-film' ? 'silent-film-musician-labor' : raw;
};
const currentSection = () => Number(/\/(\d+)$/.exec(rawHash())?.[1]) || 0;
// The knowledge log (data/log.json, built at deploy from the editorial ledger):
// every recorded piece of knowledge with its kind, date, document and section.
const KINDS = {argument:'논증', concept:'개념', fact:'사실', example:'사례', curation:'선별',
  counterargument:'반론', question:'질문', other:'기타'};
const RELATIONS = {introduces:'소개', curates:'선별', illustrates:'사례', elaborates:'심화', contrasts:'대조', supports:'근거'};
let log = null, logLoading = null, logKind = '전체';
function loadLog() {
  logLoading = logLoading || getJson('data/log.json', {cache: 'no-cache'})
    .then(data => { log = Array.isArray(data) ? data.filter(e => byId(e.doc)) : []; })
    .catch(() => { log = []; });
  return logLoading;
}
const kindChip = kind => '<span class="kind kind-' + esc(kind) + '">' + esc(KINDS[kind] || KINDS.other) + '</span>';
const sectionLink = (doc, section) => permalink(doc) + (section ? '/' + section : '');
// Back and forward return to where the reader was: each history entry remembers its scroll.
const historyState = () => { try { return window.history?.state || null; } catch { return null; } };
function rememberScroll() {
  try { window.history?.replaceState({...historyState(), y: Math.round(window.scrollY || 0)}, ''); } catch {}
}
function restoreScroll() {
  const y = historyState()?.y;
  const heading = y === undefined && currentSection()
    ? document.getElementById(currentHash() + '-section-' + currentSection()) : null;
  if (!heading?.scrollIntoView) return window.scrollTo({top: y || 0, behavior: 'instant'});
  heading.scrollIntoView({behavior: 'instant', block: 'start'});
  heading.classList?.add('arrived');
}

function setExploreOpen(open) {
  exploreToggle.setAttribute('aria-expanded', String(open));
}
exploreToggle.addEventListener('click', () => {
  setExploreOpen(exploreToggle.getAttribute('aria-expanded') !== 'true');
});

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));
const validId = id => /^[a-z0-9-]+$/.test(id);
// Synthesis notes are editorial interpretations woven from articles (SYNTHESIS.md):
// marked with their own color and kept out of article totals and random picks.
const SYNTHESIS_LABELS = {cross:'교차 종합', concept:'개념 길잡이', critique:'편집 비평'};
const isSynthesis = note => note.kind === 'synthesis';
const isEssay = note => note.kind === 'ai-essay';
// Fiction (FICTION.md) counts toward the totals as works; chapters are reached
// through their work's table of contents instead of lists and random picks.
const isFiction = note => note.kind === 'fiction';
const isChapter = note => isFiction(note) && note.fiction_part === 'chapter';
const listed = note => !isChapter(note);
const articles = () => notes.filter(n => !isSynthesis(n) && !isEssay(n) && listed(n));
const categoryRank = name => name === '종합' ? 3 : name === '소설' ? 2 : name === 'AI의 글' ? 1 : 0;
const kindBadge = note => isSynthesis(note)
  ? '<span class="badge-synthesis">종합 · ' + esc(SYNTHESIS_LABELS[note.synthesis_type] || '해석') + '</span> '
  : isEssay(note)
    ? '<span class="badge-essay">AI의 글 · ' + (note.essay_origin === 'post-ingestion' ? '증보 후' : '독립 저술') + '</span> '
  : isFiction(note)
    ? '<span class="badge-fiction">소설 · ' + (isChapter(note) ? esc(note.chapter) + '장' : '작품') +
      (note.revised ? ' · 개고본' : '') + '</span> '
    : '';
const byId = id => notes.find(note => note.id === id);
const permalink = id => '#' + encodeURIComponent(id);
const sorted = items => items.slice().sort((a,b) =>
  b.updated.localeCompare(a.updated) || notes.indexOf(b) - notes.indexOf(a));
const normalized = s => String(s ?? '').normalize('NFKC').toLocaleLowerCase('ko');
// Search: every word must appear somewhere; a hit in the title or an alias
// outranks one in the summary, which outranks one in the body.
const queryTerms = () => [...new Set(normalized(search.value).split(/\s+/).filter(Boolean))];
function searchFields(note) {
  if (!note.fields || note.fields.withBody !== hasBody(note)) {
    note.fields = {withBody: hasBody(note), title: normalized(note.title),
      names: normalized([...(note.aliases || []), ...(note.tags || []), note.category].join(' \n ')),
      summary: normalized(note.summary), body: normalized(note.body)};
  }
  return note.fields;
}
function searchScore(note, terms) {
  const fields = searchFields(note);
  let score = 0;
  for (const term of terms) {
    const hit = fields.title.includes(term) ? 8 : fields.names.includes(term) ? 5
      : fields.summary.includes(term) ? 3 : fields.body.includes(term) ? 1 : 0;
    if (!hit) return 0;
    score += hit;
  }
  return score;
}
const termPattern = terms => terms.length
  ? new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a,b) => b.length - a.length).join('|') + ')', 'gi')
  : null;
const marked = (text, pattern) => pattern
  ? String(text ?? '').split(pattern).map((part, i) => i % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part)).join('')
  : esc(text);
// The passage of the body around the first matching word, without Markdown marks.
function snippet(note, pattern) {
  if (!pattern || !hasBody(note)) return null;
  pattern.lastIndex = 0;
  if (pattern.test(note.title + ' ' + note.summary)) return null;
  const text = note.body.replace(/^:::.*$/gm, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{2,4}\s+/gm, '').replace(/[*`|>]/g, '').replace(/\s+/g, ' ');
  pattern.lastIndex = 0;
  const found = pattern.exec(text);
  if (!found) return null;
  const start = Math.max(0, found.index - 50), end = Math.min(text.length, found.index + 110);
  return (start ? '… ' : '') + text.slice(start, end).trim() + (end < text.length ? ' …' : '');
}

const emphasis = html => html
  .replace(/\*\*(?=\S)(.+?)\*\*(?!\*)/g,'<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g,'<em>$1</em>');
// Code spans keep their text literally; a bare web address becomes a link.
function plainInline(text) {
  return esc(text).split(/(`[^`]+`)/).map((part, i) => i % 2
    ? '<code>' + part.slice(1, -1) + '</code>'
    : emphasis(part).replace(/(^|[\s(（:：])(https?:\/\/[^\s<>"'`*]+[^\s<>"'`*.,;:!?)）\]」』])/g,
        '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>')).join('');
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
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        emphasis(esc(match[1])) + '</a>';
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
function renderMarkdown(markdown, docId) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const toc = [];
  let html = '', para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) { html += '<p>' + para.map(inline).join(' ') + '</p>'; para = []; } };
  const flushList = () => { if (list) { html += '</' + list + '>'; list = null; } };
  const flushQuote = () => { if (quote.length) { html += '<blockquote>' + quote.map(inline).join(' ') + '</blockquote>'; quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };
  let originals = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const value = line.trim();
    // :::원본 [label] … ::: keeps the pre-revision text of a passage, folded (FICTION.md).
    const original = /^:::\s*원본(?:\s+(.*))?$/.exec(value);
    if (original) {
      flushAll();
      const inner = [];
      while (++index < lines.length && lines[index].trim() !== ':::') inner.push(lines[index]);
      html += '<details class="original-text"><summary>' + (original[1] ? inline(original[1]) + ' — ' : '') +
        '개고 전 원본 보기</summary><div class="original-body">' +
        renderMarkdown(inner.join('\n'), docId + '-original-' + (++originals)).html + '</div></details>';
      continue;
    }
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
  const choices = articles().filter(n => n.id !== except);
  if (!choices.length) return null;
  return choices[Math.floor(Math.random() * choices.length)];
}
// The home page opens on the same article all day; "다른 글" draws another.
function pickDaily() {
  const choices = articles();
  if (!choices.length) return null;
  const today = new Date();
  let seed = today.getFullYear() * 372 + today.getMonth() * 31 + today.getDate();
  seed = Math.imul(seed ^ (seed >>> 15), 2246822519) >>> 0;
  return choices.slice().sort((a,b) => a.id.localeCompare(b.id))[seed % choices.length];
}
function goRandom() {
  const current = validId(location.hash.slice(1)) ? location.hash.slice(1) : null;
  const chosen = pickRandom(current);
  if (chosen) location.hash = permalink(chosen.id);
}
function showFilters() {
  const counts = new Map();
  for (const n of notes.filter(listed)) counts.set(n.category, (counts.get(n.category) || 0) + 1);
  const choices = ['전체', ...[...counts.keys()].sort((a,b) => categoryRank(a) - categoryRank(b) ||
    counts.get(b) - counts.get(a) || a.localeCompare(b, 'ko'))];
  filters.replaceChildren();
  for (const name of choices) {
    const button = document.createElement('button');
    const count = name === '전체' ? articles().length : counts.get(name);
    button.type = 'button';
    button.className = (name === category ? 'active' : '') + (name === '종합' ? ' synthesis' : name === '소설' ? ' fiction' : name === 'AI의 글' ? ' essay' : '');
    button.setAttribute('aria-pressed', String(name === category));
    button.innerHTML = '<span>' + esc(name) + '</span><span class="filter-count">' + count + '</span>';
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
  if (!randomPick || !byId(randomPick.id)) randomPick = pickDaily();
  const dateSorted = sorted(notes.filter(listed));
  const feature = randomPick
    ? '<div class="random-card"><div><div class="eyebrow">오늘의 문서</div>' +
      '<h2>' + esc(randomPick.title) + '</h2><p>' + esc(randomPick.summary) + '</p>' +
      '<a class="link-strong" href="' + permalink(randomPick.id) + '">이 글 읽기 →</a></div>' +
      '<button type="button" class="outline-button" data-shuffle>다른 글 ↻</button></div>'
    : '';
  view.innerHTML =
    '<div class="page-heading"><h1>문서 탐색</h1><p>' + articles().length + '개 문서' +
    (notes.some(isSynthesis) ? ' · 종합 ' + notes.filter(isSynthesis).length + '편' : '') +
    (notes.some(isEssay) ? ' · AI의 글 ' + notes.filter(isEssay).length + '편' : '') + '</p></div>' +
    feature +
    (notes.some(n => n.k) ? '<a class="log-card" href="#log"><span><strong>지식 일지</strong> 원고에 더한 지식 ' +
      notes.reduce((sum, n) => sum + (n.k || 0), 0).toLocaleString('ko') + '건을 날짜와 유형으로 읽기</span><span>→</span></a>' : '') +
    '<section><div class="section-heading"><h2>최근 갱신</h2><a href="#all">모든 문서 →</a></div>' +
    '<ul class="compact-list">' + dateSorted.slice(0,8).map(n =>
      '<li><a href="' + permalink(n.id) + '"><span class="item-title">' + kindBadge(n) + esc(n.title) +
      '</span><span class="item-date">' + esc(n.updated) + '</span></a></li>').join('') +
    '</ul></section>';
}
function listing() {
  const q = search.value.trim();
  const terms = queryTerms();
  const pattern = termPattern(terms);
  const pool = notes.filter(n => (q || listed(n)) &&
    (category === '전체' ? (q || (!isSynthesis(n) && !isEssay(n))) : n.category === category));
  const scores = new Map(q ? pool.map(n => [n, searchScore(n, terms)]) : []);
  const matches = sorted(q ? pool.filter(n => scores.get(n) > 0) : pool);
  if (q) matches.sort((a,b) => scores.get(b) - scores.get(a));
  const pending = q && !notes.every(hasBody);
  if (pending) loadAllBodies().then(() => { if (currentHash() === 'all' && search.value.trim() === q) listing(); });
  if (q && !log) loadLog().then(() => { if (log.length && currentHash() === 'all' && search.value.trim() === q) listing(); });
  // Recorded knowledge whose title has every word: a direct way into the section.
  const known = q && log ? log.filter(e => (category === '전체' || byId(e.doc).category === category) &&
    terms.every(term => normalized(e.t).includes(term))) : [];
  const knowledgeHits = known.length
    ? '<section class="knowledge-hits"><h2>지식 표제 ' + known.length + '건</h2><ul class="knowledge-list">' +
      known.slice(0, 12).map(e => '<li>' + kindChip(e.k) + '<a href="' + sectionLink(e.doc, e.s) + '">' + marked(e.t, pattern) +
        '</a><span class="knowledge-where">' + esc(byId(e.doc).title) + '</span></li>').join('') + '</ul>' +
      (known.length > 12 ? '<p class="muted">나머지는 <a href="#log">지식 일지</a>에서 볼 수 있습니다.</p>' : '') + '</section>'
    : '';
  view.innerHTML =
    '<div class="page-heading"><h1>' + (q ? '검색 결과' : category === '전체' ? '전체 문서' : esc(category)) +
    '</h1><p>' + matches.length + '개 문서' + (q ? ' · 검색어: ' + esc(q) : '') +
    (q && category !== '전체' ? ' · 주제: ' + esc(category) : '') +
    (pending ? ' · 본문을 불러오는 중…' : '') + '</p></div>' + knowledgeHits +
    (matches.length
      ? matches.map(n => { const passage = snippet(n, pattern); return '<div class="list-item"><div class="meta">' + kindBadge(n) + esc(n.category) +
        ' · ' + esc(n.updated) + '</div><h2><a href="' + permalink(n.id) + '">' +
        marked(n.title, pattern) + '</a></h2><p>' + marked(n.summary, pattern) + '</p>' +
        (passage ? '<p class="list-snippet">' + marked(passage, pattern) + '</p>' : '') + '</div>'; }).join('')
      : pending ? '<p class="muted">본문에서 찾는 중입니다.</p>'
      : '<div class="empty">해당하는 문서가 없습니다. 검색어나 주제를 변경해 보세요.</div>');
}
// In-text links count as connections too. The index lists them; otherwise read the body.
const linksOf = note => note.links || (hasBody(note)
  ? [...new Set([...note.body.matchAll(/\]\(#([a-z0-9-]+)\)/g)].map(m => m[1]))] : []);
const readingMinutes = note => Math.max(1, Math.round((note.chars ?? (note.body || '').length) / 500));
function article(note) {
  const ready = hasBody(note);
  if (!ready) loadBody(note).then(() => {
    if (currentHash() !== note.id) return;
    if (hasBody(note)) { article(note); restoreScroll(); }
    else view.querySelector?.('.prose')?.replaceChildren('본문을 불러오지 못했습니다. 새로고침하거나 Markdown 원고를 확인해 주세요.');
  });
  const rendered = ready ? renderMarkdown(note.body, note.id)
    : {html: '<p class="muted">본문을 불러오는 중입니다.</p>', toc: []};
  const toc = rendered.toc.length > 1
    ? '<details class="toc"' + (window.matchMedia('(max-width: 800px)').matches ? '' : ' open') + '><summary>이 글의 목차 · ' + rendered.toc.length + '개 절</summary><ol>' +
      rendered.toc.map(item => '<li' + (item.level > 2 ? ' class="nested"' : '') +
        '><button type="button" data-jump="' + esc(item.id) + '">' +
        esc(item.title) + '</button></li>').join('') + '</ol></details>'
    : '';
  const connections = [...new Set([...(note.related || []), ...linksOf(note),
    ...notes.filter(n => (n.related || []).includes(note.id) || linksOf(n).includes(note.id)).map(n => n.id)])]
    .filter(id => id !== note.id && byId(id));
  // A confirmed relation says how the two articles are connected and why (wiki/relations.json).
  const typed = new Map((note.rel || []).filter(r => byId(r.id)).map(r => [r.id, r]));
  const relationNote = r => r
    ? '<span class="relation"><span class="relation-type">' + (r.dir === 'in' ? '← ' : '→ ') +
      esc(RELATIONS[r.type] || '관계') + '</span>' + esc(r.reason) + '</span>'
    : '';
  const ordered = [...connections.filter(id => typed.has(id)), ...connections.filter(id => !typed.has(id))];
  const related = ordered.length
    ? '<section class="reader-bottom"><h2>연결된 글</h2><div class="related-grid">' +
      ordered.map(id => '<a href="' + permalink(id) + '"' + (typed.has(id) ? ' class="typed"' : '') + '>' +
        esc(byId(id).title) + ' →' + relationNote(typed.get(id)) + '</a>').join('') +
      '</div></section>'
    : '';
  // What this article holds, piece by piece: the ledger's knowledge titles under their sections.
  const pieces = note.knowledge || [];
  const bySection = new Map();
  for (const piece of pieces) bySection.set(piece.s || 0, [...(bySection.get(piece.s || 0) || []), piece]);
  const knowledge = ready && pieces.length
    ? '<details class="toc knowledge-map"><summary>이 글에 담긴 지식 · ' + pieces.length + '건</summary><div class="knowledge-sections">' +
      [...bySection.keys()].sort((a,b) => a - b).map(number => '<div class="knowledge-section">' +
        (number ? '<button type="button" class="knowledge-heading" data-jump="' + esc(note.id + '-section-' + number) + '">' +
          esc(bySection.get(number)[0].h) + '</button>' : '<span class="knowledge-heading">글 전체</span>') +
        '<ul class="knowledge-list">' + bySection.get(number).map(piece => '<li>' + kindChip(piece.k) + '<span>' + esc(piece.t) +
          '</span><span class="knowledge-where">' + esc(piece.d) + '</span></li>').join('') + '</ul></div>').join('') +
      '</div></details>'
    : '';
  const github = 'https://github.com/belorin/belorin.github.io/blob/main/wiki/' +
    encodeURIComponent(note.id) + '.md';
  const commits = 'https://github.com/belorin/belorin.github.io/commits/main/wiki/' +
    encodeURIComponent(note.id) + '.md';
  // GitHub's editor: the owner commits straight to main (the deploy checks it);
  // anyone else is offered a fork and a pull request.
  const edit = 'https://github.com/belorin/belorin.github.io/edit/main/wiki/' +
    encodeURIComponent(note.id) + '.md';
  const discussion = comments.categoryId
    ? '<section class="reader-bottom comments"><h2>댓글</h2><div class="giscus" data-term="' + esc(note.id) + '"></div></section>'
    : '';
  const basis = (note.based_on || []).filter(byId);
  const synthesisNote = isSynthesis(note)
    ? '<aside class="synthesis-note"><strong>종합 노트</strong> 이 글은 위키의 여러 문서를 엮은 편집 해석입니다. ' +
      '사실의 근거는 아래 문서에 있으며, 이 글 자체는 다른 문서의 근거로 쓰지 않습니다.' +
      (basis.length ? '<span class="synthesis-basis">근거 문서: ' + basis.map(id =>
        '<a href="' + permalink(id) + '">' + esc(byId(id).title) + '</a>').join(' · ') + '</span>' : '') +
      '</aside>'
    : '';
  const essayNote = isEssay(note)
    ? '<aside class="essay-note"><strong>AI 자율 논고</strong> 이 글은 AI의 독립적인 해석과 비평입니다. 확정된 사실의 근거로 인용하지 말고 아래 출발 문서에서 확인하십시오.' +
      (basis.length ? '<span class="essay-basis">출발 지식 문서: ' + basis.map(id =>
        '<a href="' + permalink(id) + '">' + esc(byId(id).title) + '</a>').join(' · ') + '</span>' : '') + '</aside>'
    : '';
  const work = isChapter(note) ? byId(note.work) : null;
  const chapters = work ? notes.filter(n => isChapter(n) && n.work === work.id).sort((a,b) => a.chapter - b.chapter) : [];
  const at = chapters.indexOf(note);
  const chapterNav = work
    ? '<nav class="chapter-nav" aria-label="장 이동"><a href="' + permalink(work.id) + '">↑ 목차: ' + esc(work.title) + '</a>' +
      (at > 0 ? '<a href="' + permalink(chapters[at - 1].id) + '">← 이전 장</a>' : '') +
      (at >= 0 && at < chapters.length - 1 ? '<a href="' + permalink(chapters[at + 1].id) + '">다음 장 →</a>' : '') + '</nav>'
    : '';
  const fictionNote = isFiction(note) && note.revised
    ? '<aside class="fiction-note"><strong>개고본</strong> 원문을 고쳐 다듬은 판본입니다. ' +
      '"개고 전 원본 보기"를 펼치면 고치기 전의 원문을 확인할 수 있습니다.</aside>'
    : '';
  view.innerHTML = '<article class="reader' + (isSynthesis(note) ? ' is-synthesis' : isEssay(note) ? ' is-essay' : isFiction(note) ? ' is-fiction' : '') + '"><a class="back" href="#all">← 문서 목록</a>' +
    '<header class="reader-header"><div class="meta">' + kindBadge(note) + esc(note.category) +
    ' · ' + esc(note.updated) + ' · ' + esc(note.status) + ' · 약 ' + readingMinutes(note) + '분</div>' +
    '<h1>' + esc(note.title) + '</h1>' +
    '<p class="reader-lead">' + esc(note.summary) + '</p>' +
    '<div class="reader-tools"><a href="' + github + '" target="_blank" rel="noopener noreferrer">Markdown 원고 ↗</a>' +
    '<button type="button" data-copy="' + esc(pageBase + encodeURIComponent(note.id) + '/') + '">LLM용 링크 복사</button>' +
    '<a href="' + commits + '" target="_blank" rel="noopener noreferrer">개정 이력 ↗</a>' +
    '<a href="' + edit + '" target="_blank" rel="noopener noreferrer">고치기 ✎</a>' +
    '<button type="button" data-random>무작위 글 ↝</button></div></header>' +
    synthesisNote + essayNote + fictionNote + chapterNav + toc + knowledge + '<div class="prose">' + rendered.html + '</div>' + chapterNav +
    related +
    (note.source ? '<p class="reader-source">자료·검토 표기: ' + esc(note.source) + '</p>' : '') +
    (ready ? discussion : '') + '</article>';
  if (ready) loadComments();
}
function about() {
  const items = [
    ['living-notes','운영 방향'], ['editing-principles','편집 원칙'],
    ['open-questions','열린 질문'], ['wiki-building-history','구축 이력']
  ].filter(([id]) => byId(id));
  view.innerHTML = '<div class="page-heading"><h1>이 공간에 관하여</h1>' +
    '<p>대화를 그대로 보관하기보다 지식을 독립적인 원고로 집필하고 계속 확장하는 공개 위키입니다.</p></div>' +
    '<div class="section-heading"><h2>운영과 원칙</h2></div>' +
    '<ul class="compact-list">' + items.map(([id,label]) =>
      '<li><a href="' + permalink(id) + '"><span class="item-title">' +
      esc(label) + ' — ' + esc(byId(id).title) + '</span>→</a></li>').join('') + '</ul>';
}
// The knowledge log: the wiki read along time instead of by document. Each day
// lists what was added, by kind, and leads to the section that now holds it.
function knowledgeLog() {
  if (!log) {
    view.innerHTML = '<div class="page-heading"><h1>지식 일지</h1><p>불러오는 중입니다.</p></div>';
    loadLog().then(() => { if (currentHash() === 'log') knowledgeLog(); });
    return;
  }
  const heading = '<div class="page-heading"><h1>지식 일지</h1><p>문서가 아니라 지식 단위로 읽는 위키입니다. ' +
    '대화에서 얻어 원고에 더한 논증·개념·사실·반론·질문을 더한 날 순으로 싣고, 각 항목은 그 지식이 놓인 절로 이어집니다.</p></div>';
  if (!log.length) { view.innerHTML = heading + '<div class="empty">지식 일지 자료가 없습니다. <a href="#all">전체 문서 보기 →</a></div>'; return; }
  const counts = new Map();
  for (const entry of log) counts.set(entry.k, (counts.get(entry.k) || 0) + 1);
  const chips = ['전체', ...Object.keys(KINDS).filter(kind => counts.has(kind))].map(kind =>
    '<button type="button" data-kind="' + esc(kind) + '" class="' + (kind === logKind ? 'active' : '') + '" aria-pressed="' + (kind === logKind) + '">' +
    esc(kind === '전체' ? '전체' : KINDS[kind]) + ' <span class="filter-count">' + (kind === '전체' ? log.length : counts.get(kind)) + '</span></button>').join('');
  const shown = log.filter(entry => logKind === '전체' || entry.k === logKind);
  const days = new Map();
  for (const entry of shown) {
    if (!days.has(entry.d)) days.set(entry.d, new Map());
    const docs = days.get(entry.d);
    docs.set(entry.doc, [...(docs.get(entry.doc) || []), entry]);
  }
  view.innerHTML = heading + '<div class="kind-filter" role="group" aria-label="지식 유형">' + chips + '</div>' +
    [...days].map(([day, docs], at) => '<details class="log-day"' + (at < 2 ? ' open' : '') + '><summary><strong>' + esc(day) +
      '</strong><span>문서 ' + docs.size + '편 · 지식 ' + [...docs.values()].reduce((sum, list) => sum + list.length, 0) + '건</span></summary>' +
      [...docs].map(([id, entries]) => '<div class="log-doc"><h2><a href="' + permalink(id) + '">' + kindBadge(byId(id)) + esc(byId(id).title) +
        '</a></h2><ul class="knowledge-list">' + entries.map(entry => '<li>' + kindChip(entry.k) + '<a href="' + sectionLink(id, entry.s) + '">' +
        esc(entry.t) + '</a>' + (entry.h ? '<span class="knowledge-where">' + esc(entry.h) + '</span>' : '') + '</li>').join('') +
        '</ul></div>').join('') + '</details>').join('');
}
// The calendar lives in calendar.js and is drawn only on desktop screens.
function calendar() {
  if (window.Calendar) window.Calendar.render(view, {byId, esc, permalink});
  else view.innerHTML = '<div class="empty">달력을 불러오지 못했습니다. <a href="#all">전체 문서 보기 →</a></div>';
}
function render() {
  if (!notes.length) return;
  view.setAttribute('aria-busy','false');
  const hash = currentHash();
  const heading = {all: '전체 문서', about: '소개', calendar: '달력', log: '지식 일지'}[hash] || byId(hash)?.title;
  document.title = heading ? heading + ' · ' + siteTitle : siteTitle;
  setExploreOpen(!byId(hash) && hash !== 'log');
  // The calendar takes the whole width; the search and topic sidebar step aside.
  document.body?.classList.toggle('wide', hash === 'calendar');
  if (!hash) home();
  else if (hash === 'all') listing();
  else if (hash === 'about') about();
  else if (hash === 'calendar') calendar();
  else if (hash === 'log') knowledgeLog();
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
  else if (target.hasAttribute('data-copy')) {
    copyLink(target);
  } else if (target.hasAttribute('data-kind')) {
    logKind = target.getAttribute('data-kind'); knowledgeLog();
  } else if (target.hasAttribute('data-jump')) {
    const heading = target.getAttribute('data-jump');
    document.getElementById(heading)?.scrollIntoView({behavior:'smooth',block:'start'});
    // The address follows the section, so it can be copied or bookmarked.
    const number = /-section-(\d+)$/.exec(heading)?.[1];
    try { if (number) window.history?.replaceState(historyState(), '', permalink(currentHash()) + '/' + number); } catch {}
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
search.addEventListener('focus', () => { loadAllBodies(); loadLog(); });
search.addEventListener('input', () => {
  if (location.hash !== '#all') location.hash = '#all';
  else render();
});
window.addEventListener('hashchange', () => {
  render();
  restoreScroll();
});
try { window.history.scrollRestoration = 'manual'; } catch {}
let scrollTimer = null;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(rememberScroll, 120);
}, {passive: true});
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
getJson('data/index.json', {cache: 'no-cache'})
  .catch(() => getJson('notes.json', {cache: 'no-cache'}))
  .then(data => {
    notes = Array.isArray(data) ? data.filter(n => validId(n.id)) : [];
    showFilters();
    render();
    restoreScroll();
  })
  .catch(() => {
    view.setAttribute('aria-busy','false');
    view.innerHTML = '<div class="empty">문서를 불러오지 못했습니다. 새로고침하거나 GitHub 원고를 확인해 주세요.</div>';
  });
