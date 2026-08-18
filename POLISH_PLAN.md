# LAST SONG! — POLISH & GAMEPLAY ENHANCEMENT PLAN

이 문서는 LAST SONG!의 기능 수를 늘리는 계획이 아니다.

목표는 현재 존재하는 게임을 기반으로

**“바이브코딩으로 빠르게 만든 프로토타입”처럼 보이는 상태에서 → “명확한 아트 디렉션과 손맛을 가진 인디게임”으로 발전시키는 것**이다.

작업 전 반드시 다음을 먼저 읽는다.

1. `GAME_SPEC.md`
2. `AGENTS.md`
3. 현재 프로젝트의 Scene / Prefab / Script 구조
4. 이 문서 `POLISH_PLAN.md`

**Current Pass:** `PASS 1` F–H 적용됨 (바닥 타일 / 장비 y정렬 / 사고 스프라이트).  
**Status:** 플레이테스트 대기. 승인 없이 PASS 2 Color System을 시작하지 않는다.

현재 실행 대상은 Unity가 아니다. 플레이 가능한 슬라이스는 HTML5 canvas (`src/`, `assets/sprites/`). Unity Scene / Prefab은 아직 없다.

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

## 목표

코드를 수정하기 전에 현재 게임의 시각적 문제를 찾아낸다.

먼저 현재 Scene을 분석하고 다음 항목을 점검한다.

### Pixel Consistency

확인:

* PPU가 서로 다른 Sprite
* Filter Mode가 Point가 아닌 Sprite
* Compression으로 픽셀이 흐려지는 Asset
* 서로 다른 Pixel Density
* Sprite Scale이 소수점으로 왜곡되는 오브젝트
* Pixel Perfect Camera 설정
* 카메라 이동 중 Pixel Jitter

---

### Character Readability

확인:

* 배경과 캐릭터가 섞이는가?
* 캐릭터 방향을 쉽게 파악할 수 있는가?
* 들고 있는 아이템이 잘 보이는가?
* 캐릭터가 무대 장비 뒤에 이상하게 가려지는가?
* 캐릭터끼리 쉽게 구분되는가?

---

### Stage Readability

플레이어는 1초 안에 다음을 구분할 수 있어야 한다.

```text
STAGE

BACKSTAGE

AUDIENCE

INTERACTABLE

ACCIDENT
```

구역을 거대한 UI Text로 설명하지 않는다.

바닥 재질, 조명, 구조, 장비 배치 등 환경 자체로 구분한다.

---

### Object Hierarchy

시각적 우선순위:

```text
BACKGROUND
    ↓
STAGE
    ↓
EQUIPMENT
    ↓
PLAYER
    ↓
INTERACTABLE
    ↓
ACCIDENT
```

배경 소품이 사고 아이콘보다 눈에 띄면 안 된다.

---

# PASS 2 — COLOR SYSTEM

프로젝트 전체 Palette를 조사한다.

비슷하지만 미묘하게 다른 색이 계속 추가되고 있다면 정리한다.

색상에는 역할을 부여한다.

### Background

낮은 채도.

낮은 대비.

### Character

배경보다 높은 채도와 명도 대비.

### Interactable

캐릭터 다음으로 쉽게 발견 가능.

### Accident

가장 빠르게 시선을 끌 수 있어야 한다.

### Success

사고 색상과 명확하게 구분.

---

## 금지

임의로 다음 스타일을 추가하지 않는다.

* Neon Glow 남용
* Bloom 남용
* Blur
* Gradient UI
* Glassmorphism
* SaaS Dashboard 같은 Panel
* 과도한 Rounded Rectangle
* 서로 다른 Outline 두께
* 필요 없는 그림자

픽셀게임의 형태와 움직임으로 정보를 전달한다.

---

# PASS 3 — UI REDESIGN

UI를 가능한 한 줄인다.

게임 화면에서 항상 필요한 정보만 남긴다.

추천:

```text
┌──────────────────────────────┐

     공연 만족도       01:42

████████████████░░░░

        GAME WORLD

└──────────────────────────────┘
```

화면 대부분은 게임 월드여야 한다.

---

## 사고 UI

다음과 같은 텍스트를 기본 해결책으로 사용하지 않는다.

> 기타 케이블이 빠졌습니다!

대신:

```text
AMP

💥
!

Cable Sprite 변화

Guitar Stem 감소

관객 반응
```

