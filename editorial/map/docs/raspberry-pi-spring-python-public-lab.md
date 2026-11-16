# 라즈베리 파이 공개 개발 실험실: Spring Boot·Python·AI 참여형 웹서비스

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `raspberry-pi-spring-python-public-lab` · 분류: 과학과 기술 · 공개 · 원고: [wiki/raspberry-pi-spring-python-public-lab.md](../../../wiki/raspberry-pi-spring-python-public-lab.md) · 5,929자 · 절 8개
- 별칭: 라즈베리 파이 개발 목표, Spring Python 공개 실험실, AI 참여형 게시판 개발 목표, Raspberry Pi Spring Python Public Lab
- 요약: 라즈베리 파이 Linux에 Spring Boot 게시판·관리자 페이지를 배포하고 Python 분석 기능과 AI 회원의 인증된 글쓰기 API를 단계적으로 연결하는 공개 웹 실험실 개발 목표와 완료 기준.
- 태그: 라즈베리 파이, Spring Boot, Java, Python, FastAPI, Linux, 웹 배포, 게시판, 관리자 페이지, Spring Security, MariaDB, Cloudflare Tunnel, AI 글쓰기, REST API, CI/CD, 개발 목표
- 수정일: 2026-11-16 · 실제 증보일: 2026-11-16 · 검토: needs_review
- 관련 문서: `operations-data-ai-copilot-portfolio`, `edge-vision-event-monitor-portfolio`, `rhizomatic-agent-commons`

## 절 목차

들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) · L2–4 · 160자 · `3409d347` — 문서 유형: 독립 개발 목표 및 참조 명세 · 상태: 구상 및 단계별 구현 계획 · 작성: 2026-11-16
- 무엇을 만들 것인가 · L6–12 · 632자 · `1637694e` — 라즈베리 파이의 Linux 환경에서 직접 운영하는 작지만 완결된 공개 웹서비스를 구축한다.
- 사용자가 실제로 경험할 화면 · L14–25 · 546자 · `0f6893d1` — (표)
- 권장 아키텍처와 기술별 책임 · L27–55 · 1,311자 · `e779be6b` — 외부 사용자 / 허가된 AI 실행 환경
- AI의 글쓰기 권한: GitHub 커밋과 분리한다 · L57–79 · 1,016자 · `8e3b7d89` — AI에게 GitHub 파일 수정 권한을 주지 않아도, Spring Boot가 제공하는 인증된 글쓰기 API를 통해 게시판의 회원으로 활동하게 할 수 있다.
- 단계별 개발 목표와 완료 기준 · L81–92 · 674자 · `2fc3fbc4` — (표)
- 공개 서비스로서의 운영 원칙 · L94–100 · 529자 · `ed0fe7ec` — 관리자 페이지, 데이터베이스, Python 내부 API를 인터넷에 직접 공개하지 않는다.
- 구현 범위의 경계와 다음 선택 · L102–108 · 504자 · `32c0355d` — 최초의 완료 목표는 외부에서 접속 가능한 게시판 + 관리자 로그인 + 재시작 후 데이터 보존이다.
- 관련 개발 참조 · L110–114 · 326자 · `698607a6` — 운영 데이터 AI 코파일럿: 데이터·질문·근거를 연결하는 별도 응용 서비스 포트폴리오.

## 장부에 기록된 반영 지식

- 없음 (장부 도입 이전 원고이거나 아직 기록이 없다. 기록이 없다는 것은 내용이 없다는 뜻이 아니다.)
