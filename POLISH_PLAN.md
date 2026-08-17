# LAST SONG! — POLISH & GAMEPLAY ENHANCEMENT PLAN

이 문서는 LAST SONG!의 기능 수를 늘리는 계획이 아니다.

목표는 현재 존재하는 게임을 기반으로

**“바이브코딩으로 빠르게 만든 프로토타입”처럼 보이는 상태에서 → “명확한 아트 디렉션과 손맛을 가진 인디게임”으로 발전시키는 것**이다.

작업 전 반드시 다음을 먼저 읽는다.

1. `GAME_SPEC.md`
2. `AGENTS.md`
3. 현재 프로젝트의 Scene / Prefab / Script 구조
4. 이 문서 `POLISH_PLAN.md`

**Current Pass:** `PASS 1` A–E applied. Wait for playtest.  
**Status:** 코드 수정은 승인된 가독성 항목만.

---

# 0. 가장 중요한 원칙

## 기능보다 완성도

새로운 기능을 발견했다고 임의로 추가하지 않는다.

항상 다음 순서를 따른다.

```text
READABILITY
↓
CONSISTENCY
↓
GAME FEEL
↓
GAMEPLAY DEPTH
↓
CONTENT
```

현재 시스템이 충분히 재미있고 읽기 쉬워지기 전에는 콘텐츠를 확장하지 않는다.

---

# 1. 게임의 핵심 정체성

LAST SONG!은 리듬게임이 아니다.

> 공연이 끝날 때까지 무대에서 발생하는 사고를 해결하며 음악을 지키는 1~4인 협동 파티게임.

게임의 핵심 감정은 다음과 같다.

```text
평화로운 공연
↓
"어? 기타가 안 들리는데?"
↓
사고 발견
↓
급하게 뛰어감
↓
다른 사고 발생
↓
친구들과 혼란
↓
간신히 해결
↓
FULL BAND 복귀
↓
관객 폭발
↓
또 사고
```

이 감정 곡선을 모든 디자인의 기준으로 사용한다.

---

# 2. VISUAL TARGET

픽셀 아트를 사용한다.

하지만 단순히 저해상도 Sprite를 사용하는 것을 픽셀 아트 스타일이라고 판단하지 않는다.

화면 전체에서 다음 요소가 통일되어야 한다.

* Pixel Density
* Palette
* Sprite Scale
* Outline
* Lighting
* Animation Timing
* UI
* Effects
* Camera

특정 Asset 하나가 예쁜 것보다 화면 전체가 하나의 게임처럼 보이는 것이 더 중요하다.

---

# PASS 1 — VISUAL AUDIT

코드를 수정하기 전에 현재 게임의 시각적 문제를 찾아낸다.

결과를 `VISUAL_AUDIT.md`에 기록한다. 승인 없이 수정하지 않는다.

---

# PASS 2 — COLOR SYSTEM

프로젝트 전체 Palette를 조사한다. 색에 역할을 부여한다.

Background: 낮은 채도, 낮은 대비.  
Character: 배경보다 높은 채도/명도.  
Interactable: 캐릭터 다음으로 발견.  
Accident: 가장 빠른 시선.  
Success: 사고 색과 명확히 구분.

금지: Neon Glow, Bloom, Blur, Gradient UI, Glassmorphism, SaaS Panel, 과도한 Rounded Rect, 서로 다른 Outline 두께, 필요 없는 그림자.

---

# PASS 3 — UI REDESIGN

UI를 가능한 한 줄인다. 사고는 텍스트 팝업으로 풀지 않는다.

---

# PASS 4 — CAMERA

플레이어 주변은 쉽게 파악하되, 무대 전체를 완벽하게 감시할 수는 없는 정도.

Camera Shake는 큰 사고 / 연쇄 / 위기 / Full Band 복귀 / 성공에만. 이동·평범한 Pickup·UI 클릭에는 쓰지 않는다.

---

# PASS 5 — PLAYER MOVEMENT FEEL

새 Movement 시스템을 만들지 않는다. 빠른 방향 전환이 중요하다. Trail 금지.

---

# PASS 6 — PICKUP FEEL

