# 증보 이력 관리: 원문 없는 편집 장부

이 디렉터리는 **원본 대화 아카이브가 아니다.** 누적형 지식백과에 추가된 **공개 가능한 지식 항목**과 각 항목이 편집된 Markdown 문서·절을 찾기 위한 탐색 목록이다.

## 파일

- `ingestions/index.json`: 이미 등록된 배치 ID의 **첫 번째 탐색 지점**. 새 대화가 들어오면 이 파일로 기존 처리 내역부터 확인한다.
- `ingestions/<batch-id>.json`: 한 편집 작업에서 인식한 지식 항목의 표제 및 반영 위치. 원본 대화 전문·발췌문·대화 URL·발화 위치·참가자 정보는 기록하지 않는다.
- `../scripts/validate-editorial.mjs`: 모든 배치와 대상 절을 검사한다.

## 배치 형식

아래는 구조를 설명하는 **가상의 예시**이며 실제 처리 기록이 아니다.

```json
{
  "id": "ing-20261023-sample",
  "processed_on": "2026-10-23",
  "coverage": "visible-partial",
  "limit_note": "접근 가능한 일부 내용만 처리함",
  "withheld_count": 0,
  "items": [
    {
      "id": "k01",
      "kind": "concept",
      "title": "특정 개념의 성립 조건과 반례",
      "status": "integrated",
      "targets": [
        { "doc_id": "문서의-실제-id", "section": "Markdown에 실제로 존재하는 소제목" }
      ]
    },
    {
      "id": "k02",
      "kind": "curation",
      "title": "선정 이유가 있는 독립적 청취 목록",
      "status": "pending",
      "targets": [],
      "reason": "기존 원고의 대응 절 확인 필요"
    }
  ]
}
```

실제 사용 때 문서 ID와 절 제목은 `wiki/manifest.json` 및 Markdown 본문과 일치해야 하며, `status:integrated`에는 하나 이상의 실제 대상 절이 필수다. `status:pending`에는 목표 위치를 사실처럼 기입하지 않고 `reason`으로 미완 사유를 짧게 적는다.

### 각 필드의 의미

- `id`: **위키에서 자체 부여한 배치 ID**, ChatGPT가 제공한 대화 ID가 아니다. `ing-YYYYMMDD-slug` 형식을 사용한다.
- `processed_on`: 실제 편집 작업을 수행한 날짜.
- `coverage`: `visible-complete`(읽을 수 있었던 범위 전수 검토), `visible-partial`(일부 접근·처리), `uncertain`(범위 불명확). 어떤 값도 실제 대화 전체를 무조건 보았다는 보증은 아니다.
- `limit_note`: 공개해도 안전한 처리 한계 설명만 선택적으로 쓴다.
- `withheld_count`: 공개하기 어려워 기록하지 않은 항목의 **개수만**. 항목명 자체를 넣지 않는다.
- `items`: 비식별 지식 표제 및 처리 상태. `kind`: `concept`, `fact`, `argument`, `counterargument`, `example`, `curation`, `question`, `other`.
- `status`: `integrated` 또는 `pending`. 관련 본문을 **실제로** 수정하거나 반영 위치를 확인한 후에만 `integrated`를 사용한다.
- `targets`: 정확한 문서 ID(`doc_id`)와 Markdown의 실제 제목(`section`)을 입력한다. `section`은 목차의 제목 전체를 사용하고 자동 생성된 앵커를 추측하지 않는다.
- `reason`: 보류 사유 등 짧은 편집 메모. 원본을 인용하지 않는다.

## 후속 대화 및 중복 방지

1. **항상 index를 먼저 읽는다.** 관련 배치의 제목·지식 항목·대상 문서를 비교하고 재집필 대신 증보한다.
2. 같은 대화의 후속 내용으로 식별할 만한 내부 기록이 있다면 기존 배치를 갱신한다. 식별할 수 없다면 새로운 배치 ID를 사용하되 문서·지식 자체의 중복을 먼저 확인한다.
3. `integrated`로 기록한 모든 항목은 실제 Markdown의 정확한 제목에 매핑한다. 기존 본문에서 제거되거나 제목이 바뀌었다면 장부도 함께 갱신한다.
4. `pending` 항목은 다음 작업에서 검토한다. 해결되면 `integrated`와 실제 대상을 기록한다.
5. 원본에 접근할 수 없게 되었다면 이를 인정한다. **비식별 장부만으로 원본의 모든 논증이 보존되었다고 보장할 수는 없다.**
6. 실수로 원문 또는 민감 자료가 공개 커밋에 실렸다면 파일만 삭제하는 것으로 과거 커밋에서 사라지지 않는다. 즉시 공개 범위를 점검하고 Git 이력 정리를 별도 검토한다.

## 집필 문체

편집 위치 기록과 본문을 분리한다. **앞으로 작성할 Markdown 본문**은 '대화에서는', '사용자가 물었다', 'AI가 답변했다'라는 표현 대신 처음부터 끝까지 독립적인 해설·논증·큐레이션으로 집필한다. 이 규칙은 이미 작성된 원고를 이번 단계에서 재작성하라는 뜻이 아니다.

## 검증

```sh
node scripts/validate-editorial.mjs
```

필요한 경우 `--report`를 붙여 각 보류 항목을 출력한다. 검사 프로그램은 **형식, 중복, 실제 대상 문서·절 존재, 허용되지 않은 원본 필드와 URL 입력**을 확인하지만, 개인정보를 100% 탐지하거나 실제 논증의 보존율을 판정할 수 없다. 따라서 커밋 전에 내용의 공개 적합성을 반드시 사람이 검토한다.

검증기 동작의 가상 입력 테스트: `node scripts/test-editorial.mjs` (실제 대화 데이터 없음).
