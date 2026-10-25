# AI 편집 지침

> **대화 지식의 총합·증보 작업:** 먼저 [WIKI_PROTOCOL.md](./WIKI_PROTOCOL.md)를 읽는다. **글을 수정할 때는 `wiki/*.md`를 고치고, `notes.json`은 직접 작성하지 않는다.** 생성물(`notes.json`, AI 색인, `llms.txt`)은 `main`에 커밋되면 GitHub Actions가 자동으로 재생성·커밋·배포하므로 직접 만들지 않는다. **브랜치·PR을 만들지 말고 `main`에 직접 커밋한다.**

이 저장소는 https://belorin.github.io 에 게시되는 공개 개인 위키다. 사용자의 대화를 주제별로 연결하고 갱신한다.

## 파일과 정본 원칙
- `wiki/*.md`: **지식 본문의 유일한 편집 정본**. 긴 논증, 출처, 사례를 요약 없이 보존한다.
- `wiki/manifest.json`: 문서 ID·제목·분류·상태·원본 출처·관련 문서·사이트 게시 여부(`publish`) 등 **메타데이터의 정본**. 본문은 복제하지 않는다.
- `wiki/relations.json`: 근거 절과 설명이 명시된 **확인된 의미 관계**의 정본. `manifest.related`는 일반 연관.
- `editorial/crosslinks/index.json`: **간접적 유비·해석적 관계의 검토 대기 제안 장부**. 제안 내용을 자동으로 본문이나 의미 관계 정본에 집필하지 않는다.
- `scripts/search-wiki.mjs`: 로컬에서 사용하는 문자 n-gram·연관 그래프 기반 후보 검색(임베딩 아님). 일반 채팅에서 실행할 수 없으면 색인과 Markdown을 읽고 AI가 의미를 비교한다.
- `scripts/validate-crosslinks.mjs` / `scripts/test-crosslinks.mjs`: 제안 근거 절과 편집 상태, 오프라인 검색 검증.
- `AI_INDEX.md`, `ai/index.json`, `ai/relations.json`, `llms.txt`: **자동 생성 AI 탐색 자료**. 외부 공개 대상은 `publish:true`만이며 생성물을 직접 수정하지 않는다.
- `scripts/build-ai-index.mjs`: 별칭·검토 상태·수정일·실제 증보일·유형별 관계와 Markdown 주소를 색인으로 생성·검증.
- `notes.json`: **생성 결과물**. 웹사이트의 기존 `app.js`에서 읽는 JSON 캐시. **직접 수정 금지**.
- `editorial/ingestions/index.json`: 신규 증보의 처리 배치 색인. 먼저 읽어 중복 작업을 확인한다.
- `editorial/ingestions/<batch-id>.json`: 공개 가능한 지식의 짧은 표제, Markdown 문서·절에 반영된 위치, 보류 항목만 기록. **대화 원문/발췌/대화 URL을 저장하지 않는다.**
- `scripts/validate-editorial.mjs`: 배치 ID, 항목, 실제 문서와 절의 존재를 검증한다.
- `scripts/build-notes.mjs`: Markdown과 메타데이터로 사이트용 JSON을 만들고 검증한다. 별도 패키지 설치 불필요.
- `index.html`, `style.css`, `app.js`: 정적 사이트 뷰어. 첫 화면은 무작위 글·주제·최근 갱신 인덱스, `/#all`은 검색 목록, `/#<문서-id>`는 목차·관련 글·개정 이력 화면이다. 본문 렌더러는 단락, `##`~`####` 소제목, 목록, 강조, 인라인 코드, 링크, Markdown 표(열 정렬·가로 스크롤)를 지원한다. 데이터의 정본은 바꾸지 않는다.

