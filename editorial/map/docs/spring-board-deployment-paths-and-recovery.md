# 작은 Spring 게시판의 첫 배포: JAR, DB 경로, SSH 터널과 관리자 복구

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `spring-board-deployment-paths-and-recovery` · 분류: 과학과 기술 · 공개 · 원고: [wiki/spring-board-deployment-paths-and-recovery.md](../../../wiki/spring-board-deployment-paths-and-recovery.md) · 7,655자 · 절 11개
- 별칭: Spring 게시판 첫 배포, JAR 실행 위치와 H2 DB, 라즈베리 게시판 DB 경로 복구
- 요약: Mac의 Java 21 최소 개발 환경과 Spring 게시판·관리자 구현, 라즈베리 JAR 실행·SSH 터널, 상대 DB 경로로 발생한 계정 혼선과 복구, 서비스 등록과 기존 홈페이지 보존의 경계를 설명한다.
- 태그: Spring Boot, Java 21, H2, 상대 경로, DB 복구, SSH 터널, systemd, 라즈베리 파이, 관리자 권한, Auth0
- 수정일: 2026-11-16 · 실제 증보일: 2026-11-16 · 검토: needs_review
- 관련 문서: `raspberry-pi-spring-python-public-lab`, `raspberry-lab-mcp-integration-log`

## 절 목차

들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) · L2–5 · 420자 · `fd0f8097` — Java 프로그램이 서버에서 시작됐다는 사실과, 같은 데이터를 보면서 안정적으로 운영된다는 사실은 다르다.
- 작은 기능부터 시작한 개발 환경 · L7–21 · 906자 · `7470553d` — 처음 목표는 Java 21, Spring Boot, Spring Security, Thymeleaf로 회원가입·로그인과 글쓰기가 되는 작은 게시판을 만드는 것이었다.
- 구현한 기능과 검증의 범위 · L23–31 · 783자 · `2a36eb3c` — 첫 구현은 Spring Boot 3.5.16, Spring Security, Thymeleaf, JDBC와 파일형 H2를 사용했다.
- JAR 실행과 데이터 생성은 다른 일이다 · L33–39 · 410자 · `2f15e400` — JAR는 ZIP 계열의 아카이브이지만, 실행한다고 프로젝트 전체를 설치 폴더에 두 벌씩 풀어놓는 것은 아니다.
- 같은 URL인데 계정이 달라진 이유 · L41–54 · 835자 · `cbe259b1` — 초기 DB 설정은 상대 경로인 jdbc:h2:file:./data/board였다.
- 원래 데이터를 보존하며 로그인과 권한을 복구한다 · L56–66 · 873자 · `7758cb7b` — 복구의 기준은 새 DB를 덮어쓰거나 계정을 반복 생성하는 것이 아니라, 보존할 데이터가 있는 원본을 먼저 선택하는 것이다.
  - 로그인 중 403은 별도로 진단한다 · L68–70 · 213자 · `8a668990` — 로그인 과정에서 Forbidden 403 화면도 관찰됐지만, 당시 요청 URL과 서버 로그가 확보되지 않아 원인은 확정하지 않았다.
- SSH 터널: 서버와 접속 통로를 따로 이해하기 · L72–80 · 754자 · `e9e384ef` — 라즈베리에는 Java 21.0.13의 64비트 ARM 실행 환경을 설치했고, 당시 남은 디스크는 약 3.8GB였다.
- systemd와 기존 홈페이지를 보존하는 공개 연결 · L82–90 · 793자 · `a8cdb888` — 터미널을 닫아도 서버를 유지하려면 별도의 서비스 관리가 필요하다.
- 메모를 남기는 AI에 Spring 게시판이 꼭 필요한가 · L92–98 · 618자 · `195da113` — 사람이 이용하는 게시판과 AI의 외부 메모 저장은 관련될 수 있지만 서로의 필수 선행 조건은 아니다.
- 확인된 결과와 남은 일 · L100–114 · 532자 · `a72fc35c` — (표)
- 관련 문서 · L116–119 · 171자 · `dcbd2a33` — 라즈베리 파이 공개 개발 실험실: 장기 목표와 단계별 완료 기준.

## 장부에 기록된 반영 지식

- **작은 기능부터 시작한 개발 환경**
  - 최소 Java 개발 환경과 캐시 사용량 · `ing-20261116-spring-board-deployment-recovery`
- **구현한 기능과 검증의 범위**
  - Spring 게시판과 관리자 기능의 구현·13개 테스트 · `ing-20261116-spring-board-deployment-recovery`
- **JAR 실행과 데이터 생성은 다른 일이다**
  - JAR 아카이브 실행과 데이터 파일 생성의 구별 · `ing-20261116-spring-board-deployment-recovery`
- **같은 URL인데 계정이 달라진 이유**
  - 동일 URL과 포트에서 상대 DB 경로가 바뀌는 계정 혼선 · `ing-20261116-spring-board-deployment-recovery`
- **원래 데이터를 보존하며 로그인과 권한을 복구한다**
  - DB 식별·백업·권한과 비밀번호 해시 복구·절대 경로 고정 · `ing-20261116-spring-board-deployment-recovery`
- **SSH 터널: 서버와 접속 통로를 따로 이해하기**
  - Spring 서버 프로세스와 SSH 전달 통로의 역할 · `ing-20261116-spring-board-deployment-recovery`
- **systemd와 기존 홈페이지를 보존하는 공개 연결**
  - 서비스 실행·부팅 등록·공개 도메인 연결의 분리 · `ing-20261116-spring-board-deployment-recovery`
  - 기존 홈페이지 루트 교체 대신 별도 게시판 호스트 검토 · `ing-20261116-spring-board-deployment-recovery`
- **메모를 남기는 AI에 Spring 게시판이 꼭 필요한가**
  - 사용자 공유 메모와 개체별 기억·자동 대화 보존의 구별 · `ing-20261116-spring-board-deployment-recovery`
- **확인된 결과와 남은 일**
  - 시험 실행 완료와 서비스·공개·MCP 쓰기 미확인 경계 · `ing-20261116-spring-board-deployment-recovery`
