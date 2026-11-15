# 취향 탐험

`index.html`을 내려받아 브라우저에서 연다. 네트워크 없이 다섯 판본을 전환할 수 있다. `versions/*.html`도 각각 독립 실행된다. 공개 실행 호스팅은 배포하지 않았다. GitHub 소스 URL은 실행 URL이 아니다.

- A1 → A2 → A3: 조형 변형의 비가환 합성, 후보 전시 선택, 분기 예산.
- H1 → H2: 경험 순서, 동일 작품의 짝 경로, C를 통한 도달 가능성 확장.
- 원문: `../../wiki/`가 아니라 저장소 루트의 `wiki/taste-calculator-{foundations,style-algebra,adapter}.md`, `wiki/mathematical-theory-of-taste.md`.
- 출발 커밋: `2ae994bd3925556ceb21a4b41cf5ba1348889484`. 기존 `/taste-lab/index.html` 변경 없음.
- `OBSERVATIONS.md`: 실패·관찰·다음 질문. `versions.json`: 판본과 커밋, SHA-256. 스냅샷은 덮어쓰지 않는다.

## 개발과 검증

새 판본은 `python taste-lab/expeditions/src/build.py algebra-v4`처럼 새 이름으로 만든다. 기존 이름이면 빌드가 중단된다. 소스 수정은 과거 실행판에 전파되지 않는다. 탐험 지도는 `src/build-index.py`의 버전 목록에 새 커밋을 추가한 뒤 재생성한다.

Node와 jsdom이 있는 환경에서 `node taste-lab/expeditions/test.cjs`. 별도 설치 위치는 `JSDOM_PATH=/path/to/node_modules/jsdom`으로 지정한다. 테스트는 모형과 DOM 동작의 검증이며 브라우저 레이아웃 검증이 아니다. 외부 의존성은 테스트에만 필요하며 사용자 실행 파일에는 없다.

감상 기록은 메모리에만 있다. 사용자가 보관 버튼으로 JSON과 원본 SVG를 내보낸다. 서버로 전송하지 않는다. 판본 전환 전에 보관해야 한다. 기록의 재가져오기 기능은 아직 없다.