여러 감각을 동시에 사용한다.

---

# PASS 4 — CAMERA

카메라는 플레이 감각의 일부다.

점검:

* 캐릭터가 너무 큰가?
* 무대 전체가 너무 많이 보이는가?
* 사고 위치를 찾는 재미가 사라지는가?
* 반대로 너무 좁아서 사고가 불합리하게 느껴지는가?

목표:

플레이어 주변 상황은 쉽게 파악할 수 있지만 무대 전체를 완벽하게 감시할 수는 없는 정도.

---

## Camera Shake

항상 사용하지 않는다.

사용 가능:

* 큰 사고
* 사고 연쇄
* 공연 위기
* Full Band 복귀
* 공연 성공

사용 금지:

* 일반 이동
* 평범한 Pickup
* UI 클릭

---

# PASS 5 — PLAYER MOVEMENT FEEL

새 Movement 시스템을 만들지 않는다.

현재 시스템을 분석한 뒤 개선한다.

확인:

* 가속이 너무 느리지 않은가?
* 멈출 때 미끄러지지 않는가?
* 대각선 속도가 동일한가?
* 좁은 통로를 이동하기 쉬운가?
* 다른 플레이어와 이동할 때 답답하지 않은가?

이 게임에서는 정밀 플랫폼 조작보다 빠른 방향 전환이 중요하다.

---

## Movement Feedback

필요하다면:

* 작은 Walk Animation
* 방향 전환
* 먼지 1~2px Particle
* 빠르게 움직일 때 짧은 Animation 변화

과도한 Trail은 사용하지 않는다.

---

# PASS 6 — PICKUP FEEL

Pickup은 매우 자주 사용하는 행동이므로 만족스러워야 한다.

현재:

```text
Player
↓
E
↓
Item Parent 변경
```

만 존재한다면 부족하다.

목표:

```text
E

↓

Item 1px Pop

↓

짧은 Pickup Animation

↓

손 위치 Snap

↓

SFX

↓

이동
```

전체 반응은 매우 빠르게 이루어진다.

플레이어 입력을 기다리게 만들지 않는다.

---

# PASS 7 — CARRY & DROP

들고 있는 아이템은 멀리서도 구분되어야 한다.

확인:

* 캐릭터 Sprite에 가려지지 않는가?
* 다른 장비와 혼동되지 않는가?
* 캐릭터 방향에 따라 자연스럽게 이동하는가?

Drop:

```text
Q

↓

짧은 Arc 또는 Pop

↓

바닥 착지

↓

1~2px Bounce

↓

SFX
```

과도한 실제 물리 시뮬레이션은 필요하지 않다.

---

# PASS 8 — ACCIDENT FEEDBACK

사고는 이 게임의 핵심이다.

사고 발생 순간 플레이어가 다음 두 가지를 알아야 한다.

1. 뭔가 잘못됐다.
2. 대략 어디에서 발생했다.

하지만 즉시 해결 방법까지 모두 알려줄 필요는 없다.

---

## Accident Sequence

추천:

```text
Equipment Malfunction

↓

2~3 Frame Shake

↓

Instrument Stem 변화

↓

! Pop

↓

Accident SFX

↓

Nearby Audience Reaction
```

전체 연출은 짧게 한다.

게임 진행을 멈추지 않는다.

---

# PASS 9 — REPAIR FEEL

수리는 단순한 E Hold처럼 느껴지지 않도록 한다.

수리 중:

* 캐릭터 Animation
* 장비 작은 움직임
* Repair SFX
* 작은 Progress Feedback

Progress Bar를 무조건 사용하는 것은 피한다.

가능하면:

```text
🔧
🔧🔧
🔧🔧🔧
```

처럼 월드 기반 Feedback을 검토한다.

---

# PASS 10 — RESOLVE FEEDBACK

사고를 해결하는 순간은 작은 보상이어야 한다.

```text
Repair Complete

↓

장비 정상 Sprite

↓

짧은 Success Effect

↓

Instrument Stem Fade In

↓

Nearby Audience Jump

↓

Satisfaction +

↓

Player immediately regains control
```

컨트롤을 빼앗는 긴 Animation은 사용하지 않는다.

---

# PASS 11 — SIGNATURE MUSIC SYSTEM

이 게임에서 가장 중요한 Signature Mechanic이다.

음악은 배경음악이 아니다.

**게임 상태 그 자체다.**

