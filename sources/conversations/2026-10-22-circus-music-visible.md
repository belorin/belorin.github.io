# 서커스 음악사 대화 지식 추출 대장 — 확인 가능한 구간

- 처리 날짜: 2026-10-22
- 저장소/브랜치: `belorin/belorin.github.io` / `main`
- 프로토콜: `WIKI_PROTOCOL.md` 1.0 (2026-10-22)
- 대화 원문 공유 URL 및 공식 대화 ID: 미확인
- 접근 범위: 현재 문맥에서 직접 보이는 사용자의 서커스 음악사 심층 정리 촉구, 위키 총합·증보 요청, 그리고 심층 리서치 도구에 전달된 12개 범위의 상세 조사 요청. 앞선 다수 발화는 생략되어 실제 내용을 읽을 수 없고, 심층 리서치 결과 본문도 보이지 않는다.
- 자료 제한: 저장소의 `AGENTS.md`, `WIKI_PROTOCOL.md`, `notes.json`, 관련 `wiki/` 목록과 원고만 확인. 외부 링크는 새로 열람하지 않음.
- 처리 상태: **일부 처리**. 접근 불가 발화 및 리서치 결과의 복원·검증을 주장하지 않음.

## 1. 순차적 확인과 소재 추출

현재 접근 가능한 순서에서 먼저 서커스 음악사를 꼼꼼하게 정리하라는 요청이 확인된다. 이어서 심층 리서치 도구에 전달된 조사 범위에는 아래 12개 주제가 있다. 이는 완료된 조사 결과가 아니라 요청된 조사 과제다.

- S01. 승마극·판토마임·멜로드라마·박람회·유원지·군악대/브라스 밴드의 전사와 상호 영향.
- S02. 18~19세기 영국·유럽의 현대 서커스 형성과 당시 음악의 편성·기능.
- S03. 미국 서커스 산업, 이동식 circus band, 악기 편성과 음악가 노동시장, 군악대·지역 밴드·극장·서커스·무성영화 사이 이동.
- S04. march, galop, waltz, rag, popular song, screamer/circus march, act별 음악 배치, bandmaster의 cue·반복·템포·돌발 상황 대응, 악보와 회고.
- S05. Merle Evans, Karl L. King, Ringling/Barnum 계열과 익명 직업음악가의 급여·고용·투어·노동조건.
- S06. calliope, band organ, carousel/fairground mechanical music의 별도 계보와 서커스 밴드의 관계.
- S07. 'Entry of the Gladiators'의 군악행진곡에서 서커스/광대 표지로의 변천 시점과 통념 검증.
- S08. 레코딩·라디오·영화·유성영화의 영향, 무성영화 극장 음악과의 인적·기술적 연결.
- S09. Wagner적 leitmotif, 멜로드라마·판토마임·발레·서커스의 동작 추적, 무성영화·애니메이션 Mickey Mousing의 관계에서 직접 영향과 구조적 유사성의 구별.
- S10. 전통 circus band 쇠퇴 이후 20세기 후반~2026년 현대·신서커스, Cirque du Soleil의 라이브 음악·오리지널 스코어·실시간 cue.
- S11. 서커스 음악이 재즈처럼 독립 장르사로 정전화되지 않은 이유에 대한 사회사적 설명.
- S12. 아카이브·연주 전통·복원 공연·기관, 20~30곡 시대순 청취 가이드, 연대표·용어사전·참고문헌.

지역 범위는 미국과 뉴올리언스에 한정하지 않고 영국·프랑스·독일/중부유럽과 다른 지역을 비교하라는 요청을 포함한다. 역사 용어 'circus music/circus band music/screamer'와 제안어 '행위결박 음악', '소집음악', '링 레퍼토리', '과잉행진', '실시간 악보 엔진', '서커스성', '서커스 표지음악', '기계환락음악'의 차이도 조사 대상이다.

마지막으로 사용자가 `WIKI_PROTOCOL.md`에 따라 이 대화의 지식을 위키에 총합·증보하라고 명시했다.

## 2. 기존 저장소에서 확인된 독립 지식

- `notes.json#circus-music-questions`: Windjammers Unlimited가 행진곡·갈롭·왈츠·래그·서곡·익살스러운 성격의 곡을 서커스 레퍼토리로 소개한다는 기존 위키 서술. 갈롭은 빠른 2박 계열의 춤곡. 서커스 음악의 기능과 음악 형식을 구별해야 한다는 논점.
- `notes.json#silent-film`: 무성영화의 현장 반주, 전용 악보·cue sheet·범용 분위기 음악의 구별, 1920년대 말 유성영화 전환에 따른 현장 일자리 재편. 개인의 실제 직업 이동은 미확인.
- `notes.json#brass-band`: 뉴올리언스 역사적 브라스 밴드의 목관 참여와 행진·댄스 밴드 겸업 사례. 이를 서커스 전체로 일반화할 수 없음.
- `notes.json#circus-music-questions`: Silly Symphonies 1929~1939년 75편이라는 기존 위키 서술, 바그너→서커스→Mickey Mousing 직접 계보를 단정할 수 없다는 경계.
- 기존 위키에 수록된 기관 링크: Windjammers Unlimited, Library of Congress, D23, NPS, Historic New Orleans Collection. 이번 편집에서는 외부 재열람 없음.

