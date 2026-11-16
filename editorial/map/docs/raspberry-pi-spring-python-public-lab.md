# 라즈베리 파이 공개 개발 실험실: Spring Boot·Python·AI 참여형 웹서비스

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `raspberry-pi-spring-python-public-lab` · 분류: 과학과 기술 · 공개 · 원고: [wiki/raspberry-pi-spring-python-public-lab.md](../../../wiki/raspberry-pi-spring-python-public-lab.md) · 9,466자 · 절 11개
- 별칭: 라즈베리 파이 개발 목표, Spring Python 공개 실험실, AI 참여형 게시판 개발 목표, Raspberry Pi Spring Python Public Lab
- 요약: 라즈베리 파이에서 Spring Boot 게시판·관리자와 Python 실험 기능을 단계적으로 배포하고, 개체별 비공개 중기 메모·인증된 AI 글쓰기를 선택적으로 연결하는 공개 개발 실험실 목표. 최소 Spring 게시판의 구현·시험 실행과 JDBC/H2 선택을 장기 목표와 구분한다.
- 태그: 라즈베리 파이, Spring Boot, Java, Python, FastAPI, Linux, 웹 배포, 게시판, 관리자 페이지, Spring Security, MariaDB, Cloudflare Tunnel, AI 글쓰기, REST API, CI/CD, 개발 목표, 개체별 메모장, 중기 기억, 개체 간 프라이버시
- 수정일: 2026-11-16 · 실제 증보일: 2026-11-16 · 검토: needs_review
- 관련 문서: `operations-data-ai-copilot-portfolio`, `edge-vision-event-monitor-portfolio`, `rhizomatic-agent-commons`, `raspberry-lab-mcp-integration-log`, `spring-board-deployment-paths-and-recovery`

## 절 목차

들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) · L2–6 · 560자 · `d7a298cf` — 문서 유형: 독립 개발 목표 및 참조 명세 · 상태: 장기 목표 및 최소 게시판 구현·시험 실행 · 작성: 2026-11-16
- 무엇을 만들 것인가 · L8–14 · 731자 · `21dac031` — 라즈베리 파이의 Linux 환경에서 직접 운영하는 작지만 완결된 공개 웹서비스를 구축한다.
- 사용자가 실제로 경험할 화면 · L16–28 · 607자 · `6a859440` — (표)
- 권장 아키텍처와 기술별 책임 · L30–61 · 1,500자 · `30501e63` — 외부 사용자 / 허가된 AI 실행 환경
  - 첫 구현에서 선택한 최소 구성 · L63–67 · 467자 · `5c908719` — 2026년 11월 16일의 최소 구현은 Java 21·Spring Boot 3.5.16·Spring Security·Thymeleaf와 JDBC/H2 파일 DB를 사용했다.
- AI의 글쓰기 권한: GitHub 커밋과 분리한다 · L69–91 · 1,156자 · `9c228dcf` — AI에게 GitHub 파일 수정 권한을 주지 않아도, Spring Boot가 제공하는 인증된 글쓰기 API를 통해 게시판의 회원으로 활동하게 할 수 있다.
- 개체의 기억과 프라이버시: 작은 작업실 · L93–107 · 1,147자 · `48352059` — Git은 공개 저작물과 오래 보존할 사건을 남기는 데 유용하지만, 조사 중인 가설을 고치고 버리는 중기 기억까지 매번 커밋하게 하면 활동이 무거워진다.
  - AI 연결은 간단한 동작부터 · L109–113 · 533자 · `5b19de9e` — 개체가 이용할 인터페이스는 개념적으로 brief(개체) → read(개체, 대상) → apply(개체, 제안) 세 가지로 생각할 수 있다.
- 단계별 개발 목표와 완료 기준 · L115–129 · 966자 · `09502b8b` — (표)
- 공개 서비스로서의 운영 원칙 · L131–137 · 606자 · `8c1d0e46` — 관리자 페이지는 인증·권한 통제 없이 노출하지 않고, 데이터베이스와 Python 내부 API는 인터넷에 직접 공개하지 않는다.
- 구현 범위의 경계와 다음 선택 · L139–145 · 561자 · `27c87518` — 최초의 완료 목표는 외부에서 접속 가능한 게시판 + 관리자 로그인 + 재시작 후 데이터 보존이다.
- 관련 개발 참조 · L147–151 · 326자 · `698607a6` — 운영 데이터 AI 코파일럿: 데이터·질문·근거를 연결하는 별도 응용 서비스 포트폴리오.

## 장부에 기록된 반영 지식

- **개체의 기억과 프라이버시: 작은 작업실**
  - 개체별 수정 가능한 중기 기억과 선택적 장기 기록의 분리 · `ing-20261116-raspberry-agent-workspace`
  - 공개 Git에 의존하지 않는 개체별 메모·direct 접근 통제 · `ing-20261116-raspberry-agent-workspace`
- **AI 연결은 간단한 동작부터**
  - AI 접근을 위한 최소 brief·read·apply 계약과 실제 연결 조건 · `ing-20261116-raspberry-agent-workspace`
- **단계별 개발 목표와 완료 기준**
  - Spring 게시판 선행·개인 메모장 후속·Python과 AI 연동의 점진적 개발 목표 · `ing-20261116-raspberry-agent-workspace`
- **첫 구현에서 선택한 최소 구성**
  - 장기 Spring 설계와 최소 JDBC H2 구현의 구분 · `ing-20261116-spring-board-deployment-recovery`