곡은 Stem으로 관리한다.

```text
VOCAL
GUITAR
BASS
DRUM
```

모든 Stem은 같은 DSP Time 기준으로 재생한다.

절대로 Sync가 틀어지지 않도록 한다.

---

## 정상

```text
VOCAL ██████████
GUITAR ██████████
BASS ██████████
DRUM ██████████
```

---

## Guitar Accident

```text
VOCAL ██████████
GUITAR ░░░░░░░░░░
BASS ██████████
DRUM ██████████
```

---

## Multiple Accidents

```text
VOCAL ░░░░░░░░░░
GUITAR ░░░░░░░░░░
BASS ██████████
DRUM ██████████
```

음악 자체가 점점 무너져야 한다.

---

## FULL BAND RECOVERY

여러 사고로 음악이 크게 무너진 상태에서 마지막 사고까지 해결하면 특별한 Feedback을 준다.

```text
LAST REPAIR

↓

0.05 sec emphasis

↓

ALL STEMS RETURN

↓

Audience Jump

↓

Stage Reaction

↓

Small Camera Punch

↓

Satisfaction Bonus
```

이 순간을 LAST SONG!의 대표적인 쾌감으로 만든다.

남용하지 않는다.

---

# PASS 12 — AUDIENCE AS UI

관객은 배경 Decoration이 아니다.

관객은 살아있는 HP Bar다.

High Satisfaction:

```text
\o/  \o/  \o/
 |    |    |
```

점프 / 손 흔들기 / 적극적 반응.

Medium:

일반적인 공연 관람.

Low:

가만히 있음 / 팔짱 / 일부 야유.

Critical:

일부 관객이 떠나거나 공연에 관심을 잃는다.

UI Bar를 보지 않아도 상태를 대략 이해할 수 있어야 한다.

---

# PASS 13 — GAMEPLAY DEPTH

여기까지 완료되기 전에는 사고 종류를 대량 추가하지 않는다.

이제 기존 시스템에 의사결정을 추가한다.

---

# SYSTEM A — ACCIDENT SEVERITY

모든 사고가 같은 중요도를 갖지 않는다.

예:

```text
LOW

드럼 스틱 하나 분실

MEDIUM

기타 줄 끊어짐

HIGH

보컬 마이크 고장

CRITICAL

전체 전원 문제
```

플레이어가 어떤 문제부터 해결할지 판단해야 한다.

---

# SYSTEM B — LIMITED RESOURCES

모든 도구를 무한 제공하지 않는다.

예:

```text
Spare Guitar ×1

Cable ×2

Drum Stick ×3

Battery ×2
```

단, 플레이어가 아무것도 할 수 없는 Soft Lock은 발생하지 않아야 한다.

자원은 필요하면 다시 준비할 방법이 존재해야 한다.

---

# SYSTEM C — ACCIDENT COMBINATION

게임의 혼돈은 단순히 사고 발생 속도를 높여서 만들지 않는다.

**시스템끼리 충돌해서 만들어야 한다.**

예:

```text
Cable Accident

+

Drum Accident

↓

Players cross same narrow path

↓

Collision / Confusion

↓

Delayed Repair

↓

Audience Satisfaction ↓
```

---

# PASS 14 — EMERGENT CHAOS

향후 다음 시스템을 검토한다.

## Water

관객이 물을 던짐.

```text
Water
↓
Wet Floor
↓
Player slips
↓
Held Item drops
```

---

## Cable

바닥 케이블이 이동에 영향을 줄 수 있음.

```text
Loose Cable
↓
Player trips
↓
Item Drop
```

---

## Crowd Invasion

관객이 무대로 올라옴.

```text
Crowd
↓
Movement obstruction
↓
Equipment collision
↓
Additional accident possibility
```

중요:

Random Punishment가 되어서는 안 된다.

발생 전에 읽을 수 있는 Telegraph가 있어야 한다.

---

# PASS 15 — MAP DESIGN

맵은 예쁜 방이 아니다.

**플레이어의 동선을 만드는 퍼즐이다.**

무대 양쪽 끝에 서로 다른 사고가 발생했을 때 플레이어들이 자연스럽게 중앙에서 만날 수 있도록 한다.

예:

```text
           AUDIENCE

─────────────────────────

MIC       DRUM       GUITAR

      \           /

        NARROW
        CENTER

      /           \

AMP                 PEDAL

─────────────────────────

        BACKSTAGE

GUITAR   CABLE   STICK
```

