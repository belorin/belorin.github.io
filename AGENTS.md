# AI 편집 지침

> **대화 지식의 총합·증보 작업:** 먼저 [WIKI_PROTOCOL.md](./WIKI_PROTOCOL.md)를 읽는다. **글을 수정할 때는 `wiki/*.md`를 고치고, `notes.json`은 직접 작성하지 않는다.** 마지막에 `node scripts/build-notes.mjs`를 실행해 함께 커밋한다.

이 저장소는 https://belorin.github.io 에 게시되는 공개 개인 위키다. 사용자의 대화를 주제별로 연결하고 갱신한다.

## 파일과 정본 원칙
- `wiki/*.md`: **지식 본문의 유일한 편집 정본**. 긴 논증, 출처, 사례를 요약 없이 보존한다.
- `wiki/manifest.json`: 문서 ID·제목·분류·상태·원본 출처·관련 문서·사이트 게시 여부(`publish`) 등 **메타데이터의 정본**. 본문은 복제하지 않는다.
- `notes.json`: **생성 결과물**. 웹사이트의 기존 `app.js`에서 읽는 JSON 캐시. **직접 수정 금지**.
- `editorial/ingestions/index.json`: 신규 증보의 처리 배치 색인. 먼저 읽어 중복 작업을 확인한다.
- `editorial/ingestions/<batch-id>.json`: 공개 가능한 지식의 짧은 표제, Markdown 문서·절에 반영된 위치, 보류 항목만 기록. **대화 원문/발췌/대화 URL을 저장하지 않는다.**
- `scripts/validate-editorial.mjs`: 배치 ID, 항목, 실제 문서와 절의 존재를 검증한다.
- `scripts/build-notes.mjs`: Markdown과 메타데이터로 사이트용 JSON을 만들고 검증한다. 별도 패키지 설치 불필요.
- `index.html`, `style.css`, `app.js`: 현재 정적 사이트. 사이트 `body`는 단락, `##` 소제목, `- ` 목록, `[이름](#문서-id)`, https 링크만 지원한다.

## 편집 절차
1. `AGENTS.md`, `WIKI_PROTOCOL.md`, `wiki/manifest.json`을 먼저 읽고 관련 `wiki/*.md`를 확인한다.
2. 사용자 발언 / AI 해석 / 대화 안의 주장 / 사실 확인 결과를 구분한다. 원본 대화에 없는 내용을 창작하지 않는다.
3. **기존 주제는 Markdown 문서에서 증보**하고, 새로운 독립 주제만 새 `.md`로 추가한다. `wiki/manifest.json`의 항목과 `related`도 함께 갱신한다.
4. `id`는 소문자 영문·숫자·하이픈으로 고유하게 유지한다. `related`와 사이트용 내부 링크의 대상은 실제 게시 문서여야 한다.
5. 신규 문서가 공개 사이트에 나타나야 하면 `publish:true` 및 고유한 `order`를 지정한다. 비공개 검토 원고는 `publish:false`로 둔다.
6. **새로 쓰는 문서**에서 '대화에서는', '사용자가 물었다', 'AI가 답했다' 등 원본을 소개하는 서술을 쓰지 않고, 개념·논증·사례를 독립된 저술처럼 작성한다. 출처의 처리 정보는 본문 밖 편집 장부에 기록한다. 이전 원고는 이번 변경에서 건드리지 않는다.
7. 집필 후 해당 배치의 **공개 가능한 지식 표제와 반영 문서·절, 보류 항목**을 `editorial/ingestions/`에 기록한다. 기존의 같은 배치·지식이 있으면 중복 생성하지 않는다. 실제 대화 ID를 꾸며내지 않는다.
8. **`node scripts/build-notes.mjs`** → **`node scripts/build-notes.mjs --check`** → **`node scripts/validate-editorial.mjs`** 검증 → Markdown·manifest·생성된 `notes.json`·편집 장부를 **같은 커밋**으로 반영한다. CI는 동기화 오류만 검증하며 자동으로 게시물을 수정하지 않는다.
9. 사용자가 명시적으로 요청하지 않는 한 사이트의 기존 해시 URL(`/#문서-id`), GitHub Pages 브랜치 배포, `.nojekyll`을 유지한다.
10. API 키, 토큰, 민감 정보, 원문 대화 전문·발화 인용·공유 URL·대화 ID를 공개 저장소에 넣지 않는다. 비공개 내용은 제목조차 기록하지 않고 필요하면 비공개 처리 개수만 남긴다.

## 서술 목적
대화 자체에 대한 해설이 아니라, 대화에서 얻은 **사실·개념을 독립적인 상세 지식 문서**로 쓴다. 외부 조사가 금지된 대화 총합 작업에서는 GitHub의 기존 원고와 해당 대화만 사용한다. 구체적인 설명·반례·목록·정밀한 개념 구분을 상투적인 요약으로 축약하지 않는다.

## 이행 주의
현재 사이트의 23개 공개 노트는 해당하는 Markdown 원고에서 생성한다. 일부 과거에 존재하던 Markdown은 `publish:false`로 두어 기존 웹사이트의 표시 상태를 유지했다. 게시 여부 변경은 별도 편집 결정이다. Markdown 본문과 생성 결과를 별도로 고치면 분기가 발생하므로 금지한다.
