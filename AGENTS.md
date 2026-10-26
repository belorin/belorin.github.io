# AI 편집 지침

이 저장소는 https://belorin.github.io 에 게시되는 공개 개인 위키다. 대화에서 얻은 지식을 주제별 원고로 집필하고 연결하며 갱신한다.

## 작업별 규칙

| 작업 | 읽을 문서 |
| --- | --- |
| 대화의 지식을 위키에 총합·증보 | [WIKI_PROTOCOL.md](./WIKI_PROTOCOL.md) — 증보 규칙이 모두 들어 있다 |
| 위키 전체 정비 | [WIKI_PROTOCOL.md](./WIKI_PROTOCOL.md) + [MAINTENANCE.md](./MAINTENANCE.md) |
| 기존 문서들을 엮는 종합(교차 종합·개념 길잡이·편집 비평) | [WIKI_PROTOCOL.md](./WIKI_PROTOCOL.md) + [SYNTHESIS.md](./SYNTHESIS.md) |
| 대화 속 소설 본문의 보존, 위키 소설의 이어 쓰기·고치기 | [WIKI_PROTOCOL.md](./WIKI_PROTOCOL.md) + [FICTION.md](./FICTION.md) |
| 사이트·스크립트·워크플로 수정 | [README.md](./README.md)의 파일 구성과 생성물 설명 |

## 어떤 작업에서도 지키는 것

- 본문의 정본은 `wiki/*.md`, 메타데이터의 정본은 `wiki/manifest.json`, 의미 관계의 정본은 `wiki/relations.json`, 달력의 정본은 `wiki/calendar.json`이다(정비 때만 추가).
- 생성물은 직접 쓰지 않는다: `notes.json`, `AI_INDEX.md`, `ai/*`, `llms.txt`, `editorial/map/*`, `editorial/maintenance/queue.md`. `main`에 커밋되면 GitHub Actions가 생성·검증·자동 커밋·배포한다.
- 위키 내용의 편집은 브랜치·PR 없이 `main`에 직접 커밋한다.
- 대화 원문·발췌·공유 URL·대화 ID, API 키·토큰·민감 정보를 저장소에 넣지 않는다(대화에서 나온 소설 본문을 작품으로 보존하는 것은 FICTION.md의 예외). 공개할 수 없는 내용은 제목도 기록하지 않는다.
- 사용자가 명시적으로 요청하지 않는 한 사이트 주소 `/#문서-id`와 `.nojekyll`을 유지한다.