## 3. 논증 구조와 검증 경계

- 문제: 익숙한 '광대 행진곡'의 이미지가 서커스 음악 전체의 역사인가.
- 기존 근거: 여러 형식의 레퍼토리와 공연 기능이 존재한다는 위키 서술.
- 수정된 분석: 음악 형식·공연기술·악기·노동·매체·장소의 여섯 축으로 구별.
- 반례/주의: 같은 기능이 있다고 직접 전승을 입증할 수 없으며, 현대적 기호를 옛 청중에게 소급할 수 없음.
- 미해결: 실제 공연 cue, 개별 회사 편성·급여, 'Entry of the Gladiators'의 상징 변화 시점, 지역별 실증 자료, 20~30곡의 확인 가능한 청취 목록.

## 4. 원고 매핑

- S01~S12 및 여섯 축의 종합: `wiki/circus-music-history.md`, 사이트 문서 `#circus-music-questions`.
- 제안된 여덟 분석어 및 직접 영향/구조적 유사성 구별: `wiki/circus-music-concepts.md`, 사이트 문서 `#circus-music-concepts`.
- 사료·지역·인물·연대표·청취 목록의 확인/미확인 구분: `wiki/circus-music-research-ledger.md`, 사이트 문서 `#circus-music-research-ledger`.
- 기존 관련 문서의 국소 증보: `notes.json#brass-band`, `notes.json#silent-film`.

## 5. 처리하지 못한 내용

이 대화의 생략된 이전 발화와 심층 리서치 결과 본문은 현재 접근할 수 없다. 따라서 대화 전체의 전수 분석, 완전한 1차 사료 검증, 정확한 노동 통계, 20~30곡의 실증적 청취 목록을 완료했다고 주장하지 않는다. 추가 원문이 실제로 제공되면 같은 주제 문서에 증분 병합하고 이 대장을 갱신해야 한다.

## 6. 추가 처리: 서커스 이외의 재즈 대화 요약 (2026-10-22)

이 source-key는 앞선 편집에서 서커스 중심으로 임시 명명되었다. 이번 재처리는 같은 채팅의 비서커스 부분을 추가하는 작업이므로 새로운 공식 대화 ID인 것처럼 별도 식별자를 만들지 않고 이 대장을 증분 갱신한다.

추가 접근 범위는 이 대화의 앞선 여러 차례 발화를 압축한 요약과 저장소의 기존 음악 문서다. 모든 과거 발화의 원문·검색 결과·인용문을 직접 재열람할 수 있는 것은 아니다. 다음 항목은 요약에 명시적으로 남은 지식 소재이며, 원문 직접 인용이나 외부 재검증으로 취급하지 않는다.

