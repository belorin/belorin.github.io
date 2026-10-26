# belorin · 열린 노트

https://belorin.github.io

대화에서 시작해 계속 고쳐 쓰는 공개 개인 위키. 기존 GitHub Pages 정적 UI를 유지합니다.

## 정본과 생성물

- **`wiki/*.md`**: 지식 본문의 유일한 정본
- **`wiki/manifest.json`**: 문서별 메타데이터와 게시 여부의 정본
- **`wiki/relations.json`**: 근거와 유형이 확인된 관계의 정본
- **`AI_INDEX.md`, `ai/index.json`, `ai/relations.json`, `llms.txt`**: 자동 생성되는 AI 탐색 자료
- **`notes.json`**: 위 두 정본으로부터 생성하는 웹사이트 데이터 (**직접 수정하지 않음**)
- **`WIKI_PROTOCOL.md`**: 대화 증보 규칙(증보에 필요한 규칙 전부). **`MAINTENANCE.md`**: 정비 절차. **`SYNTHESIS.md`**: 종합 절차. **`FICTION.md`**: 소설 보존 절차. **`AGENTS.md`**: 작업별로 읽을 문서를 안내하는 짧은 지침
- **`editorial/ingestions/`**: 직접 증보의 위치와 보류 상태를 기록하는 편집 장부 (대화 원문 없음)
- **`editorial/crosslinks/index.json`**: 직접 입증되지 않은 개념적 유비·교차 편집 제안 장부. 자동 집필 대상이 아님.

## 파일 구성

**원고와 정본**
- `wiki/*.md`: 지식 본문의 유일한 편집 정본. 긴 논증, 출처, 사례를 요약 없이 보존한다.
- `wiki/manifest.json`: 문서 ID·제목·분류·상태·출처·관련 문서·게시 여부(`publish`)·순서·별칭·검토 상태·증보일 등 메타데이터의 정본. 종합 글은 `kind`·`synthesis_type`·`based_on`을 더 가진다.
- `wiki/relations.json`: 근거 절과 설명이 명시된 확인된 의미 관계의 정본. `manifest.related`는 일반 연관.
- `wiki/calendar.json`: 데스크톱 달력(`/#calendar`)의 정본. 시기가 특정되는 문서·절만 정비 때 골라 누적한다(MAINTENANCE.md §4). `scripts/validate-calendar.mjs`가 문서·절의 존재와 날짜 형식을 검증한다.

**편집 기록(정본, 공개 파일)**
- `editorial/ingestions/index.json`, `editorial/ingestions/<batch-id>.json`: 증보 배치 색인과 배치별 지식 표제·반영 문서·절·보류 항목. 대화 원문·발췌·URL은 저장하지 않는다.
- `editorial/crosslinks/index.json`: 간접적 유비·해석적 관계의 검토 대기 제안 장부. 본문이나 관계 정본에 자동으로 집필하지 않는다.
- `editorial/maintenance/log.json`, `editorial/maintenance/reports/<버전>.md`: 정비 버전 로그와 정비 보고서.

**생성물(직접 수정 금지, GitHub Actions가 갱신)**
- `notes.json`: 사이트가 읽는 문서 데이터(`scripts/build-notes.mjs`). 종합 글의 규칙도 이 스크립트가 검증한다.
- `AI_INDEX.md`, `ai/index.json`, `ai/relations.json`, `llms.txt`: 외부 AI용 공개 색인(`scripts/build-ai-index.mjs`). `publish:true` 문서만 싣는다.
- `editorial/map/index.md`, `editorial/map/docs/<id>.md`, `editorial/map/knowledge.md`: 편집 지도(`scripts/build-wiki-map.mjs`). 미게시 포함 모든 원고의 지도, 문서별 카드(소제목 경로·줄 범위·분량·해시·첫 문장·장부 기록·관계), 장부를 뒤집은 지식 표제 역색인. 지도가 25,000자를 넘으면 자동으로 분류별 파일(`editorial/map/categories/`)로 나뉜다. 미게시 원고를 포함하는 편집용 자료이므로 공개 AI 색인과 `llms.txt`에는 연결하지 않는다.
- `editorial/maintenance/queue.md`: 정비 대기열(`scripts/build-maintenance-queue.mjs`). 정비 로그도 이 스크립트가 검증한다.

