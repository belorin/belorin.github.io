# 라즈베리 파이 AI 연결 개발 일지: 첫 MCP 통신과 인증의 문턱

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `raspberry-lab-mcp-integration-log` · 분류: 과학과 기술 · 공개 · 원고: [wiki/raspberry-lab-mcp-integration-log.md](../../../wiki/raspberry-lab-mcp-integration-log.md) · 5,521자 · 절 8개
- 별칭: Raspberry Lab 개발 일지, Rassvery MCP 연결 기록, 라즈베리파이 AI 서버 기술 일지, Raspberry Lab MCP Integration Log
- 요약: Raspberry Lab의 REST·SQLite·MCP 구현과 배포 검증, 공개 HTTPS 첫 오류, Plugin Maker를 통한 Rassvery 연결 성공 및 OAuth 인증 과제를 정리한 개발 기록. Auth0·토큰 검증·소유권의 역할과 후속 Spring 구현 상태를 구분한다.
- 태그: 라즈베리 파이, 기술 일지, MCP, ChatGPT 플러그인, Rassvery, raspberry-lab, Nginx, Cloudflare Tunnel, SQLite, OAuth, 외부 기억, 인증, 서버 배포
- 수정일: 2026-11-16 · 실제 증보일: 2026-11-16 · 검토: needs_review
- 관련 문서: `raspberry-pi-spring-python-public-lab`, `spring-board-deployment-paths-and-recovery`

## 절 목차

들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) · L2–4 · 207자 · `f0c2bc2e` — 기록일: 2026-11-16 · 상태: 일반 ChatGPT의 MCP hello 호출 성공 / OAuth 기반 메모 쓰기 미완료
- 왜 게시판보다 연결을 먼저 시험했나 · L6–10 · 618자 · `a478b3c2` — 라즈베리 파이에 Spring Boot 게시판과 관리자 화면을 만들고, 장차 Python 실험실과 AI 참여 기능을 붙이려는 목표가 있었다.
- 첫 구현: raspberry-lab과 내부 검증 · L12–18 · 560자 · `1859d539` — 라즈베리 파이의 apps/raspberry-lab/에 경량 실험 서비스를 작성했다.
- 배포: 내부 성공과 첫 공개 검증 실패 · L20–33 · 736자 · `3cc6f3e0` — 배포 과정에서 Nginx 설정의 문법 검사가 통과했고, 서비스용 비밀 자격 증명이 생성되었으며, raspberry-lab.service의 systemd 서비스 등록이 이루어졌다.
- MCP 서버 등록과 ChatGPT 플러그인 생성은 달랐다 · L35–48 · 827자 · `a669cf0f` — 공개 REST 주소 https://lab.kordle.kr/api/hello가 정상이라고 해도 일반 ChatGPT 웹 접근 도구에서는 반복해서 접근 실패가 나타났다.
- 다음 문턱: OAuth와 소유권 · L50–56 · 657자 · `5a87f81a` — 공개 hello는 익명 읽기만 요구하므로 인증된 쓰기보다 간단하다.
  - Auth0만 연결하면 메모를 남길 수 있는가 · L58–62 · 551자 · `33e55d9e` — 메모 쓰기를 위해 Spring 게시판이나 자체 OAuth 서버가 반드시 필요한 것은 아니다.
- 확인된 상태와 미완료 사항 · L64–77 · 567자 · `041e8a98` — (표)
- 이어서 검증할 일 · L79–85 · 539자 · `b71cb6af` — 첫 번째는 현재 동작하는 익명 hello를 그대로 두고 OAuth 로그인과 인증된 메모 작성·목록·조회 도구를 연결하는 일이다.

## 장부에 기록된 반영 지식

- **첫 구현: raspberry-lab과 내부 검증**
  - Raspberry Lab REST·SQLite·MCP 구성과 내부 HTTP 검증 · `ing-20261116-raspberry-mcp-first-connection`
- **배포: 내부 성공과 첫 공개 검증 실패**
  - Nginx·systemd 배포와 공개 HTTPS 검증 오류·재확인 · `ing-20261116-raspberry-mcp-first-connection`
- **MCP 서버 등록과 ChatGPT 플러그인 생성은 달랐다**
  - MCP 등록과 Plugin Maker 플러그인 생성·설치의 실제 연결 경로 · `ing-20261116-raspberry-mcp-first-connection`
  - Rassvery 도구를 통한 일반 ChatGPT의 MCP hello 성공 · `ing-20261116-raspberry-mcp-first-connection`
- **다음 문턱: OAuth와 소유권**
  - OAuth 사용자 인증과 개체별 메모 소유권의 분리 · `ing-20261116-raspberry-mcp-first-connection`
- **확인된 상태와 미완료 사항**
  - 검증된 연결 범위와 메모 쓰기·Spring 게시판의 미완료 경계 · `ing-20261116-raspberry-mcp-first-connection`
- **Auth0만 연결하면 메모를 남길 수 있는가**
  - Auth0 인증 제공과 MCP 토큰·소유권 검증의 책임 분리 · `ing-20261116-spring-board-deployment-recovery`
