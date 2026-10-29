# 오래된 영어책 한 권을 끝까지 번역하려면: 텍스트 추출, 로컬 모델, 재개와 대조 뷰어

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `book-translation-pipeline-local-llm` · 분류: 기술·지식 아카이브 · 공개 · 원고: [wiki/book-translation-pipeline-local-llm.md](../../../wiki/book-translation-pipeline-local-llm.md) · 10,524자 · 절 11개
- 별칭: 로컬 책 번역, 영어 고서 자동 번역, Ollama 번역 파이프라인, 원문 번역 병기 뷰어
- 요약: Internet Archive 고서 TXT를 OCR 없이 처리하고 Ollama·Qwen3로 문단별 번역·체크포인트·HTML 대조본을 만드는 과정, SEG 태그 정렬, M1 16GB 속도·잠자기 문제, Google Cloud 번역 전환의 미검증 경계를 기록한다.
- 태그: 고서 번역, Ollama, Qwen3, OCR, Google Cloud Translation, 중단 재개, 문단 정렬, HTML 뷰어
- 수정일: 2026-10-30 · 실제 증보일: 2026-10-30 · 검토: needs_review
- 관련 문서: `luddite-executions-memory`, `book-preview-credit-sourcing`

## 절 목차

들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) · L2–3 · 241자 · `b9aa7991` — 수백 쪽짜리 외국어 책을 한국어로 읽고 싶을 때 진짜 난관은 한 문장을 번역하는 능력이 아니다.
- OCR보다 먼저 확인할 것: 이미 읽을 수 있는 텍스트가 있는가 · L5–11 · 758자 · `d31041f9` — 출발점이 PDF라 해도 무조건 OCR부터 돌릴 필요는 없다.
- 여섯 공정은 각각 독립해야 한다 · L13–26 · 629자 · `0e2e36b1` — 입력 판별 → 원문 확보 → 전처리 → 분할 → 번역 → 복원·검수·출력의 순서가 기본 골격이다.
- 프랭크 필의 러다이트 역사서를 입력으로 삼는 방법 · L28–36 · 834자 · `561ad689` — 이 책의 Archive TXT 주소는 이미 전체 텍스트를 제공하는 형태였다.
- 번역 엔진을 바꾸는 것과 실행 환경을 바꾸는 것은 다르다 · L38–54 · 1,190자 · `7df18938` — 로컬 모델을 쓰기 위해 반드시 Meta의 Llama 가중치를 고집할 필요는 없다.
- M1·통합 메모리 16GB에서 무엇을 아껴야 하는가 · L56–64 · 986자 · `ac9bff1a` — Apple M1과 통합 메모리 16GB인 기계에서는 모델을 더 크게 바꾸기 전에 사용 중인 모델과 응답 형식을 살펴볼 필요가 있다.
- 진행률은 '시도 중'이 아니라 '디스크에 저장됨'을 기준으로 한다 · L66–74 · 1,045자 · `b7ff9f45` — 장시간 번역에서 중요한 파일은 화면의 퍼센트가 아니라 progress.json이다.
- 노트북이 잠들 때와 번역이 멈출 때 · L76–82 · 725자 · `7fc6ef0c` — 로컬 모델을 실행한 MacBook이 밤사이 잠자기에 들어가면 터미널과 모델의 작업도 멈추거나 지연될 수 있다.
- HTML이 어긋난 진짜 이유: 빈 줄은 문단 ID가 아니다 · L84–92 · 1,094자 · `dd92a317` — 읽기 불편을 줄이기 위해 좌우 병렬 HTML 뷰어를 만들었다.
- 로컬 번역과 구글 번역 사이의 스위치 · L94–100 · 895자 · `f0fe5756` — '그냥 구글 번역으로 돌리면 되지 않는가'라는 질문은 전체 구조를 다시 보게 한다.
- 무엇을 보면 완역본으로 믿을 수 있는가 · L102–114 · 828자 · `f17a1ab0` — 겉보기에는 모든 청크가 끝나도 곧바로 '완역'은 아니다.
- 실행 예와 남겨진 개발 과제 · L116–122 · 889자 · `60552c78` — 표시된 Python 스크립트의 기본 실행 파일명은 translate_book.py이고, 필요한 외부 Python 패키지로 requests가 쓰였다.

## 장부에 기록된 반영 지식

- **OCR보다 먼저 확인할 것: 이미 읽을 수 있는 텍스트가 있는가**
  - 텍스트 레이어·스캔 PDF·이미 OCR된 TXT의 분기 · `ing-20261030-book-translation-pipeline`
- **여섯 공정은 각각 독립해야 한다**
  - 입력 확보에서 검수까지의 여섯 공정과 실패 경계 · `ing-20261030-book-translation-pipeline`
- **프랭크 필의 러다이트 역사서를 입력으로 삼는 방법**
  - Internet Archive 러다이트 고서 TXT 전처리와 목차 오류 · `ing-20261030-book-translation-pipeline`
- **번역 엔진을 바꾸는 것과 실행 환경을 바꾸는 것은 다르다**
  - llama.cpp 실행기와 Llama 모델 계열의 구분 · `ing-20261030-book-translation-pipeline`
  - Ollama 404와 모델 목록 조회·Qwen3 기본 선택 · `ing-20261030-book-translation-pipeline`
- **M1·통합 메모리 16GB에서 무엇을 아껴야 하는가**
  - M1 16GB에서 사고 모드·청크 길이·출력 토큰의 속도 문제 · `ing-20261030-book-translation-pipeline`
- **진행률은 '시도 중'이 아니라 '디스크에 저장됨'을 기준으로 한다**
  - progress.json 체크포인트와 Ctrl+C 재개 단위 · `ing-20261030-book-translation-pipeline`
  - 분할 기준 변경과 진행 파일 재개의 불일치 위험 · `ing-20261030-book-translation-pipeline`
- **노트북이 잠들 때와 번역이 멈출 때**
  - Mac 잠자기 방지와 실행 중 Python 파일 변경 · `ing-20261030-book-translation-pipeline`
- **HTML이 어긋난 진짜 이유: 빈 줄은 문단 ID가 아니다**
  - 빈 줄 기준 문단 복원이 만든 병기 HTML의 전체 밀림 · `ing-20261030-book-translation-pipeline`
  - SEG 태그 기준 문단 정렬과 누락 표지의 한계 · `ing-20261030-book-translation-pipeline`
- **로컬 번역과 구글 번역 사이의 스위치**
  - 구글 번역 공식 API와 로컬 엔진 스위치 구조의 차이 · `ing-20261030-book-translation-pipeline`
- **무엇을 보면 완역본으로 믿을 수 있는가**
  - 완역의 조건인 입력·문단·텍스트·판본 검수 · `ing-20261030-book-translation-pipeline`
- **실행 예와 남겨진 개발 과제**
  - 부분 HTML 뷰어와 TXT·Markdown 출력의 구현 범위 · `ing-20261030-book-translation-pipeline`
