# 로컬 LLM의 계산과 현장 운영: 작은 모델, RAG, 도구 호출, 큐

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `local-llm-industrial-operations` · 분류: 과학과 기술 · 공개 · 원고: [wiki/local-llm-industrial-operations.md](../../../wiki/local-llm-industrial-operations.md) · 4,262자 · 절 7개
- 별칭: 로컬 LLM 운영, Ollama 산업용 서버
- 요약: 양자화와 추론의 물리적 비용에서 Ollama 모델·DB 도구·RAG·산업용 판정·저가 미니PC·폭주 제어까지 이어지는 설계 원칙.
- 태그: 로컬 LLM, Ollama, Qwen, 양자화, RAG, 산업 설비, API, 큐
- 수정일: 2026-11-04 · 실제 증보일: 2026-11-04 · 검토: needs_review
- 관련 문서: `operations-data-ai-copilot-portfolio`, `ai-compute-scaling-inference`

## 절 목차

들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) · L2–3 · 194자 · `5d56623c` — 로컬 언어모델을 시험할 때 가장 먼저 마주치는 의문은 뜻밖에도 단순하다.
- B와 양자화: 숫자의 수와 숫자의 정밀도 · L5–9 · 572자 · `21830e85` — 7B는 약 70억 개, 14B는 약 140억 개의 파라미터를 뜻한다.
- 학습이 끝나도 추론이 느린 까닭 · L11–15 · 433자 · `61898670` — 학습에는 순전파뿐 아니라 손실 계산, 역전파와 파라미터 업데이트가 들어간다.
- Ollama 생태계에서 구별하는 모델과 역할 · L17–21 · 606자 · `59f5e67e` — Ollama는 모델을 내려받아 실행하고 로컬 API로 호출하는 런타임이다.
- RAG와 데이터베이스 도구 호출을 혼동하지 않기 · L23–27 · 584자 · `57bb9ace` — RAG(Retrieval-Augmented Generation) 는 외부 문서·위키·매뉴얼에서 질문과 관련된 자료를 검색해 모델의 입력으로 첨부하고 답을 생성하는 방식이다.
- 설비의 정상·비정상 판정은 언어모델과 분리한다 · L29–33 · 460자 · `8aef91b8` — 산업 설비에서 센서·PLC·운전상태 API를 수신해 정상 여부를 판단하는 기능은 결정적 규칙·통계·전문 이상탐지 모형으로 구현하는 편이 적합하다.
- 저가 서버 구성과 급증하는 API 요청 · L35–41 · 850자 · `f9edb50b` — PoC의 한 출발점은 Intel N100급 CPU, RAM 16GB, SSD와 1B~3B 양자화 모델이다.
- 검증해야 할 조건 · L43–47 · 327자 · `c004e168` — 하드웨어 구매 전에는 장비 대수, 데이터 송신 주기, 순간 최대 요청량, 평균·최악 지연, 이상 발생 빈도, 허용 가능한 경보 지연, 외부망 사용 가능성, 회사의…

## 장부에 기록된 반영 지식

- **B와 양자화: 숫자의 수와 숫자의 정밀도**
  - B와 양자화, 파라미터와 용량의 구분 · `ing-20261104-local-llm-global-developer-work`
- **학습이 끝나도 추론이 느린 까닭**
  - 훈련과 순차 토큰 추론의 계산 부담 · `ing-20261104-local-llm-global-developer-work`
- **Ollama 생태계에서 구별하는 모델과 역할**
  - Ollama 모델 계열과 Devstral의 역할 · `ing-20261104-local-llm-global-developer-work`
- **RAG와 데이터베이스 도구 호출을 혼동하지 않기**
  - RAG와 정형 DB 함수 호출의 역할 구분 · `ing-20261104-local-llm-global-developer-work`
- **설비의 정상·비정상 판정은 언어모델과 분리한다**
  - 산업 설비의 판정·설명·알림 책임 분리 · `ing-20261104-local-llm-global-developer-work`
- **저가 서버 구성과 급증하는 API 요청**
  - Windows 미니PC와 Raspberry Pi 저가 운영 및 요청 급증 · `ing-20261104-local-llm-global-developer-work`
