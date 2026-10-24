'use strict';

const view = document.querySelector('#view');
const search = document.querySelector('#search');
const filters = document.querySelector('#filters');
const randomButton = document.querySelector('#sidebar-random');
const exploreToggle = document.querySelector('#explore-toggle');
const repo = 'https://github.com/belorin/belorin.github.io';
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
function renderMarkdown(markdown, docId) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const toc = [];
  let html = '', para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) { html += '<p>' + para.map(inline).join(' ') + '</p>'; para = []; } };
  const flushList = () => { if (list) { html += '</' + list + '>'; list = null; } };
  const flushQuote = () => { if (quote.length) { html += '<blockquote>' + quote.map(inline).join(' ') + '</blockquote>'; quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };
  for (const line of lines) {
    const value = line.trim();
    const heading = /^(#{2,4})\s+(.+)$/.exec(value);
    const bullet = /^[-*+]\s+(.+)$/.exec(value);
    const numbered = /^\d+\.\s+(.+)$/.exec(value);
    if (!value) { flushAll(); continue; }
    if (heading) {
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
  for (const n of notes) counts.set(n.category, (counts.get(n.category) || 0) + 1);
  const choices = ['전체', ...[...counts.keys()].sort((a,b) =>
    counts.get(b) - counts.get(a) || a.localeCompare(b, 'ko'))];
  filters.replaceChildren();
  for (const name of choices) {
    const button = document.createElement('button');
    const count = name === '전체' ? notes.length : counts.get(name);
    button.type = 'button';
    button.className = name === category ? 'active' : '';
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
  const dateSorted = sorted(notes);
  const categoryCounts = [...new Set(notes.map(n => n.category))]
    .map(name => ({name, count:notes.filter(n => n.category === name).length}))
    .sort((a,b) => b.count - a.count || a.name.localeCompare(b.name,'ko'));
  const feature = randomPick
    ? '<div class="random-card"><div><div class="eyebrow">오늘의 무작위 문서</div>' +
      '<h2>' + esc(randomPick.title) + '</h2><p>' + esc(randomPick.summary) + '</p>' +
      '<a class="link-strong" href="' + permalink(randomPick.id) + '">이 글 읽기 →</a></div>' +
      '<button type="button" class="outline-button" data-shuffle>다른 글 ↻</button></div>'
    : '';
  view.innerHTML =
    '<div class="page-heading"><h1>문서 탐색</h1><p>현재 ' + notes.length +
    '개의 문서. 주제를 고르거나 검색해서 바로 읽을 수 있습니다.</p></div>' +
    feature +
    '<section><div class="section-heading"><h2>주제별 보기</h2><a href="#all">전체 목록 →</a></div>' +
    '<div class="topic-grid">' + categoryCounts.map(c =>
      '<button class="topic" type="button" data-category="' + esc(c.name) + '">' +
      esc(c.name) + '<span>' + c.count + '개 →</span></button>').join('') + '</div></section>' +
    '<section><div class="section-heading"><h2>최근 갱신</h2><a href="#all">모든 문서 →</a></div>' +
    '<ul class="compact-list">' + dateSorted.slice(0,8).map(n =>
      '<li><a href="' + permalink(n.id) + '"><span class="item-title">' + esc(n.title) +
      '</span><span class="item-date">' + esc(n.updated) + '</span></a></li>').join('') +
    '</ul></section>';
}
function listing() {
  const q = search.value.trim();
  const matches = sorted(notes.filter(n =>
    (category === '전체' || n.category === category) && (!q || textMatch(n))));
  view.innerHTML =
    '<div class="page-heading"><h1>' + (q ? '검색 결과' : category === '전체' ? '전체 문서' : esc(category)) +
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
  view.innerHTML = '<article class="reader"><a class="back" href="#all">← 문서 목록</a>' +
    '<header class="reader-header"><div class="meta">' + esc(note.category) +
    ' · ' + esc(note.updated) + ' · ' + esc(note.status) + '</div>' +
    '<h1>' + esc(note.title) + '</h1>' +
    '<p class="reader-lead">' + esc(note.summary) + '</p>' +
    '<div class="reader-tools"><a href="' + github + '" target="_blank" rel="noopener noreferrer">Markdown 원고 ↗</a>' +
    '<a href="' + commits + '" target="_blank" rel="noopener noreferrer">개정 이력 ↗</a>' +
    '<button type="button" data-random>무작위 글 ↝</button></div></header>' +
    toc + '<div class="prose">' + rendered.html + '</div>' +
    related +
    (note.source ? '<p class="reader-source">자료·검토 표기: ' + esc(note.source) + '</p>' : '') +
    '</article>';
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
function render() {
  if (!notes.length) return;
  view.setAttribute('aria-busy','false');
  const hash = decodeURIComponent(location.hash.slice(1));
  setExploreOpen(!byId(hash));
  if (!hash) home();
  else if (hash === 'all') listing();
  else if (hash === 'about') about();
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
  else if (target.hasAttribute('data-category')) {
    category = target.getAttribute('data-category');
    showFilters();
    location.hash = '#all';
  } else if (target.hasAttribute('data-jump')) {
    document.getElementById(target.getAttribute('data-jump'))?.scrollIntoView({behavior:'smooth',block:'start'});
  }
});
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
