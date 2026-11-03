# 이 위키를 편집하는 방법

> 원고는 Markdown으로 쓰고, 메타데이터는 manifest에 기록하며, 나머지는 자동으로 만들어진다.

## 새 문서 만들기

로컬에서는 `node scripts/new-doc.mjs <유형> <문서-id> "<제목>"`으로 틀을 갖춘 새 문서를 만든다. 유형 목록은 `node scripts/new-doc.mjs --list`로 본다. 새 문서는 미게시(`publish: false`)로 시작한다. 본문을 쓰고 manifest에서 요약을 채운 뒤 `publish: true`로 바꾼다.

GitHub 웹에서 바로 편집할 수도 있다. `wiki/` 폴더에 파일을 만들고 `wiki/manifest.json`에 항목을 추가한다.

## 쓰는 규칙

- 파일 첫 줄은 `# 제목`, 그다음 빈 줄이다.
- 소제목은 `##`부터 `####`까지 쓴다. 표, 목록, 인용, 굵게, 기울임, 인라인 코드, 링크를 쓸 수 있다.
- 다른 문서로 가는 링크는 `[글 제목](./문서-id.md)` 형식으로 쓴다. 없는 문서나 미게시 문서로 링크하면 빌드가 실패한다.
- 문서 ID는 영문 소문자, 숫자, 하이픈만 쓴다.

## 게시

`main`에 커밋하면 GitHub Actions가 사이트 데이터와 AI 색인을 만들고 검사한 뒤 사이트를 배포한다. 검사에 실패하면 이전 사이트가 그대로 남는다. 로컬에서는 `node scripts/build.mjs`로 미리 만들고 `node scripts/build.mjs --check`로 검사한다.
