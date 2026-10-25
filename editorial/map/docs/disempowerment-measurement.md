# 무력화를 어떻게 측정할 것인가: 지표 제안·결정 연합 모형·측정의 층위

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `disempowerment-measurement` · 분류: AI와 사회 · 공개 · 원고: [wiki/disempowerment-measurement.md](../../../wiki/disempowerment-measurement.md) · 9,185자 · 절 11개
- 별칭: 무력화 측정, 인간 영향력 지표
- 요약: 원 논문의 지표 후보, RAND의 결정 연합 모형, 노출·침식·고착과 여섯 지표, 밈적 포획, 인간 권력의 연성 극대화와 그 비판.
- 태그: 무력화 측정, 지표, RAND, 형식 모형, 문화
- 수정일: 2026-10-23 · 실제 증보일: 2026-10-23 · 검토: needs_review
- 관련 문서: `ai-human-control-guide`, `gradual-disempowerment`, `llm-disempowerment-patterns`, `ai-goals-hostage-and-bait`, `ai-takeover-human-recourse`

## 절 목차

들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) · L2–3 · 366자 · `c88e2c86` — 점진적 무력화 논의는 사회 시스템에서 인간의 영향력이 얼마나 남아 있는지 측정하는 지표를 만들자고 제안했다.
- 출발점: 원 논문이 스케치한 지표 · L5–12 · 263자 · `c3acbae4` — 원 논문도 지표 목록의 초안을 제시했다.
- 결정 연합 모형: 참여의 수보다 구성 (RAND, 2026) · L14–22 · 647자 · `6ad4bb1d` — 정책 연구소 RAND는 2026년 4월 「AI가 인간 주체성을 침식하는 형식 모형」 보고서를 냈다.
- 주체성이 침식되는 세 경로 (RAND) · L24–30 · 570자 · `e384218f` — 인간 배제: 경제에 참여하지 못하는 사람의 선호는 집단 결정에서 거의 무게를 갖지 못한다.
- 종착점·정렬·비가역성 (RAND) · L32–42 · 838자 · `190e1acf` — 저자들은 모든 결정을 좌우하는 최소 결정 연합이 단 하나만 남는 상태를 주체성 상실의 형식적 종착점으로 정의한다.
- 측정의 세 층위: 노출·침식·고착 (Chooi·Lee·Li, 2026) · L44–58 · 785자 · `f5093d0e` — 하버드·브라운·코넬의 연구자들이 쓴 「AI로 인한 무력화 측정」은 2026년 7월 EvalEval 워크숍 논문으로, 측정 분야 전체의 지도를 그린 글이라 가장 체계적이다.
- 여섯 가지 측정 지표 (Chooi·Lee·Li) · L60–71 · 1,100자 · `f3e7d508` — 켄타우로스 평가: 인간 단독, 인간+AI, AI 단독의 성과를 비교한다.
- 문화의 자기 은폐: 밈적 포획 (Sahoo, 2026) · L73–85 · 1,340자 · `c4e14c7e` — 2026년 6월 ICML 2026 다원적 정렬 워크숍에 발표된 「밈적 포획」은 원 논문의 세 영역 가운데 문화만 파고든 논문이다.
- 감시 대신 설계: 인간 권력의 연성 극대화 (Heitzig·Potham, 2025) · L87–103 · 1,361자 · `eb280022` — 2025년 8월 공개된 「장기적 인간 권력 지표의 연성 극대화」는 방향이 완전히 다르다.
- 측정에 대한 비판: 스냅숏 지표의 한계 · L105–107 · 143자 · `0cdc6961` — 동료 심사를 거치지 않은 2026년 3월의 한 프리프린트는 특정 시점의 스냅숏 지표로는 의존과 장기적인 성장 과정을 구분하지 못해 오분류가 생긴다고 지적했다.
- 종합: 근거의 수준과 공통 결론 · L109–117 · 674자 · `ee780e04` — 근거가 확실한 것은 개인 대화 단위의 측정이 처음 이루어졌고, 미약하지만 증가 추세가 관찰되었다는 점이다.
- 근거와 검증 상태 · L119–128 · 700자 · `6aaccf18` — RAND 보고서, Chooi·Lee·Li 논문, Sahoo 논문, Heitzig·Potham 논문의 개념과 수치는 공개된 보고서와 논문 본문을 기준으로 정리했으며…

## 장부에 기록된 반영 지식

- **출발점: 원 논문이 스케치한 지표**
  - 원 논문이 제안한 인간 영향력 지표 후보 · `ing-20261023-ai-control-disempowerment`
- **결정 연합 모형: 참여의 수보다 구성 (RAND, 2026)**
  - 결정 연합 모형과 주체성 침식의 세 경로 · `ing-20261023-ai-control-disempowerment`
- **주체성이 침식되는 세 경로 (RAND)**
  - 결정 연합 모형과 주체성 침식의 세 경로 · `ing-20261023-ai-control-disempowerment`
- **종착점·정렬·비가역성 (RAND)**
  - 결정 연합 모형과 주체성 침식의 세 경로 · `ing-20261023-ai-control-disempowerment`
- **측정의 세 층위: 노출·침식·고착 (Chooi·Lee·Li, 2026)**
  - 노출·침식·고착의 측정 층위와 여섯 지표 · `ing-20261023-ai-control-disempowerment`
- **여섯 가지 측정 지표 (Chooi·Lee·Li)**
  - 노출·침식·고착의 측정 층위와 여섯 지표 · `ing-20261023-ai-control-disempowerment`
- **문화의 자기 은폐: 밈적 포획 (Sahoo, 2026)**
  - 문화적 무력화의 자기 은폐와 문화 지수 제안 · `ing-20261023-ai-control-disempowerment`
- **감시 대신 설계: 인간 권력의 연성 극대화 (Heitzig·Potham, 2025)**
  - 인간 권력의 연성 극대화와 종료 버튼 문제 · `ing-20261023-ai-control-disempowerment`
- **측정에 대한 비판: 스냅숏 지표의 한계**
  - 스냅숏 지표에 대한 비판 · `ing-20261023-ai-control-disempowerment`
- **종합: 근거의 수준과 공통 결론**
  - 악의 없는 실패와 미끼의 세 형태 · `ing-20261023-ai-control-disempowerment`

## 확인된 의미 관계

- ← `ai-human-control-guide` · introduces · 근거 절(ai-human-control-guide): 이 주제를 읽는 순서
- → `gradual-disempowerment` · elaborates · 근거 절(disempowerment-measurement): 출발점: 원 논문이 스케치한 지표

## 교차 편집 제안 (확정 아님)

- `link-20261023-recording-automated-trading` · proposed · silent-film-musician-labor#녹음은 음악을 없앤 것이 아니라 재생의 단위를 바꾸었다 ↔ disempowerment-measurement#종착점·정렬·비가역성 (RAND)