- J01. 기타·피아노·콘트라베이스·드럼 4중주의 현장 관찰. 'Hot House', 'Blackbird', 'Watermelon Man', 'Summer'가 언급되었고 'Zhivago'는 실제 연주 여부가 불확실하다. 브러시, 악보를 보는 연주자와 보지 않는 연주자, 눈짓과 즉흥, 기타가 크게 들리고 베이스가 작게 들린 음향 문제가 있다. 공연 장소·날짜·개인 식별 정보는 게시하지 않는다.
- J02. 피치카토와 아르코, 콘트라베이스의 마이크·피에조 픽업, 전기 베이스의 솔리드바디·자기 픽업과 증폭, 저음의 어택과 지속, 워킹 베이스, 컴핑과 리듬 섹션의 역할. 선호 음색과 객석 음량을 구분한다.
- J03. 행진악단의 금관·목관·타악, 브라스 밴드의 실제 편성, 드럼키트의 발 페달과 손발 통합, 대형 악단의 섹션 편곡, 소규모 밴드로의 기능 재배치, 현대 보컬·기타·베이스·건반·드럼 조합의 역사적 우연성과 노동 조건.
- J04. 어택과 대선율의 개념, 코러스와 주제·독주, 악보와 즉흥의 공존, 눈짓·브러시·연주자 상호 반응. 들뢰즈의 배치·생성과의 연결은 음악가의 의도에 대한 사실이 아니라 해석적 비유다.
- J05. 뉴올리언스의 중요성과 유일한 기원이라는 통념의 차이, 미주리 래그타임, 루이빌·멤피스 저그 밴드, 중서부·남서부 territory band, 시카고, 녹음·정전·생존자 편향. 빅밴드·비밥·하드밥·모달·프리·퓨전·현대 비정형 편성을 단선적 승리사로 보지 않는다.
- J06. 무성영화의 극장 현장 음악, 1920년대 말~1930년대 유성영화 전환, 짧은 고용 호황과 축소, 녹음 한 번의 대규모 재생이 만드는 노동 수요 변화. 대화에서 제시된 약 22,000명·35,000명 수치, Akron Strand, St. Louis/Philadelphia의 노동 갈등, AFM의 'canned music' 캠페인, Simon Bucharoff와 Harry Hopkins, WPA Federal Music Project, 후대 AFM 녹음 금지·Music Performance Trust Fund는 미검증 주장으로 보존한다.
- J07. 1923~2026년 26개 시대순 재즈 청취 지점. King Oliver, Louis Armstrong, Duke Ellington, Benny Goodman, Charlie Parker·Dizzy Gillespie, Art Blakey, Miles Davis, Ornette Coleman, Bill Evans, John Coltrane, Herbie Hancock, Pat Metheny·Jaco Pastorius, Weather Report, Kurt Rosenwinkel, The Bad Plus, Snarky Puppy, Kamasi Washington, Yussef Kamaal, Sons of Kemet, Immanuel Wilkins, Makaya McCraven, Mary Halvorson, Tomeka Reid, Ambrose Akinmusire. 개별 곡과 앨범을 구별하며, 특히 2025~2026년 작품명·연대는 재확인 필요.
- J08. 현대 재즈 생태계의 다층적 위계: DownBeat Critics Poll, JJA Jazz Awards, 그래미, Billboard Jazz Albums, JazzWeek, Blue Note·ECM·Nonesuch·International Anthem·Pi·Mack Avenue, SFJAZZ·Jazz at Lincoln Center·North Sea Jazz·Newport·Montreux·Montréal, Hancock Institute·Sarah Vaughan·American Piano Awards·Essentially Ellington·Keep an Eye, jazzahead!, Jazz Touring Network·Jazz Road, NEA Jazz Masters. 2026년 수상자·차트·대회 개최 정보는 원자료 재확인 필요.
- J09. 2026년 17세인 가상 재즈 베이시스트의 35세까지 7단계 모형: 청소년 앙상블, 음악학교와 유급 공연, 사이드맨 신뢰, 리더 정체성과 앨범, 쇼케이스·투어, 비평·수상, 국제 활동·교육의 병행. 실제 인물이나 보편적 성공 순서가 아니다.
- J10. 다른 악기·편성·음악가의 '패배'와 노동시장을 역사 서술에 포함해야 한다는 반복된 문제의식. 음악의 형식·공연 기술·노동·매체·지역이 상호작용한다는 편집상 종합은 사료로 검증된 단일 이론이 아니다.

## 7. 비서커스 원고 매핑

- J01·J02·J04: `wiki/jazz-live-quartet-case.md`, `wiki/jazz-dialogue.md`, `wiki/jazz-listening.md`, `wiki/double-bass.md`, `wiki/electric-bass.md`, `wiki/rhythm-section.md`.
- J03·J05·J10: `wiki/jazz-ensemble-labor.md`, `wiki/jazz-history-plural.md`, `wiki/drum-kit.md`, `wiki/brass-band.md`, `wiki/big-band.md`.
- J06: `wiki/silent-film-musician-labor.md`, `wiki/silent-film.md`.
- J07: `wiki/jazz-chronological-listening.md`.
- J08: `wiki/jazz-current-ecosystem.md`.
- J09: `wiki/jazz-career-path.md`.
- 전반적인 길잡이: `wiki/jazz-to-ai.md`.
- 웹사이트 게시 데이터: `notes.json`의 기존 10개 문서 증보, 7개 새 문서 생성.

## 8. 원문·출처의 경계

이번 편집에서 보이는 것은 이전 대화의 상세 요약과 저장소에 누적된 문서다. 요약에 빠진 발화나 당시 웹 검색의 정확한 결과를 완전히 복원했다고 주장하지 않는다. 기존 `jazz-to-ai` 문서에는 ChatGPT 공유 링크가 있지만, 그 링크의 내용과 이 대화의 모든 발화가 일치하는지 이번 작업에서 확인하지 않았다. 기존 위키에 이미 인용된 기관 링크는 보존하되 새 외부 조사를 하지 않았다.

이 대장에는 공연장·정확한 방문일·개인 식별 정보를 넣지 않았다. 공개 가능한 음악 지식과 논증만 추출했다. 대화 전체의 전수 처리 상태는 **일부**이며, 현재 접근 가능한 요약과 기존 위키에 근거한 범위는 처리했다.