`E → 1px Pop → 짧은 애니 → 손 위치 Snap → SFX → 이동`  
입력을 기다리게 만들지 않는다.

---

# PASS 7 — CARRY & DROP

멀리서도 든 아이템이 구분되어야 한다. Drop은 짧은 Arc/Pop + 1~2px Bounce + SFX. 과한 물리 금지.

---

# PASS 8 — ACCIDENT FEEDBACK

1. 뭔가 잘못됐다 2. 대략 어디인지. 해결 방법까지 즉시 알려줄 필요는 없다.

Equipment Shake → Stem 변화 → ! Pop → SFX → 근처 관객. 게임은 멈추지 않는다.

---

# PASS 9 — REPAIR FEEL

E Hold + HP Bar가 기본값이 아니어야 한다. 월드 기반 피드백을 검토한다.

---

# PASS 10 — RESOLVE FEEDBACK

짧은 보상. 컨트롤을 빼앗는 긴 애니 금지.

---

# PASS 11 — SIGNATURE MUSIC SYSTEM

음악은 배경이 아니라 게임 상태. Stem 동기. FULL BAND 복귀는 대표 쾌감. 남용 금지.

---

# PASS 12 — AUDIENCE AS UI

관객은 살아있는 HP Bar. UI Bar를 보지 않아도 상태를 대략 이해해야 한다.

---

# PLAYTEST GATE

여기서 반드시 멈춘다. 직접 플레이테스트한 뒤에만 Depth / Chaos / Co-op / Content.

---

# PASS 13 — GAMEPLAY DEPTH

SYSTEM A Severity / B Limited Resources / C Accident Combination.

---

# PASS 14 — EMERGENT CHAOS

Water / Cable trip / Crowd invasion. Telegraph 없는 Random Punishment 금지.

---

# PASS 15 — MAP DESIGN

맵은 동선 퍼즐. 양쪽 끝 사고가 중앙에서 교차해야 한다.

---

# PASS 16 — CO-OP ROLES

싱글 핵심 완성 후. 역할은 강점이지 필수 조건이 아니다.

---

# PASS 17 — CHARACTER READABILITY

색만으로 구분하지 않는다. 16×24에서도 실루엣.

---

# PASS 18 — CONTENT EXPANSION

재미 검증 후. 스테이지마다 새 기믹 최소 하나.

---

# PASS 20 — DIFFICULTY DIRECTOR

스폰 간격만으로 난이도를 만들지 않는다. 평온함이 있어야 혼란이 재미있다.

---

# PASS 21 — TUTORIAL

텍스트 최소화. 첫 사고로 규칙을 배운다.

---

# PASS 22 — COMPETITION DEMO

설명 없이 30초에 이해되는 흐름.

---

# 23. POLISH CHECKLIST

Readability / Responsiveness / Feedback / Consistency / Purpose / Chaos

---

# 24. 절대 하지 말 것

요청하지 않은 새 기능. 전체 리팩터. 동작하는 시스템 이유 없는 교체. Asset Store 스타일 혼용. UI Panel로 문제 해결. 모든 피드백에 Shake. 모든 사고를 E Hold. 사고 수 = 콘텐츠. 현재 단계 온라인.

---

# 25. Cursor 작업 방식

각 PASS 시작: Scene / Prefab / Script 확인 → 재사용 → 범위 확정 → 작업.

끝나면 CHANGED / WHY / VISUAL IMPACT / GAMEPLAY IMPACT / UNITY SETUP / TEST / BEFORE NEXT PASS 후 **멈춘다.**

---

# 26. 현재 실행 순서

PASS 1 Visual Audit → 2 Color → 3 UI → 4 Camera → 5 Movement → 6 Pickup → 7 Carry/Drop → 8 Accident → 9 Repair → 10 Resolve → 11 Stem → 12 Audience → **PLAYTEST GATE**

---

# 27. 최종 품질 기준

기능이 가장 많은 게임이 아니다. “야 기타 나갔어!” → 케이블 연결 → GUITAR RETURNS → 관객 점프 → 마이크 피드백 → “아 미친ㅋㅋ” 이 장면이 나오면 성공이다.
