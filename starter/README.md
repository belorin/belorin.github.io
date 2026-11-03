# 위키 키트: 기본형과 파생 위키

이 폴더는 belorin 열린 노트의 **형식만** 떼어 낸 위키 키트다. 내용(문서·편집 장부·종합·소설·AI의 글)은 가져가지 않고, 다음 골격만 담았다.

- Markdown 원고 + `manifest.json` 메타데이터 + `relations.json` 근거 관계라는 정본 구조
- 프레임워크 없는 정적 뷰어(검색·주제·목차·연결된 글·개정 이력·고치기·무작위 글)
- 자바스크립트 없이 읽히는 정적 문서 페이지와 사이트맵, 외부 AI용 색인(`AI_INDEX.md`, `ai/*.json`, `llms.txt`)
- `main`에 커밋하면 생성·검사·자동 커밋·배포하는 GitHub Actions
- 선택 기능: 연대·절기 달력, giscus 댓글
- AI 편집자를 위한 `AGENTS.md`와 간결한 `WIKI_PROTOCOL.md`

이 사이트의 배포에는 포함되지 않는다(`deploy-pages.yml`이 `starter/`를 제외한다).

## 구조

```
starter/
  create-wiki.mjs     기본형 + 프리셋 → 새 위키 저장소 생성
  test-starter.mjs    기본형과 모든 프리셋을 생성해 빌드·검사
  base/               기본형 위키(그 자체로 완결된 저장소 골격)
  presets/<이름>/     용도별 파생: preset.json + files/(base 위에 덮어쓸 파일)
```

기본형에서 사이트마다 달라지는 값(소유자·저장소·주소·이름·주제 순서·첫 화면·소개·기능·문서 유형·색)은 모두 `site.config.json` 하나에 있다. 스크립트와 뷰어는 이 파일만 읽는다. `index.html`·`robots.txt`도 이 설정에서 생성되므로 이름을 바꾸려면 설정만 고친다. 사용자 사이트(`<id>.github.io`)와 프로젝트 사이트(`<id>.github.io/<repo>/`)를 모두 지원한다.

## 만들기

```
node starter/create-wiki.mjs --list
node starter/create-wiki.mjs --out ../my-wiki --owner <GitHub-id>                        # 기본형
node starter/create-wiki.mjs --out ../books --owner <id> --repo books --preset reading   # 독서 노트
node starter/create-wiki.mjs --out ../lab --owner <id> --repo lab --preset research,timeline --name "연구 노트"
```

만든 폴더를 GitHub 저장소로 올리고 Settings → Pages → Source를 **GitHub Actions**로 바꾸면 배포된다. 이후 사용법은 생성된 위키의 `README.md`에 있다.

## 프리셋

| 이름 | 용도 | 문서 유형 | 특징 |
| --- | --- | --- | --- |
| (없음) | 기본형 | 일반 문서·목록·열린 질문 | 범용 |
| `reading` | 독서 노트 | 책 노트·저자·주제·읽을 목록·질문 | 짧은 인용과 쪽수, 책끼리의 대조 관계 |
| `research` | 연구 노트 | 개념·문헌 노트·질문·방법·목록 | 근거의 종류 표시, `supports`/`challenges` 관계 |
| `team` | 팀 지식베이스 | 결정 기록(ADR)·절차·용어·프로젝트·질문 | 결정은 고치지 않고 대체, 공개 범위 경고 |
| `learning` | 학습 노트 | 과목·개념·문제 풀이·복습 질문 | 틀린 이유 기록, 상태로 이해도 표시 |
| `worldbuilding` | 세계관 설정집 | 인물·장소·세력·사건·사물/개념·미정 설정 | 달력(연대표) 켜짐, 정본/초안/미정/폐기 |
| `timeline` | 겹쳐 쓰는 프리셋 | — | 다른 프리셋 뒤에 붙여 달력을 켬 |

프리셋은 쉼표로 이어 순서대로 겹칠 수 있다(`--preset research,timeline`).

## 새 프리셋 만들기

`presets/<이름>/preset.json`과 선택적인 `presets/<이름>/files/`를 만든다.

```json
{
  "label": "여행 기록",
  "description": "목록에 보일 한 줄 설명",
  "config": {
    "name": "여행 기록",
    "categories": ["안내", "장소", "여정"],
    "theme": { "accent": "#1f6f8b", "light": "#e7f2f6" },
    "types": {
      "note": null,
      "place": { "label": "장소", "template": "templates/place.md", "category": "장소", "status": "초고" }
    }
  },
  "removeDocuments": [],
  "documents": [],
  "relations": [],
  "calendar": []
}
```

- `config`는 `site.config.json`에 합쳐진다. 객체는 합쳐지고, 배열과 값은 바뀌며, `null`은 그 키를 지운다(위 예에서 기본형의 `note` 유형 삭제).
- `files/`는 base 위에 그대로 복사된다. 보통 `GUIDE.md`(용도별 편집 지침), `templates/*.md`(문서 틀), `wiki/*.md`(안내 문서)를 둔다. 같은 이름이면 base 파일을 대체한다.
- `documents`의 manifest 항목은 같은 ID면 대체, 아니면 추가된다. 제목은 항상 해당 파일의 `# 제목`을 따른다.
- 복사된 Markdown·JSON의 `{{name}}`, `{{owner}}`, `{{repo}}`, `{{url}}`, `{{description}}`, `{{author}}`, `{{today}}`는 생성할 때 채워진다. `templates/`의 `{{title}}`, `{{date}}`는 `scripts/new-doc.mjs`가 새 문서를 만들 때 채운다.
- 추가 후 `node starter/test-starter.mjs`로 모든 프리셋이 생성·빌드·검사를 통과하는지 확인한다.

## 기본형을 고칠 때

기본형의 엔진(`base/app.js`, `base/scripts/*`)은 belorin 사이트의 엔진을 일반화한 것이다. 이 사이트의 엔진을 개선하면 필요한 부분을 기본형에도 옮긴다. 두 엔진은 자동으로 동기화되지 않는다. 기본형에서 뺀 것: 종합·소설·AI의 글 같은 특수 문서 종류, 편집 장부(`editorial/`), 편집 지도, 정비 대기열, 교차 제안, 오프라인 검색.