---

## 좋은 맵

사고가 발생하면 플레이어의 경로가 교차한다.

## 나쁜 맵

모든 장비가 넓게 떨어져 있고 플레이어끼리 만날 이유가 없다.

---

# PASS 16 — CO-OP ROLES

싱글플레이 핵심이 완성된 후 적용한다.

캐릭터에게 작은 역할 차이를 줄 수 있다.

예:

### Guitarist

악기 관련 수리 +20~30%.

### Drummer

무거운 장비 운반 패널티 감소.

### Vocalist

관객 만족도를 순간적으로 회복 가능.

### Stage Staff

아이템 운반 또는 범용 수리에 강함.

절대로 특정 캐릭터가 없으면 해결할 수 없는 사고를 만들지 않는다.

역할은 강점이지 필수 조건이 아니다.

---

# PASS 17 — CHARACTER READABILITY

멀티플레이에서 캐릭터는 색만 달라서는 안 된다.

다음을 활용한다.

* Hair silhouette
* Instrument
* Clothing shape
* Animation
* Accessory

16×24 정도의 작은 Sprite에서도 실루엣으로 구분 가능해야 한다.

---

# PASS 18 — CONTENT EXPANSION

여기까지 재미가 검증된 이후에만 콘텐츠를 늘린다.

공연장 진행:

```text
학교 축제

↓

홍대 소형 라이브클럽

↓

대학 축제

↓

야외 공연

↓

Music Festival

↓

Arena
```

각 Stage는 최소 하나의 새로운 Gameplay Mechanic을 가져야 한다.

단순 배경 교체는 새로운 Stage로 간주하지 않는다.

---

# 19. STAGE EXAMPLES

## School Festival

Tutorial.

사고 종류 적음.

---

## Live Club

무대가 매우 좁음.

케이블과 장비가 많음.

---

## University Festival

무대 넓음.

관객 난입 등장.

---

## Outdoor Festival

비 / 물 / 전기 문제.

---

## Music Festival

대형 장비.

여러 사고 동시 발생.

---

# PASS 20 — DIFFICULTY DIRECTOR

난이도를 단순히 사고 Spawn Interval 감소로 만들지 않는다.

다음 요소를 조합한다.

```text
Accident Count

Severity

Distance

Required Item

Resource Availability

Stage Layout

Interaction

Timing
```

---

## 공연 감정 곡선

3분 공연 기준:

```text
0:00

안정

↓

0:30

첫 사고

↓

1:00

익숙해짐

↓

1:30

사고 중첩

↓

2:00

잠시 회복

↓

2:20

Final Chaos

↓

2:50

마지막 위기

↓

3:00

FINISH
```

처음부터 끝까지 계속 정신없는 상태로 만들지 않는다.

**평온함이 있어야 혼란이 재미있다.**

---

# PASS 21 — TUTORIAL

텍스트 튜토리얼을 최소화한다.

첫 사고를 이용한다.

```text
공연 시작

↓

기타가 갑자기 사라짐

↓

AMP !

↓

Backstage Cable Bounce

↓

Player 자연스럽게 이동

↓

Cable Pickup

↓

AMP에 접근

↓

Interaction

↓

GUITAR RETURNS

↓

Audience Cheers
```

플레이어는 설명을 읽는 것이 아니라 플레이하면서 규칙을 배운다.

---

# PASS 22 — COMPETITION DEMO

대회용 빌드에서는 첫 30초가 매우 중요하다.

관람자가 짧게 보더라도 다음을 이해할 수 있어야 한다.

```text
"밴드 공연 게임이구나."

↓

"어? 기타 소리가 사라졌다."

↓

"케이블이 빠졌구나."

↓

"저걸 가져가서 고치는 거구나."

↓

"와, 고치니까 실제 기타가 다시 들어온다."

↓

"아 또 사고 났어ㅋㅋ"
```

이 흐름이 설명 없이 전달되는 것이 목표다.

---

# 23. POLISH CHECKLIST

각 기능을 완료할 때 다음을 검사한다.

### Readability

무슨 일이 일어났는지 바로 알 수 있는가?

### Responsiveness

입력 후 즉시 반응하는가?

### Feedback

행동 성공/실패를 느낄 수 있는가?

### Consistency

기존 아트 스타일과 같은 게임처럼 보이는가?

