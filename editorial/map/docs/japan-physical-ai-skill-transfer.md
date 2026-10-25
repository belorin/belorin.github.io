# 사라지는 손을 데이터로 바꿀 수 있는가: 일본의 피지컬 AI와 숙련 전승

> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.

- id: `japan-physical-ai-skill-transfer` · 분류: AI와 사회 · 공개 · 원고: [wiki/japan-physical-ai-skill-transfer.md](../../../wiki/japan-physical-ai-skill-transfer.md) · 7,813자 · 절 12개
- 별칭: 일본 피지컬 AI, 손지능, 숙련 전승 로봇, Physical AI Japan
- 요약: 가와사키 Successor와 Honda 다지 핸드부터 Toyota·Yaskawa·FANUC·AIST까지, 일본이 숙련자의 손동작·힘 조절을 로봇 학습 데이터로 옮기려는 흐름을 정리한다.
- 태그: 피지컬 AI, 로봇, 일본, 숙련 전승, 손지능, 모방학습, 촉각 센서
- 수정일: 2026-10-25 · 실제 증보일: 2026-10-25 · 검토: needs_review
- 관련 문서: `ai-compute-scaling-inference`, `ai-economic-transition`

## 절 목차

글자 수는 하위 절을 제외한 그 절 고유 본문의 분량이다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.

- (도입부) (429자) — 피지컬 AI의 중요한 문제는 로봇 팔을 더 빠르게 움직이는 것이 아니라, 사람이 손으로 자연스럽게 처리해 온 미세한 조정과 판단을 어떻게 기계가 배울 수 있게 하느냐에 있다.
- 손지능은 무엇을 뜻하는가 (409자) — 여기서 “손지능”은 단순한 로봇 손의 자유도나 악력을 뜻하지 않는다.
- 인터넷에 없는 데이터: 숙련공의 몸 (350자) — 언어모델은 인터넷의 막대한 텍스트를 학습 재료로 삼을 수 있었다.
- 가와사키: Successor에서 Plesio로 (749자) — 가와사키중공업의 Successor는 이 발상을 이른 시기에 분명하게 드러낸 사례다.
- Honda: 인간용 도구를 쓰는 손 (727자) — Honda의 다지 로봇핸드는 손 자체의 하드웨어를 극단적으로 밀어붙이는 사례로 제시되었다.
- Toyota: 숙련 전승을 Physical AI의 문제로 (554자) — Toyota Frontier Research Center는 Physical AI 연구를 소개하면서 노동력 부족과 skill transfer를 직접적인 문제로 제시한 것으로 정리되었다.
- Yaskawa: 정해진 경로에서 상황 적응으로 (627자) — 야스카와전기의 MOTOMAN NEXT는 기존 산업용 로봇의 세밀한 사전 프로그래밍에서 벗어나, 작업의 목적을 이해하고 주변 상황에 맞춰 계획하는 방향을 대표하는 사례로 제시되었다.
- FANUC: 모방학습과 디지털 트윈의 결합 (663자) — FANUC는 NVIDIA의 로봇 학습 생태계와 결합해 Physical AI를 전개하는 사례로 제시되었다.
- 정부와 AIST: 현장 데이터를 기반모델로 (844자) — 일본 정부 차원에서도 Physical AI와 산업 현장 데이터를 하나의 정책 문제로 묶는 움직임이 제시되었다.
- 미국·중국·일본의 세 경로는 같은 경주가 아니다 (624자) — 현재의 사례들을 비교하는 하나의 분석 틀은 다음과 같다.
- 은퇴는 노동력 감소이자 데이터 소실이다 (427자) — 숙련공의 은퇴는 단순히 사람 수가 줄어드는 사건이 아니다.
- 대규모 계산 인프라와 손지능의 접점 (587자) — 손지능의 데이터가 확보되어도 그것을 일반화하려면 많은 계산이 필요하다.
- 검토 상태 (446자) — 이 글은 현재 확인 가능한 논의에서 이미 제시된 기업·정부·연구기관의 공개 링크와 수치를 총합했다.

## 장부에 기록된 반영 지식

- **손지능은 무엇을 뜻하는가**
  - 손지능과 피지컬 AI의 범위 · `ing-20261025-ai-compute-physical-ai`
- **인터넷에 없는 데이터: 숙련공의 몸**
  - 숙련공의 암묵지를 로봇 데이터로 바꾸는 문제 · `ing-20261025-ai-compute-physical-ai`
- **가와사키: Successor에서 Plesio로**
  - 가와사키 Successor와 Plesio의 숙련 전승 접근 · `ing-20261025-ai-compute-physical-ai`
- **Honda: 인간용 도구를 쓰는 손**
  - Honda의 다지 로봇핸드와 Avatar Robot · `ing-20261025-ai-compute-physical-ai`
- **Toyota: 숙련 전승을 Physical AI의 문제로**
  - Toyota의 숙련 전승형 Physical AI · `ing-20261025-ai-compute-physical-ai`
- **Yaskawa: 정해진 경로에서 상황 적응으로**
  - Yaskawa의 상황 적응형 로봇과 변형 물체 조작 · `ing-20261025-ai-compute-physical-ai`
- **FANUC: 모방학습과 디지털 트윈의 결합**
  - FANUC의 모방학습과 디지털 트윈 · `ing-20261025-ai-compute-physical-ai`
- **정부와 AIST: 현장 데이터를 기반모델로**
  - 일본 정부와 AIST의 Physical AI 기반모델 전략 · `ing-20261025-ai-compute-physical-ai`
- **미국·중국·일본의 세 경로는 같은 경주가 아니다**
  - 미국·중국·일본의 피지컬 AI 경로 비교 · `ing-20261025-ai-compute-physical-ai`
- **은퇴는 노동력 감소이자 데이터 소실이다**
  - 숙련공 은퇴와 학습 데이터 소실의 시간제한 · `ing-20261025-ai-compute-physical-ai`
- **대규모 계산 인프라와 손지능의 접점**
  - 대규모 AI 계산 인프라와 로봇 학습의 접점 · `ing-20261025-ai-compute-physical-ai`

## 확인된 의미 관계

- ← `ai-compute-scaling-inference` · illustrates · 근거 절(ai-compute-scaling-inference): 피지컬 AI: 현실세계가 다음 스케일링 대상이 될 때
