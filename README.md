# belorin · 열린 노트

https://belorin.github.io

대화에서 시작해 계속 고쳐 쓰는 공개 개인 위키. 기존 GitHub Pages 정적 UI를 유지합니다.

## 정본과 생성물

- **`wiki/*.md`**: 지식 본문의 유일한 정본
- **`wiki/manifest.json`**: 문서별 메타데이터와 게시 여부의 정본
- **`notes.json`**: 위 두 정본으로부터 생성하는 웹사이트 데이터 (**직접 수정하지 않음**)
- **`AGENTS.md` / `WIKI_PROTOCOL.md`**: AI 편집 규칙
- **`editorial/ingestions/`**: 공개 가능한 추출 지식의 반영 위치와 보류 상태를 기록하는 편집 장부 (대화 원문 없음)

## 편집·게시

1. 해당 `wiki/<문서-id>.md`를 편집한다. 새 글이면 `wiki/manifest.json`에 등록한다.
2. `node scripts/build-notes.mjs`을 실행한다.
3. 대화에서 신규 지식을 반영했다면 `editorial/ingestions/index.json`과 해당 배치 JSON에 **짧은 지식 표제, 반영 문서의 정확한 절, 미완 항목**을 기록한다. 원문은 저장하지 않는다.
4. `node scripts/build-notes.mjs --check`와 `node scripts/validate-editorial.mjs`로 확인한다.
5. 수정한 Markdown과 manifest, 생성된 `notes.json`, 편집 장부를 **같은 커밋**으로 `main`에 올린다.

별도 npm 설치는 필요하지 않다. GitHub Actions가 누락된 빌드를 검증한다. `notes.json`을 편집하는 대신 반드시 Markdown을 수정한다.

현재 공개 페이지 주소는 기존과 같이 `/#문서-id`이다. `publish:false` 원고는 GitHub에서 Markdown으로는 확인 가능하지만 사이트 목록에는 나오지 않는다.

기존 GitHub Pages 배포 방식을 바꾸지 않았으므로 자동 커밋 봇을 두지 않는다. GitHub Actions의 `GITHUB_TOKEN`으로 생성한 후속 커밋이 기존 Pages 빌드를 항상 촉발하는 것은 아니므로, 생성된 JSON을 **동일한 원고 수정 커밋에 포함하는 것**이 현재의 안전한 게시 방식이다.

## 향후 원고의 문체

새로 집필·증보하는 원고는 독립적인 서적 문장으로 쓴다. '대화에서는', '사용자가 질문했고', 'AI가 설명했다'처럼 출처를 회고하는 문장을 사용하지 않는다. 이전 원고의 문장은 이번 단계에서 소급 수정하지 않는다. 편집 장부에는 대화 내용 대신 공개 가능한 지식 표제와 반영된 위치만 남긴다.