**배포 때만 만드는 파일(저장소에 커밋하지 않음)**
- `notes/<id>/index.html`, `notes/index.html`, `sitemap.xml`: 문서마다 본문이 들어 있는 정적 페이지와 전체 목록, 사이트맵(`scripts/build-static.mjs`). 사이트의 `app.js` 렌더러로 만들므로 탐색 화면과 내용이 같다. 검색엔진과 자바스크립트를 실행하지 않는 LLM이 읽는 입구다. `robots.txt`는 검색엔진에게 편집용 파일과 원본 데이터를 색인하지 말라고 알릴 뿐 접근은 막지 않는다.

**검증·검색 스크립트**
- `scripts/validate-editorial.mjs`, `scripts/test-editorial.mjs`: 증보 장부의 배치·항목·반영 문서와 절의 존재를 검증한다.
- `scripts/validate-crosslinks.mjs`, `scripts/test-crosslinks.mjs`: 교차 제안의 근거 절·상태와 오프라인 검색을 검증한다.
- `scripts/search-wiki.mjs`: 문자 n-gram·연관 그래프 기반 후보 검색(임베딩 아님).
- `scripts/test-viewer.mjs`: 사이트 뷰어 동작 시험.

**사이트**
- `index.html`, `style.css`, `app.js`: 정적 사이트 뷰어. `calendar.js`는 데스크톱 전용 달력(`/#calendar`)으로, 연대형(세기·10년·1년 스케일)과 절기형(한 해의 날) 세로 띠와 보이는 구간을 따라가는 오른쪽 목록을 그린다 사이드바 없이 화면 전체를 쓰며, 덩어리(기본)·칸 두 가지 모양으로 바꿔 볼 수 있다. 첫 화면은 무작위 글·최근 갱신, `/#all`은 검색 목록, `/#<문서-id>`는 목차·관련 글·개정 이력 화면이다. 렌더러는 단락, `##`~`####` 소제목, 목록, 강조, 인라인 코드, 링크, Markdown 표를 지원한다.

## 편집·게시

1. 해당 `wiki/<문서-id>.md`를 편집한다. 새 글이면 `wiki/manifest.json`에 등록한다.
2. 별칭·검토 상태·증보일은 `wiki/manifest.json`, 의미 관계는 `wiki/relations.json`에 기록한다.
3. 대화에서 신규 지식을 반영했다면 `editorial/ingestions/index.json`과 해당 배치 JSON에 **짧은 지식 표제, 반영 문서의 정확한 절, 미완 항목**을 기록한다. 원문은 저장하지 않는다.
4. Markdown·manifest·관계 정본·편집 장부를 `main`에 직접 커밋한다. 브랜치·PR은 필요 없다.
5. GitHub Actions(`.github/workflows/deploy-pages.yml`)가 `notes.json`·AI 색인·`llms.txt`·편집 지도·정비 대기열을 생성·검증하고, 생성물을 `main`에 자동 커밋한 뒤 사이트를 배포한다. 검증에 실패하면 배포하지 않고 직전 사이트를 유지한다.

별도 npm 설치는 필요하지 않다. 로컬에서는 `node scripts/build-notes.mjs`, `node scripts/build-ai-index.mjs`와 검증 스크립트로 미리 확인할 수 있다. `notes.json`을 편집하는 대신 반드시 Markdown을 수정한다.

현재 공개 페이지 주소는 기존과 같이 `/#문서-id`이다. `publish:false` 원고는 GitHub에서 Markdown으로는 확인 가능하지만 사이트 목록에는 나오지 않는다.

