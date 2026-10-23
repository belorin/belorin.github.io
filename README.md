# belorin · 열린 노트

https://belorin.github.io

대화에서 시작해 계속 고쳐 쓰는 공개 개인 위키. 기존 GitHub Pages 정적 UI를 유지합니다.

## 정본과 생성물

- **`wiki/*.md`**: 지식 본문의 유일한 정본
- **`wiki/manifest.json`**: 문서별 메타데이터와 게시 여부의 정본
- **`wiki/relations.json`**: 근거와 유형이 확인된 관계의 정본
- **`AI_INDEX.md`, `ai/index.json`, `ai/relations.json`, `llms.txt`**: 자동 생성되는 AI 탐색 자료
- **`notes.json`**: 위 두 정본으로부터 생성하는 웹사이트 데이터 (**직접 수정하지 않음**)
- **`AGENTS.md` / `WIKI_PROTOCOL.md`**: AI 편집 규칙
- **`editorial/ingestions/`**: 직접 증보의 위치와 보류 상태를 기록하는 편집 장부 (대화 원문 없음)
- **`editorial/crosslinks/index.json`**: 직접 입증되지 않은 개념적 유비·교차 편집 제안 장부. 자동 집필 대상이 아님.

## 편집·게시

1. 해당 `wiki/<문서-id>.md`를 편집한다. 새 글이면 `wiki/manifest.json`에 등록한다.
2. 별칭·검토 상태·증보일은 `wiki/manifest.json`, 의미 관계는 `wiki/relations.json`에 기록한다.
3. `node scripts/build-notes.mjs`와 `node scripts/build-ai-index.mjs`를 실행한다.
4. 대화에서 신규 지식을 반영했다면 `editorial/ingestions/index.json`과 해당 배치 JSON에 **짧은 지식 표제, 반영 문서의 정확한 절, 미완 항목**을 기록한다. 원문은 저장하지 않는다.
5. 두 생성기의 `--check`, `node scripts/validate-editorial.mjs`, `node scripts/validate-crosslinks.mjs`, `node scripts/test-crosslinks.mjs`로 확인한다.
6. 수정한 Markdown·manifest·관계 정본·생성된 JSON과 색인·편집 장부를 **같은 커밋**으로 `main`에 올린다.

별도 npm 설치는 필요하지 않다. GitHub Actions가 누락된 빌드를 검증한다. `notes.json`을 편집하는 대신 반드시 Markdown을 수정한다.

현재 공개 페이지 주소는 기존과 같이 `/#문서-id`이다. `publish:false` 원고는 GitHub에서 Markdown으로는 확인 가능하지만 사이트 목록에는 나오지 않는다.

기존 GitHub Pages 배포 방식을 바꾸지 않았으므로 자동 커밋 봇을 두지 않는다. GitHub Actions의 `GITHUB_TOKEN`으로 생성한 후속 커밋이 기존 Pages 빌드를 항상 촉발하는 것은 아니므로, 생성된 JSON을 **동일한 원고 수정 커밋에 포함하는 것**이 현재의 안전한 게시 방식이다.

## 향후 원고의 문체

새로 집필·증보하는 원고는 독립적인 서적 문장으로 쓴다. '대화에서는', '사용자가 질문했고', 'AI가 설명했다'처럼 출처를 회고하는 문장을 사용하지 않는다. 이전 원고의 문장은 이번 단계에서 소급 수정하지 않는다. 편집 장부에는 대화 내용 대신 공개 가능한 지식 표제와 반영된 위치만 남긴다.

## AI 탐색

- [`AI_INDEX.md`](AI_INDEX.md): 공개 문서의 제목, 별칭, 검토 상태, 원고 링크를 탐색
- [`ai/index.json`](ai/index.json): 기계용 문서 ID·별칭·수정일·증보일·검토 상태와 직접 Markdown 주소
- [`ai/relations.json`](ai/relations.json): 단순 관련성과 근거 기반 의미 관계
- [`llms.txt`](llms.txt): 외부 AI가 사용할 수 있는 선택적 진입점

색인에서 후보를 좁힌 뒤 **Markdown 정본 전체를 읽어야** 본문의 세부 설명과 반론을 보존할 수 있다. 미게시 `publish:false` 원고는 외부 탐색 색인에 노출하지 않지만 공개 GitHub 저장소 자체가 비공개인 것은 아니다.

## 교차 검색과 편집 제안 (04단계)

`node scripts/search-wiki.mjs --query "재즈 즉흥성" --json`으로 제목·절·단문의 어휘 기반 후보를 검색하고, `node scripts/search-wiki.mjs --related jazz-dialogue --all --novel --json`으로 기존 직접 링크가 없는 개념적 연결 후보를 탐색할 수 있다. `--all`은 미게시 Markdown도 포함하되 저장소 자체는 공개되어 있다는 점에 주의한다.

이 로컬 검색은 **임베딩 기반 의미 검색이 아니며**, 문자 n-gram과 기존 관계를 이용한 *후보 검색*이다. 일반 ChatGPT 채팅에서는 `AI_INDEX.md`, `wiki/manifest.json`, `editorial/crosslinks/index.json`을 읽고 모델이 전체 Markdown을 비교해 의미적 가설을 제안한다. 사람 또는 명시적인 편집 승인 전까지 `editorial/crosslinks/index.json`의 `proposed` 항목을 원고에 자동 반영하지 않는다. 자세한 사용법은 [교차 편집 지침](editorial/crosslinks/README.md) 참고.
