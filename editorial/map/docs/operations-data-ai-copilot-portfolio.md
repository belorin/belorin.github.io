# 운영 데이터 AI 코파일럿: 더미 DB와 대시보드를 공개 서비스로 만드는 포트폴리오

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `operations-data-ai-copilot-portfolio` · 분류: 과학과 기술 · 공개 · 원고: [wiki/operations-data-ai-copilot-portfolio.md](../../../wiki/operations-data-ai-copilot-portfolio.md) · 8,378자 · 절 9개
- 별칭: 운영 데이터 AI 코파일럿, OpsLens AI, 제조 물류 AI 대시보드, 더미 DB AI 포트폴리오, Operational Data AI Copilot
- 요약: 제조·물류 합성 DB, KPI 대시보드, 제한된 자연어 질의, 근거 패널, 평가와 무료 호스팅·API 비용 통제를 결합한 공개 웹 AI 포트폴리오 설계.
- 태그: AI 포트폴리오, Applied AI, 제조 데이터, 물류, 합성 데이터, Postgres, 자연어 질의, Structured Outputs, Text-to-SQL, Next.js, Vercel, Supabase, Neon, 평가
- 수정일: 2026-11-03 · 실제 증보일: 2026-11-03 · 검토: needs_review
- 관련 문서: `edge-vision-event-monitor-portfolio`, `manufacturing-optimization-solo-business`

## 절 목차

들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) · L2–5 · 525자 · `0824e6b1` — 인공지능 분야로 옮겨 가려는 소프트웨어 개발자에게 포트폴리오는 모델을 얼마나 많이 호출했는가를 보여 주는 전시장이 아니다.
- 어떤 AI 엔지니어링을 증명할 것인가 · L7–13 · 696자 · `adf9ab67` — AI 포트폴리오에는 적어도 두 갈래가 있다.
- 최소 제품의 세 화면: 지표, 질문, 근거 · L15–25 · 1,145자 · `b551194d` — 단일한 공개 웹 주소에 접속하면 즉시 시연할 수 있어야 한다.
- 대량의 더미 데이터보다 중요한 것은 생성 규칙이다 · L27–42 · 1,065자 · `80872e8d` — 더미 DB의 목적은 테이블의 행 수를 과시하는 일이 아니다.
- AI가 SQL을 함부로 실행하지 않도록 분리한다 · L44–60 · 1,125자 · `4014221d` — 초기 버전에서 자연어를 무제한 SQL로 직접 번역하면 인상적인 시연을 얻을 수 있을지 몰라도, 잘못된 집계·무거운 쿼리·권한 없는 테이블 접근·불안정한 답변이 함께 증가할 수 있다.
- 평가·관측·실패의 표기 · L62–68 · 553자 · `6f5f80e8` — 이 프로젝트의 중요한 성과는 ‘답변이 자연스럽다’가 아니라 재현 가능한 테스트가 존재한다는 데 있다.
- 공개 배포: 무료 웹과 과금되는 추론을 구별한다 · L70–87 · 1,513자 · `ba31250c` — 구현의 기본 선택지로 Next.js + Vercel + Supabase 또는 Neon + 외부 LLM API가 제시된다.
- 범위는 작게, 보여 주는 증거는 충분히 · L89–103 · 844자 · `6738dac3` — 첫 페이지에서 곧바로 화면을 볼 수 있게 하는 데 집중한다.
- 남은 설계 결정과 검증 경계 · L105–109 · 387자 · `67ab80d8` — 서비스 이름으로 OpsLens AI가 제안될 수 있지만 확정된 제품명은 아니다.
- 관련 문서 · L111–114 · 237자 · `077dc0fa` — 엣지 영상 이벤트 감지 포트폴리오: 객체 인식·이벤트 판정·엣지 배포라는 다른 AI 포트폴리오 경로와 비교한다.

## 장부에 기록된 반영 지식

- **어떤 AI 엔지니어링을 증명할 것인가**
  - 연구형 AI와 응용형 AI 포트폴리오의 구분과 현업 경력의 활용 · `ing-20261103-operations-ai-copilot-portfolio`
  - 운영 비서·ERP 자연어 질의·현장 장애 대응 코파일럿의 세 경로 · `ing-20261103-operations-ai-copilot-portfolio`
  - 만들고 싶은 문제와 채용 검증 가능성의 균형 · `ing-20261103-operations-ai-copilot-portfolio`
- **최소 제품의 세 화면: 지표, 질문, 근거**
  - 대시보드·자연어 채팅·근거 패널의 세 화면 · `ing-20261103-operations-ai-copilot-portfolio`
  - 라인 가동률·납기 지연·설비 위험도 분석의 데모 질문과 근거 · `ing-20261103-operations-ai-copilot-portfolio`
- **대량의 더미 데이터보다 중요한 것은 생성 규칙이다**
  - 제조 물류 합성 DB 스키마와 일관된 사건 생성 규칙 · `ing-20261103-operations-ai-copilot-portfolio`
- **AI가 SQL을 함부로 실행하지 않도록 분리한다**
  - 무제한 SQL 대신 구조화된 조회 도구와 읽기 전용 실행 경계 · `ing-20261103-operations-ai-copilot-portfolio`
  - 문서 RAG와 정형 데이터 집계의 역할 분리 및 단계적 확장 · `ing-20261103-operations-ai-copilot-portfolio`
- **평가·관측·실패의 표기**
  - 자연어 DB 분석의 평가셋·관측·실패 분류 · `ing-20261103-operations-ai-copilot-portfolio`
- **공개 배포: 무료 웹과 과금되는 추론을 구별한다**
  - Vercel Supabase Neon Cloudflare D1 Render 무료 배포 선택지 · `ing-20261103-operations-ai-copilot-portfolio`
  - AI API 과금과 공개 데모 호출 제한 및 현행 요금 재검증 · `ing-20261103-operations-ai-copilot-portfolio`
- **범위는 작게, 보여 주는 증거는 충분히**
  - 최소 구현 범위와 단계별 3주 개발 순서 · `ing-20261103-operations-ai-copilot-portfolio`
  - README 평가 결과와 데모 영상으로 구현 증거 구성 · `ing-20261103-operations-ai-copilot-portfolio`