Pages는 브랜치 배포가 아니라 GitHub Actions 배포를 사용한다(Settings → Pages → Source: GitHub Actions). 사이트는 워크플로가 직접 생성한 결과물로 배포하므로, 생성물의 자동 커밋이 별도의 Pages 빌드를 촉발하지 않아도 게시가 누락되지 않는다. 자동 커밋은 GitHub에서 생성물(AI 색인 등)을 읽는 편집자를 위해 저장소를 최신으로 유지하는 용도다.

## 정비

새 대화를 넣는 일상 증보는 새 지식과 직접 관련된 절과 연결만 검토한다. 멀리 떨어진 문서 사이의 관계, 중복 후보, 고립 문서, 보류 항목은 가끔 하는 **정비**에서 다룬다.

- [`MAINTENANCE.md`](MAINTENANCE.md): 정비 절차. 정비를 요청할 때만 읽는다.
- [`editorial/maintenance/queue.md`](editorial/maintenance/queue.md): 원고 전체에서 기계가 찾은 정비 신호(자동 생성)
- `editorial/maintenance/log.json`: 정비 버전 로그(`M001`, `M002`, …)
- `editorial/maintenance/reports/<버전>.md`: 정비 보고서. 병합·분할·분류 변경·교차 제안 승인은 여기 제안으로만 남긴다.

## 종합

이미 쌓인 문서들을 엮어 새로 생각하는 작업이다. 절차는 [`SYNTHESIS.md`](SYNTHESIS.md)에 있으며 종합을 요청할 때만 읽는다.

- 유형: **교차 종합**(여러 문서를 가로지르는 장문), **개념 길잡이**(한 개념의 문서별 용례 대조), **편집 비평**(논증의 빈틈과 빠진 반론)
- 재료는 위키 안의 문서뿐이며, 사실은 근거 문서와 절을 밝히고 해석·의견은 그렇게 드러낸다.
- manifest의 `kind: "synthesis"`, `synthesis_type`, `based_on`, `category: "종합"`으로 등록한다. 처음에는 `publish: false`로 쓰고 소유자가 게시를 결정한다.
- 사이트에서는 보라색 "종합" 말머리와 안내 상자로 표시되며, 전체 목록·문서 수·무작위 글에서 빠지고 "종합" 주제로 따로 모인다. AI 색인·`llms.txt`·편집 지도에서도 별도 묶음이다.
- 종합은 다른 글의 사실 근거가 되지 않는다. 다른 종합의 근거로 쓰거나 대화 지식을 증보하면 빌드가 실패한다.

## 소설

대화에서 나온 소설은 해설로 바꾸지 않고 작품으로 보존한다. 절차는 [`FICTION.md`](FICTION.md)에 있으며, 대화에 소설 본문이 있거나 소설을 이어 쓸 때만 읽는다.

- 판본은 최종본·가장 나중의 퇴고본을 기본으로 하고, 갈라지는 판본은 이본으로 남긴다.
- 최소 손질은 항상 하고, 품질이 낮으면 판단해서 개고한다. 개고한 부분 뒤에는 원본을 `:::원본 … :::` 블록으로 겹쳐 두며, 사이트에서는 접혀 있다가 펼치면 보인다.
- 긴 작품은 작품 문서(작품 노트와 목차)와 장별 문서로 나눈다. manifest는 `kind: "fiction"`, `fiction_part`(`work`/`chapter`), `work`, `chapter`, `revised`, `category: "소설"`.
- 작품은 문서 수 합계에 들어가고 "소설" 주제로 모인다. 장 문서는 목록·합계·무작위 글에서 빠진다. 편집 지도에서는 작품당 한 줄이며 일상 증보에서 순회하지 않는다. 소설은 사실 근거로 인용하지 않는다(빌드가 검증).

## 향후 원고의 문체

