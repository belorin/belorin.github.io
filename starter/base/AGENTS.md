# AI 편집 지침

이 저장소는 {{url}} 에 게시되는 위키 「{{name}}」다. 지식을 주제별 원고로 집필하고 연결하며 갱신한다.

## 작업별 규칙

| 작업 | 읽을 문서 |
| --- | --- |
| 대화·자료의 지식을 위키에 반영 | [WIKI_PROTOCOL.md](./WIKI_PROTOCOL.md) + [GUIDE.md](./GUIDE.md) |
| 새 문서 만들기 | [GUIDE.md](./GUIDE.md)의 문서 유형 + `node scripts/new-doc.mjs --list` |
| 사이트·스크립트·워크플로 수정 | [README.md](./README.md) |

## 어떤 작업에서도 지키는 것

- 본문의 정본은 `wiki/*.md`, 메타데이터는 `wiki/manifest.json`, 의미 관계는 `wiki/relations.json`, 달력은 `wiki/calendar.json`, 사이트 설정은 `site.config.json`이다.
- 생성물은 직접 쓰지 않는다: `notes.json`, `index.html`, `robots.txt`, `AI_INDEX.md`, `ai/*`, `llms.txt`. 커밋하면 GitHub Actions가 다시 만든다.
- 대화 원문·공유 URL·API 키·토큰·개인 정보를 저장소에 넣지 않는다. 공개 저장소다.
- 사용자가 요청하지 않는 한 문서 주소 `/#문서-id`와 `.nojekyll`을 유지한다.