### Purpose

게임의 핵심 재미를 강화하는가?

### Chaos

다른 시스템과 재미있는 상황을 만들 수 있는가?

---

# 24. 절대 하지 말 것

요청하지 않은 새 기능을 추가하지 않는다.

게임 전체를 한 번에 리팩터링하지 않는다.

이미 동작하는 시스템을 이유 없이 교체하지 않는다.

Asset Store 느낌의 서로 다른 스타일을 섞지 않는다.

UI Panel을 계속 추가해서 문제를 해결하지 않는다.

모든 피드백에 Camera Shake를 사용하지 않는다.

모든 사고를 E Hold로 해결하지 않는다.

사고 수만 늘려서 콘텐츠가 많다고 판단하지 않는다.

온라인 멀티플레이를 현재 단계에서 구현하지 않는다.

---

# 25. Cursor 작업 방식

각 PASS를 시작할 때 반드시:

1. 관련 Scene을 확인한다.
2. 관련 Prefab을 확인한다.
3. 관련 Script를 읽는다.
4. 기존 구현을 재사용할 방법을 찾는다.
5. 변경 범위를 정한다.

그 후 작업한다.

한 PASS가 끝나면 다음 형식으로 보고한다.

## CHANGED

무엇을 변경했는가.

## WHY

왜 변경했는가.

## VISUAL IMPACT

화면에서 무엇이 달라지는가.

## GAMEPLAY IMPACT

플레이 감각에서 무엇이 달라지는가.

## UNITY SETUP

내가 Editor에서 직접 해야 하는 작업.

## TEST

테스트 방법.

## BEFORE NEXT PASS

다음 단계 전에 내가 확인해야 할 것.

그리고 멈춘다.

내 승인 없이 다음 PASS를 시작하지 않는다.

---

# 26. 현재 실행 순서

지금부터 다음 순서를 따른다.

```text
PASS 1
Visual Audit

↓

PASS 2
Color System

↓

PASS 3
UI

↓

PASS 4
Camera

↓

PASS 5
Movement Feel

↓

PASS 6
Pickup Feel

↓

PASS 7
Carry / Drop

↓

PASS 8
Accident Feedback

↓

PASS 9
Repair Feel

↓

PASS 10
Resolve Feedback

↓

PASS 11
Music Stem

↓

PASS 12
Audience

↓

PLAYTEST GATE
```

여기서 반드시 멈춘다.

게임이 재미있는지 직접 플레이테스트한 뒤에만

```text
Gameplay Depth
↓

Emergent Chaos
↓

Co-op
↓

Content
```

로 넘어간다.

---

# 27. 최종 품질 기준

우리가 원하는 결과는 기능이 가장 많은 게임이 아니다.

다음 장면 하나가 충분히 재미있어야 한다.

```text
🎤 🎸 🥁 🎸

관객이 신나게 공연을 보고 있음.

↓

갑자기

🎸 기타가 안 들림.

↓

앰프에서

!

↓

플레이어:

"야 기타 나갔어!"

↓

한 명이 백스테이지로 뛰어감.

↓

다른 쪽에서 드럼 스틱까지 날아감.

↓

"야 너 드럼 가!!"

↓

케이블 연결.

↓

🎸 GUITAR RETURNS

↓

관객 전체 점프.

↓

그 순간 마이크 피드백.

↓

"아 미친ㅋㅋㅋㅋ"

↓

둘이 다시 뛰어감.
```

플레이어가 자연스럽게 이런 말을 하게 만드는 것이 최종 목표다.

---

# 지금 실행할 작업

아직 코드를 수정하지 마.

먼저 현재 프로젝트를 실제로 분석해서 `PASS 1 — VISUAL AUDIT`만 수행한다.

현재 Scene / Prefab / Sprite / Camera / UI를 확인하고 다음을 보고한다.

1. 가장 먼저 눈에 띄는 시각적 문제 5개
2. Pixel consistency 문제
3. 캐릭터 가독성 문제
4. Stage / Backstage / Audience 구분 문제
5. 사고가 발생했을 때 시선 유도 문제
6. UI 문제
7. Camera 문제
8. 현재 미감을 가장 크게 망치는 요소 3개
9. 가장 효과가 클 것으로 예상되는 수정 5개
10. 수정해야 할 우선순위

**아직 수정하지 말고 분석 결과만 보여준 뒤 멈춰.**
