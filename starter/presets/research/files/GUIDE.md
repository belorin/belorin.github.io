# 연구 노트 편집 지침

> [WIKI_PROTOCOL.md](./WIKI_PROTOCOL.md)에 더해, 이 위키는 **주장과 근거의 구분**을 가장 중요하게 지킨다.

## 문서 유형

| 유형 | 쓰는 경우 | 틀 | 분류 |
| --- | --- | --- | --- |
| `concept` | 개념의 정의, 구분, 쓰임 | `templates/concept.md` | 개념 |
| `paper` | 논문·책·보고서 한 편의 노트 | `templates/paper.md` | 문헌 |
| `question` | 연구 질문과 가설 | `templates/question.md` | 질문 |
| `method` | 방법·절차·도구 | `templates/method.md` | 방법 |
| `list` | 기준을 갖고 모은 문헌 목록 | `templates/list.md` | 목록 |

## 규칙

- 문서 ID: 문헌은 `paper-<저자성>-<연도>-<핵심어>`, 개념은 `concept-<영문>`, 질문은 `q-<핵심어>`.
- 모든 주장에 근거의 종류를 밝힌다: **문헌**(어느 문헌 노트의 어느 절), **관찰·데이터**, **추론**, **가설**. 근거 없는 주장은 가설로 표시한다.
- 문헌 노트에는 서지 정보와 식별자(DOI 등)를 확인한 것만 쓴다. 읽지 않은 문헌을 읽은 것처럼 요약하지 않는다.
- 문헌 사이의 관계는 `relations.json`에 적극적으로 기록한다: 뒷받침은 `supports`, 반박은 `challenges`, 대조는 `contrasts`, 심화는 `elaborates`. `evidence_section`은 그 관계가 드러나는 절이다.
- `review_state`: 초고는 `unassessed`, 근거를 다시 확인할 것은 `needs_review`, 확인을 마친 것은 `reviewed`.
- 질문 문서는 답이 나와도 지우지 않는다. 답과 그 근거를 덧붙이고 `status`를 `답을 찾음`으로 바꾼다.
