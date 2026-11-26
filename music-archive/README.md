# 광주·전남 공연예술인 아카이브 v0.3

2026년 프로그램북에서 시작하는 공개 명부 데이터베이스. 기존 위키 원고는 역사적 전사본으로 보존하며, 구조화된 명부의 신규 등록·정정은 이 디렉터리의 JSON을 기준으로 한다. 위키의 서술·해설은 기존 원고 정본을 따른다.

## 구조와 등록 규칙

- data/catalog.json: 단체, 공연, 작품, 명부 색인, 검증된 인물 ID 레지스트리.
- data/rosters/<id>.json: 시즌 또는 공연별 단체 명부 1개. 원본 순서대로 개별 등장 기록을 저장한다. record.id는 한번 부여하면 변경하거나 재사용하지 않는다.
- 하나의 공연에 여러 단체 명부를 연결할 수 있다. 날짜를 모르면 추정 날짜를 입력하지 않는다. 날짜가 확인되면 공연 등록.
- records의 name, part, role, printed_mark는 원본 전사에 근거한다. role이 null이면 미표기이지 평단원 확정이 아니다. category는 집계용 구분이다.
- person_id는 동일인이 확인되기 전까지 null. 이름·파트의 일치는 검색 후보이며 자동 병합하지 않는다. 확인된 동일인에만 별도 안정 ID를 부여하고 레지스트리에 등록한다. 오기 정정 시 기록 ID는 유지한다.
- 시즌 명부는 소속 표기의 스냅샷이며 실제 공연 참여가 아니다. attendance는 기본 unverified. 명부의 기재 인원과 실제 무대 출연 인원 및 고유 인물 수를 구별한다.
- 소스에 책자명, 페이지(미확인은 null), 관련 위키 ID, 전사 검수 상태를 남긴다. 공개된 공연 자료에 필요한 이름·파트·직책만 기록하고 사적 정보나 사진 원본은 추가하지 않는다.
- 새 프로그램북 등록: 원본 전사 → 사용자 검수 상태 명시 → 기존 공연 ID 확인 → 단체별 명부 추가 → catalog.roster_ids에 등록 → node music-archive/validate.mjs 실행 → 커밋. 미확인 항목은 null/미확인 유지.
- 정정과 추가는 기존 데이터 삭제 대신 Git 이력과 안정 ID로 추적한다. 별도 위키 문서의 수동 복제는 필수 아님. 기존 위키 서술이 틀리게 되면 함께 고친다.

## 열람과 이전

index.html은 정적 브라우저 검색 화면이며 외부 서버 없이 작동한다(HTTP로 제공). 검색 결과는 이름·파트·단체·공연·시즌·직책 및 출처를 함께 표시한다. 동일 이름·파트의 여러 단체 등장은 확인 후보로 표시한다. SQL이 필요하면 python3 music-archive/export_sqlite.py /tmp/music-archive.sqlite 로 읽기용 SQLite를 생성한다. JSON이 정본이고 SQLite는 재생성 가능한 산출물이다. 생성 DB는 Git에 커밋하지 않는다.

초기 이관: 후반 시즌 74건, Nordic Echo 93건, 카메라타전남 67건, 광양시립합창단 36건, 전남대 합창단 49건. 합계 319개 명부 등장 기록, 공연 2건, 시즌 스냅샷 1건, 단체 4개. 고유 인물 수는 확정하지 않는다.

참여 단체가 확인되어도 명부가 없으면 concert.ensemble_ids에만 등록한다. 빈 명부나 다른 공연 명부를 복사하지 않는다. ensemble_labels에는 공연 당시 제공 명칭을 보존할 수 있으며 documentation_note에는 자료 범위·누락 상태를 기록한다. source.wiki가 null이면 DB 원본을 출처 열람 링크로 사용한다.

온라인 공개 출연 명단도 등록한다. source.url, accessed_on, type을 남기며 공연 예고에서 확인한 출연자는 attendance=unverified로 유지한다. 기관 공식 자료 우선, 없으면 언론 및 공연 정보 사이트를 이용한다. 출연 악기나 직책이 명시되지 않은 경우 다른 명부를 근거로 확정하지 않는다. 미래 공연은 실제 개최 이후 별도 확인하며 예정 정보는 실제 출연과 혼동하지 않는다. 사용자 검수는 명부 전사의 정확성에 대한 확인이며 실제 출연 확인이 아니다.

프로그램북마다 직책 기호의 의미가 달라질 수 있다. source.legend에 원본 범례를, 개별 record.source_mark/source_role에 원본 기호·직책을 보존하고 role은 검색용 표준 직책으로 변환한다. 2026-03-20 책자에서는 +가 객원이며 후반 시즌의 객원차석과 구별한다.

## 발레·연극 확장 (v0.2)

기존 /music-archive/ 주소와 JSON ID를 유지한다. concert는 역사적 필드명이며 이제 모든 공연 회차를 뜻한다. genre는 music(생략 시 기본), ballet, theatre 등. 동일 제작 공연은 production_id로 연결하고 session_number와 time으로 회차를 구분한다. 발레·연극의 배역은 part에 원문대로 기록하며 직책과 구별한다. category는 dancer, actor, stage_crew를 추가한다. 한 사람이 한 회차에서 여러 배역을 맡을 경우 각각의 기록을 유지한다. 여러 회차 공통으로 병합된 배역표는 각 회차에 전사하되 casting_scope=all_sessions를 남긴다. 출연 기록 수는 고유 인물 수가 아니다. 실제 출연 여부와 소속은 별도 확인 전 확정하지 않는다.

## 제작 크레딧 확장 (v0.3)

catalog.production_credit_ids에 제작 프로젝트 ID를 등록하고 data/productions/<id>.json에 프로그램북의 제작진·기관 조직 명부·협력업체 크레딧을 보존한다. scope=production은 프로젝트 크레딧, organization_roster는 책자 시점의 기관 명부이며 실제 공연 참여를 뜻하지 않는다. entity_type은 person/vendor/ensemble로 분리하고 공연단체는 ensemble_id로 연결한다. 같은 인물의 복수 직책은 별개 크레딧으로 보존하며 동일인 확정은 별도 검증 후 person_id로 연결한다. 제작 크레딧은 회차별 출연 명부와 분리 집계한다. 공연에 명시된 협연단체는 해당 회차에 연결하되 개인 명부 미확보로 표시한다. 웹 제작 크레딧 검색 및 SQLite production_credit 테이블에서 조회한다.

발레단 단원 소개 페이지는 공연 캐스팅과 독립된 membership snapshot으로 등록한다. season에 책자 시점을 명시하고 source.type=booklet_membership_snapshot, source.production_id에 출처 제작 프로젝트를 연결한다. 단원 구분은 role에 수석단원/차석단원/상임단원/비상임단원 원문 그대로 기록하며 수석·차석의 계약 형태를 추정하지 않는다. 동일 책자 캐스팅과의 이름 일치는 명부 연결 후보이며 person_id는 확정하지 않는다. 약칭은 명시적으로 cast_name_aliases에 기록한다. 웹 검색에서 배역별 직급 후보를 표시하고 원명부를 독립적으로 조회한다.
