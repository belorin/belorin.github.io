# {{name}}

{{url}}

{{description}}

Markdown 원고를 정본으로 두고, GitHub Actions가 사이트 데이터·AI 색인·정적 페이지를 만들어 GitHub Pages에 배포하는 위키다. 프레임워크나 npm 설치가 필요 없고 Node.js 22만 있으면 된다.

## 처음 한 번

1. 이 폴더를 GitHub 저장소 `{{owner}}/{{repo}}`로 올린다.
2. 저장소 Settings → Pages → Source를 **GitHub Actions**로 바꾼다.
3. `main`에 커밋하면 자동으로 배포된다.

## 정본과 생성물

| 파일 | 역할 |
| --- | --- |
| `wiki/*.md` | 문서 본문의 정본 |
| `wiki/manifest.json` | 문서별 제목·분류·상태·요약·게시 여부 등 메타데이터의 정본 |
| `wiki/relations.json` | 근거 절과 이유가 있는 의미 관계 |
| `wiki/calendar.json` | 달력 보기의 정본(`features.calendar`가 켜져 있을 때) |
| `site.config.json` | 사이트 이름·주소·주제 순서·첫 화면·소개·기능·문서 유형 |
| `templates/*.md` | 새 문서의 틀(`scripts/new-doc.mjs`가 사용) |
| `notes.json`, `index.html`, `robots.txt` | **생성물.** 사이트 데이터와 껍데기 |
| `AI_INDEX.md`, `ai/*`, `llms.txt` | **생성물.** 외부 AI용 공개 색인 |
| `notes/`, `sitemap.xml` | 배포 때만 만드는 정적 페이지(커밋하지 않음) |

생성물을 고치지 말고 정본을 고친 뒤 `node scripts/build.mjs`를 실행한다.

## 명령

```
node scripts/build.mjs                 # 생성물 다시 만들기
node scripts/build.mjs --check         # 검사(CI와 같음)
node scripts/build-static.mjs _site    # 정적 페이지 미리 만들기
node scripts/new-doc.mjs --list        # 문서 유형 보기
node scripts/new-doc.mjs note my-topic "새 문서 제목"
```

로컬 미리 보기: `node scripts/build-static.mjs _site` 후 저장소 폴더에서 정적 서버를 띄운다(예: `python3 -m http.server`).

## site.config.json

| 키 | 뜻 |
| --- | --- |
| `owner`, `repo`, `branch` | GitHub 저장소. 편집·이력 링크와 원문 주소에 쓴다 |
| `url` | 생략하면 `owner.github.io` 저장소는 `https://owner.github.io/`, 그 밖은 `https://owner.github.io/repo/` |
| `name`, `brand`, `brandSub`, `description`, `author`, `icon`, `footer` | 사이트 이름과 머리말, 설명, 저자, 탭 아이콘(글자 하나), 꼬리말 |
| `theme` | `accent`, `light`, `background` 색(`#rrggbb`) |
| `categories` | 주제 목록의 순서 |
| `home`, `about` | 첫 화면 제목·문구, 소개 화면 제목·문구·먼저 읽을 글 |
| `sidebarLinks` | 왼쪽 탐색에 더할 링크 `{href, label}` |
| `features.calendar` | `true`면 `/#calendar` 달력을 켠다 |
| `features.comments` | giscus 댓글. `{"repoId", "category", "categoryId"}` (giscus.app에서 확인) |
| `types` | 새 문서 유형 `{label, template, category, status}` |
| `verification` | 검색엔진 소유 확인 `{google, naver}` |

## 사이트

`index.html`·`style.css`·`app.js`로 그리는 정적 사이트다. `/`는 무작위 글과 최근 갱신, `/#all`은 전체·검색 목록, `/#about`은 소개, `/#<문서-id>`는 본문(목차·연결된 글·개정 이력·고치기)이다. 배포 때 `notes/<id>/`에 자바스크립트 없이 읽히는 정적 페이지를 만들어 검색엔진과 LLM이 읽을 수 있게 한다.
