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
    'data-input-position': 'bottom', 'data-theme': 'https://belorin.github.io/giscus-theme.css?v=1', 'data-lang': 'ko', 'data-loading': 'lazy', crossorigin: 'anonymous'};
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
// Fiction (FICTION.md) counts toward the totals as works; chapters are reached
// through their work's table of contents instead of lists and random picks.
const isFiction = note => note.kind === 'fiction';
const isChapter = note => isFiction(note) && note.fiction_part === 'chapter';
const listed = note => !isChapter(note);
const articles = () => notes.filter(n => !isSynthesis(n) && listed(n));
const categoryRank = name => name === '종합' ? 2 : name === '소설' ? 1 : 0;
const kindBadge = note => isSynthesis(note)
  ? '<span class="badge-synthesis">종합 · ' + esc(SYNTHESIS_LABELS[note.synthesis_type] || '해석') + '</span> '
  : isFiction(note)
    ? '<span class="badge-fiction">소설 · ' + (isChapter(note) ? esc(note.chapter) + '장' : '작품') +
      (note.revised ? ' · 개고본' : '') + '</span> '
    : '';
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
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        plainInline(match[1]) + '</a>';
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
    button.className = (name === category ? 'active' : '') + (name === '종합' ? ' synthesis' : name === '소설' ? ' fiction' : '');
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
  if (!randomPick || !byId(randomPick.id)) randomPick = pickRandom();
  const dateSorted = sorted(notes.filter(listed));
  const feature = randomPick
    ? '<div class="random-card"><div><div class="eyebrow">오늘의 무작위 문서</div>' +
      '<h2>' + esc(randomPick.title) + '</h2><p>' + esc(randomPick.summary) + '</p>' +
      '<a class="link-strong" href="' + permalink(randomPick.id) + '">이 글 읽기 →</a></div>' +
      '<button type="button" class="outline-button" data-shuffle>다른 글 ↻</button></div>'
    : '';
  view.innerHTML =
    '<div class="page-heading"><h1>문서 탐색</h1><p>' + articles().length + '개 문서' +
    (notes.some(isSynthesis) ? ' · 종합 ' + notes.filter(isSynthesis).length + '편' : '') + '</p></div>' +
    feature +
    '<section><div class="section-heading"><h2>최근 갱신</h2><a href="#all">모든 문서 →</a></div>' +
    '<ul class="compact-list">' + dateSorted.slice(0,8).map(n =>
      '<li><a href="' + permalink(n.id) + '"><span class="item-title">' + kindBadge(n) + esc(n.title) +
      '</span><span class="item-date">' + esc(n.updated) + '</span></a></li>').join('') +
    '</ul></section>';
}
function listing() {
  const q = search.value.trim();
  const matches = sorted(notes.filter(n =>
    (q || listed(n)) &&
    (category === '전체' ? (q || !isSynthesis(n)) : n.category === category) && (!q || textMatch(n))));
  view.innerHTML =
    '<div class="page-heading"><h1>' + (q ? '검색 결과' : category === '전체' ? '전체 문서' : esc(category)) +
    '</h1><p>' + matches.length + '개 문서' + (q ? ' · 검색어: ' + esc(q) : '') + '</p></div>' +
    (matches.length
      ? matches.map(n => '<div class="list-item"><div class="meta">' + kindBadge(n) + esc(n.category) +
        ' · ' + esc(n.updated) + '</div><h2><a href="' + permalink(n.id) + '">' +
        esc(n.title) + '</a></h2><p>' + esc(n.summary) + '</p></div>').join('')
      : '<div class="empty">해당하는 문서가 없습니다. 검색어나 주제를 변경해 보세요.</div>');
}
function article(note) {
  const rendered = renderMarkdown(note.body, note.id);
  const toc = rendered.toc.length > 1
    ? '<details class="toc"' + (window.matchMedia('(max-width: 800px)').matches ? '' : ' open') + '><summary>이 글의 목차 · ' + rendered.toc.length + '개 절</summary><ol>' +
      rendered.toc.map(item => '<li' + (item.level > 2 ? ' class="nested"' : '') +
        '><button type="button" data-jump="' + esc(item.id) + '">' +
        esc(item.title) + '</button></li>').join('') + '</ol></details>'
    : '';
  const connections = [...new Set([...(note.related || []),
    ...notes.filter(n => (n.related || []).includes(note.id)).map(n => n.id)])]
    .filter(id => id !== note.id && byId(id));
  const related = connections.length
    ? '<section class="reader-bottom"><h2>연결된 글</h2><div class="related-grid">' +
      connections.map(id => '<a href="' + permalink(id) + '">' + esc(byId(id).title) + ' →</a>').join('') +
      '</div></section>'
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
  view.innerHTML = '<article class="reader' + (isSynthesis(note) ? ' is-synthesis' : isFiction(note) ? ' is-fiction' : '') + '"><a class="back" href="#all">← 문서 목록</a>' +
    '<header class="reader-header"><div class="meta">' + kindBadge(note) + esc(note.category) +
    ' · ' + esc(note.updated) + ' · ' + esc(note.status) + '</div>' +
    '<h1>' + esc(note.title) + '</h1>' +
    '<p class="reader-lead">' + esc(note.summary) + '</p>' +
    '<div class="reader-tools"><a href="' + github + '" target="_blank" rel="noopener noreferrer">Markdown 원고 ↗</a>' +
    '<button type="button" data-copy="' + esc(pageBase + encodeURIComponent(note.id) + '/') + '">LLM용 링크 복사</button>' +
    '<a href="' + commits + '" target="_blank" rel="noopener noreferrer">개정 이력 ↗</a>' +
    '<a href="' + edit + '" target="_blank" rel="noopener noreferrer">고치기 ✎</a>' +
    '<button type="button" data-random>무작위 글 ↝</button></div></header>' +
    synthesisNote + fictionNote + chapterNav + toc + '<div class="prose">' + rendered.html + '</div>' + chapterNav +
    related +
    (note.source ? '<p class="reader-source">자료·검토 표기: ' + esc(note.source) + '</p>' : '') +
    discussion + '</article>';
  loadComments();
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
// The calendar lives in calendar.js and is drawn only on desktop screens.
function calendar() {
  if (window.Calendar) window.Calendar.render(view, {byId, esc, permalink});
  else view.innerHTML = '<div class="empty">달력을 불러오지 못했습니다. <a href="#all">전체 문서 보기 →</a></div>';
}
function render() {
  if (!notes.length) return;
  view.setAttribute('aria-busy','false');
  const rawHash = decodeURIComponent(location.hash.slice(1));
  // Preserve the original public permalink after the two silent-film articles were consolidated.
  const hash = rawHash === 'silent-film' ? 'silent-film-musician-labor' : rawHash;
  setExploreOpen(!byId(hash));
  // The calendar takes the whole width; the search and topic sidebar step aside.
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
  else if (target.hasAttribute('data-copy')) {
    copyLink(target);
  } else if (target.hasAttribute('data-jump')) {
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
    notes = Array.isArray(data) ? data.filter(n => validId(n.id)) : [];
    showFilters();
    render();
  })
  .catch(() => {
    view.setAttribute('aria-busy','false');
    view.innerHTML = '<div class="empty">문서를 불러오지 못했습니다. 새로고침하거나 GitHub 원고를 확인해 주세요.</div>';
  });
