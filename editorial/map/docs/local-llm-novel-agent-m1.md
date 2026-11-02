# 출근 전에 켜두는 로컬 소설 제작기: M1 16GB의 Ollama·MLX와 이어쓰기의 조건

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `local-llm-novel-agent-m1` · 분류: 기술·지식 아카이브 · 공개 · 원고: [wiki/local-llm-novel-agent-m1.md](../../../wiki/local-llm-novel-agent-m1.md) · 7,948자 · 절 9개
- 별칭: 로컬 소설 에이전트, 소설 자동생성 파이프라인, M1 로컬 LLM 에이전시, Ollama MLX 소설 자동화
- 요약: M1 16GB의 Ollama와 MLX를 오가며 기획·초안·비평·수정·요약을 파일로 분리한 소설 자동화 실험, 실제 오류와 가상환경 문제, 작품별 외부 기억과 재개 설계의 한계를 다룬다.
- 태그: Ollama, MLX, Qwen3, Devstral, M1 16GB, 소설 자동화, Python, 백엔드 전환, 체크포인트, 이어쓰기
- 수정일: 2026-11-02 · 실제 증보일: 2026-11-02 · 검토: needs_review
- 관련 문서: `book-translation-pipeline-local-llm`, `gpt-wiki-zero-prototype`, `stump-and-dream-fragment`, `edge-vision-event-monitor-portfolio`

## 절 목차

들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) · L2–5 · 438자 · `002f631f` — 아침에 작업을 걸어 놓고 저녁에 결과를 받으려면, 언어모델에게 여덟 시간 동안 계속 “좋은 소설을 써 달라”고 말하는 것만으로는 부족하다.
- 로컬 에이전시와 장시간 배치 작업은 어디서 갈라지는가 · L7–13 · 634자 · `6a7fed1a` — 범용 에이전트는 다음 행동을 스스로 선택하고 도구를 활용하며 계획을 바꿀 수 있다.
- M1 16GB: 디스크 여유와 메모리 여유는 다르다 · L15–21 · 723자 · `c87f5dd8` — Ollama는 앱과 로컬 서버, CLI가 함께 작동한다.
- Ollama에서 MLX로: 호출부를 분리하면 파이프라인을 살릴 수 있다 · L23–29 · 866자 · `4c5aeb16` — Ollama는 HTTP API 서버이고, MLX는 Apple Silicon에 특화된 머신러닝 프레임워크이며, mlx-lm은 그 위에서 언어모델을 실행하는 패키지다.
  - 가상환경·모델 형식: 실동작을 막은 두 오류 · L31–35 · 648자 · `2a5d0061` — mlx와 mlx-lm을 ~/mlx-test/.venv에 설치한 뒤 시스템 python3로 main.py를 실행하자 ModuleNotFoundError: No mo…
- 파일에 남는 다섯 공정과 두 종류의 기억 · L37–43 · 935자 · `7c984155` — 첫 구조는 input.txt에서 소설의 방향을 받아 story_bible.md, characters.md, outline.md를 만든 다음, chapters/ch…
- 단일 실행에서 작품별 이어쓰기까지 · L45–57 · 1,811자 · `ad0b4647` — 한 작품의 기존 결과를 지우지 않고 새 실행에서 계속 쌓는 문제는 단순히 회차 수를 늘리는 것으로 해결되지 않는다.
- 진행 표시·잠자기·복구의 실무 조건 · L59–65 · 794자 · `269f607f` — LLM 호출에서 stream: false로 응답 전체를 기다리면 “초안 생성 시작” 이후 터미널이 오랫동안 조용하다.
- 검증된 완주와 아직 시험되지 않은 자동화 · L67–73 · 544자 · `88e991ce` — 확인 가능한 터미널 출력에는 MLX Qwen3-4B-4bit 모델 하나로 1화와 2화 각각 초안 → 비평 → 수정본 → 요약을 호출하고 “작업 완료”를 출력한 사례가 있다.
- 관련 문서 · L75–80 · 231자 · `c1876602` — 오래된 영어책 한 권을 끝까지 번역하려면

## 장부에 기록된 반영 지식

- **로컬 에이전시와 장시간 배치 작업은 어디서 갈라지는가**
  - 장시간 자율 소설 생성과 단계형 배치 작업의 구별 · `ing-20261102-local-novel-edge-portfolio`
- **M1 16GB: 디스크 여유와 메모리 여유는 다르다**
  - M1 16GB에서 디스크 여유와 메모리 압박의 차이 · `ing-20261102-local-novel-edge-portfolio`
- **Ollama에서 MLX로: 호출부를 분리하면 파이프라인을 살릴 수 있다**
  - Ollama API와 MLX 파이썬 호출부의 분리 · `ing-20261102-local-novel-edge-portfolio`
- **가상환경·모델 형식: 실동작을 막은 두 오류**
  - MLX 가상환경 불일치와 Qwen3.5 모델 아키텍처 오류 · `ing-20261102-local-novel-edge-portfolio`
- **파일에 남는 다섯 공정과 두 종류의 기억**
  - 소설의 초안·비평·최종본과 다음 회차 요약의 역할 · `ing-20261102-local-novel-edge-portfolio`
  - 외부 기억에서 요약 손실과 확정 설정의 차이 · `ing-20261102-local-novel-edge-portfolio`
- **단일 실행에서 작품별 이어쓰기까지**
  - 키워드 프로젝트 구분과 이어쓰기·원문 참조의 수정 필요 · `ing-20261102-local-novel-edge-portfolio`
  - 입력 첫 줄이 장르일 때 잘못 지정된 프로젝트 키 · `ing-20261102-local-novel-edge-portfolio`
  - 문학 원문 입력과 파이썬 문자열·EOL 오류 가설의 분리 · `ing-20261102-local-novel-edge-portfolio`
  - 아웃라인 추출 실패 시 고정 장면으로 대체되는 위험 · `ing-20261102-local-novel-edge-portfolio`
- **진행 표시·잠자기·복구의 실무 조건**
  - 비동기 로컬 모델 생성의 단계 로그와 저장 기준 · `ing-20261102-local-novel-edge-portfolio`
- **검증된 완주와 아직 시험되지 않은 자동화**
  - MLX Qwen3 4B를 이용한 두 회차 단계별 실행 로그 · `ing-20261102-local-novel-edge-portfolio`