## 편집 절차
1. `AGENTS.md`, `WIKI_PROTOCOL.md`, **`AI_INDEX.md`/`ai/index.json`을 먼저 읽어 후보를 좁힌 뒤**, `wiki/manifest.json`에서 미게시 원고를 확인하고 실제 `wiki/*.md` 전문을 읽는다.
2. 사용자 발언 / AI 해석 / 대화 안의 주장 / 사실 확인 결과를 구분한다. 원본 대화에 없는 내용을 창작하지 않는다.
3. **직접 관련된 주제는 Markdown 문서에서 증보**하고, 독립 주제만 새 `.md`로 추가한다. `wiki/manifest.json`의 항목과 `related`도 함께 갱신한다. **간접적인 철학적 연관·유비는 자동 증보하지 말고 `editorial/crosslinks/index.json`에 `proposed`로 남긴다.**
4. `id`는 소문자 영문·숫자·하이픈으로 고유하게 유지한다. `related`와 사이트용 내부 링크의 대상은 실제 게시 문서여야 한다.
5. 신규 문서가 공개 사이트에 나타나야 하면 `publish:true` 및 고유한 `order`를 지정한다. 비공개 검토 원고는 `publish:false`로 둔다.
6. **새로 쓰는 문서**에서 '대화에서는', '사용자가 물었다', 'AI가 답했다' 등 원본을 소개하는 서술을 쓰지 않고, 개념·논증·사례를 독립된 저술처럼 작성한다. 출처의 처리 정보는 본문 밖 편집 장부에 기록한다. 이전 원고는 이번 변경에서 건드리지 않는다.
7. 집필 후 해당 배치의 **공개 가능한 지식 표제와 반영 문서·절, 보류 항목**을 `editorial/ingestions/`에 기록한다. 기존의 같은 배치·지식이 있으면 중복 생성하지 않는다. 실제 대화 ID를 꾸며내지 않는다.
8. 원고·manifest·관계 정본·편집 장부를 **`main`에 직접 커밋**한다. 여러 파일을 한 커밋에 쓸 수 없으면 `wiki/*.md` → `wiki/manifest.json`·`wiki/relations.json` → 편집 장부 순으로 나눠 커밋해도 된다. 생성물(`notes.json`, `AI_INDEX.md`, `ai/*`, `llms.txt`)은 쓰지 않는다. `.github/workflows/deploy-pages.yml`이 매 커밋마다 생성·검증한 뒤 생성물을 `main`에 자동 커밋하고 사이트를 배포한다. 검증이 실패하면 배포되지 않고 직전 사이트가 유지되므로, 결과는 저장소의 Actions 탭에서 확인한다. 로컬에서 Node를 실행할 수 있다면 커밋 전에 `node scripts/build-notes.mjs` → `node scripts/build-ai-index.mjs` → `node scripts/validate-editorial.mjs` → `node scripts/validate-crosslinks.mjs` → `node scripts/test-crosslinks.mjs`로 미리 확인할 수 있다.
9. 사용자가 명시적으로 요청하지 않는 한 사이트의 기존 해시 URL(`/#문서-id`)와 `.nojekyll`을 유지한다. 게시는 GitHub Actions 배포(Pages Source: GitHub Actions)로 한다.
10. API 키, 토큰, 민감 정보, 원문 대화 전문·발화 인용·공유 URL·대화 ID를 공개 저장소에 넣지 않는다. 비공개 내용은 제목조차 기록하지 않고 필요하면 비공개 처리 개수만 남긴다.

## 서술 목적
대화 자체에 대한 해설이 아니라, 대화에서 얻은 **사실·개념을 독립적인 상세 지식 문서**로 쓴다. 외부 조사가 금지된 대화 총합 작업에서는 GitHub의 기존 원고와 해당 대화만 사용한다. 구체적인 설명·반례·목록·정밀한 개념 구분을 상투적인 요약으로 축약하지 않는다.

## 색인 필드의 의미

- `aliases`: 검색할 때 사용할 검토된 별칭. 새로운 별칭은 `wiki/manifest.json`에 기입한다.
- `updated`: 현재 기록된 수정일. `last_enriched_on`: 앞으로 확인된 실제 지식 증보일. 확인할 수 없는 구간의 날짜는 `null`로 보존한다.
- `review_state`: `unassessed`, `needs_review`, `reviewed` 중 하나. 기존 `status` 문장은 별도로 유지된다.
- `wiki/relations.json`: 일반 연관과 달리 유형·근거 절·설명을 갖춘 관계를 기록한다.
- `publish:false` Markdown은 자동 공개 색인에서 제외한다. 단 공개 GitHub 저장소의 접근 제한을 제공하는 것은 아니다.

## 직접 집필과 간접 제안의 구분
- 의미 검색 점수는 사실 확인이 아니다. 새로운 연결은 후보를 찾은 다음 양쪽 Markdown의 원문과 반론을 읽어 판단한다.
- 일반 채팅에서 GitHub 도구로 로컬 Node 명령을 실행할 수 없다면 `ai/index.json`·`wiki/manifest.json`으로 후보를 찾고 Markdown을 직접 읽어 의미적 재평가를 수행한다.
- 독립적인 주제에 대한 직접 증보는 기존 규칙으로 집필한다. **간접 유비나 철학적 비교는 원고와 `wiki/relations.json`을 자동 수정하지 않고 검토 대장에만 `proposed` 상태로 등록한다.**
- `approved`는 집필 완료가 아니며 `integrated`는 실제 수정과 검수 후에만 사용한다.

## 이행 주의
현재 사이트의 23개 공개 노트는 해당하는 Markdown 원고에서 생성한다. 일부 과거에 존재하던 Markdown은 `publish:false`로 두어 기존 웹사이트의 표시 상태를 유지했다. 게시 여부 변경은 별도 편집 결정이다. Markdown 본문과 생성 결과를 별도로 고치면 분기가 발생하므로 금지한다.