새로 집필·증보하는 원고는 독립적인 서적 문장으로 쓴다. '대화에서는', '사용자가 질문했고', 'AI가 설명했다'처럼 출처를 회고하는 문장을 사용하지 않는다. 이전 원고의 문장은 이번 단계에서 소급 수정하지 않는다. 편집 장부에는 대화 내용 대신 공개 가능한 지식 표제와 반영된 위치만 남긴다.

## AI 탐색

- [`AI_INDEX.md`](AI_INDEX.md): 공개 문서의 제목, 별칭, 검토 상태, 원고 링크를 탐색
- [`ai/index.json`](ai/index.json): 기계용 문서 ID·별칭·수정일·증보일·검토 상태와 직접 Markdown 주소
- [`ai/relations.json`](ai/relations.json): 단순 관련성과 근거 기반 의미 관계
- [`llms.txt`](llms.txt): 외부 AI가 사용할 수 있는 선택적 진입점

편집 작업에서는 위 공개 색인 대신 자동 생성 **편집 지도**를 쓴다.

- [`editorial/map/index.md`](editorial/map/index.md): 미게시 포함 모든 원고의 제목·별칭·절 수·분량 한 줄 지도
- `editorial/map/docs/<id>.md`: 문서별 카드. 요약, 절 목차(소제목 경로·줄 범위·분량·해시·첫 문장), 장부에 기록된 반영 지식, 관계와 교차 제안
- [`editorial/map/knowledge.md`](editorial/map/knowledge.md): 편집 장부를 뒤집은 지식 표제 역색인(표제 → 문서·절 → 처리 배치, 보류 항목). 낱말로 검색하는 용도

지도 → 후보 카드 → 해당 절 본문 순으로 읽고, 정의 변경·구조 재편·충돌·위치 불명확 시 문서 전문으로 넓힌다(WIKI_PROTOCOL §4). 지도와 카드는 후보 탐색용이며, 중복 판정은 반드시 본문을 읽고 한다. 미게시 `publish:false` 원고는 외부 탐색 색인에 노출하지 않지만 공개 GitHub 저장소 자체가 비공개인 것은 아니다.

## 교차 검색과 편집 제안 (04단계)

`node scripts/search-wiki.mjs --query "재즈 즉흥성" --json`으로 제목·절·단문의 어휘 기반 후보를 검색하고, `node scripts/search-wiki.mjs --related jazz-dialogue --all --novel --json`으로 기존 직접 링크가 없는 개념적 연결 후보를 탐색할 수 있다. `--all`은 미게시 Markdown도 포함하되 저장소 자체는 공개되어 있다는 점에 주의한다.

이 로컬 검색은 **임베딩 기반 의미 검색이 아니며**, 문자 n-gram과 기존 관계를 이용한 *후보 검색*이다. 일반 ChatGPT 채팅에서는 `AI_INDEX.md`, `wiki/manifest.json`, `editorial/crosslinks/index.json`을 읽고 모델이 전체 Markdown을 비교해 의미적 가설을 제안한다. 사람 또는 명시적인 편집 승인 전까지 `editorial/crosslinks/index.json`의 `proposed` 항목을 원고에 자동 반영하지 않는다. 자세한 사용법은 [교차 편집 지침](editorial/crosslinks/README.md) 참고.

## 웹사이트 탐색 화면

사이트는 별도 프레임워크 없이 `index.html`, `style.css`, `app.js`로 렌더링한다. 첫 화면(`/`)은 문서 인덱스로서 무작위 문서, 주제별 목록, 최근 수정 문서를 제공한다. `/#all`은 전체/검색 목록, `/#about`은 운영 안내, `/#<문서-id>`는 기존 북마크와 호환되는 본문 주소다. 문서 화면에는 본문 목차와 관련 문서, Markdown 정본 및 해당 파일의 GitHub 커밋 이력 링크가 있다. 콘텐츠 정본인 `wiki/*.md` 및 자동 생성 `notes.json`에는 영향을 주지 않는다.
