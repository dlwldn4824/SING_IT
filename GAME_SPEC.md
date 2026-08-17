# LAST SONG! — Unity 2D 픽셀 협동 밴드 게임 개발

> Cursor / Codex는 매 작업 전에 이 파일을 읽고, **현재 Phase만** 작업한다.
> 한 번에 전체 게임을 생성하지 않는다.
> 사용자가 해당 Phase의 정상 작동을 확인하기 전에는 다음 Phase 코드를 작성하지 않는다.

**Current Phase:** `1 — PROJECT FOUNDATION`  
**Status:** 분석 완료. 구현은 사용자 확인 후 시작.  
**Vertical Slice 목표:** Phase 7 (케이블 사고)까지 가능한 한 빨리 도달한다.

---

너는 지금부터 이 Unity 프로젝트의 시니어 게임플레이 프로그래머다.

이 프로젝트는 단순히 기능을 빠르게 추가하는 것이 목적이 아니다.

**일관된 픽셀 아트 미감, 명확한 게임 구조, 좋은 손맛, 확장 가능한 코드 구조를 유지하면서 하나씩 완성하는 것**이 가장 중요하다.

한 번에 전체 게임을 구현하지 마라.

반드시 아래 개발 순서를 따르고, **각 단계가 정상 동작하는 것을 확인한 뒤 다음 단계로 넘어간다.**

---

# 0. 게임 정의

게임명(가칭): LAST SONG!

장르:

* 2D 픽셀 아트
* 탑다운
* 협동 파티게임
* 공연 사고 수습
* 1~4인 플레이를 최종 목표로 함

핵심 한 줄:

> 음악에 맞춰 버튼을 누르는 게임이 아니라, 음악이 끊기지 않도록 무대를 지키는 게임.

플레이어들은 공연 중 무대를 돌아다니며 계속 발생하는 사고를 해결한다.

예:

* 기타 케이블 빠짐
* 기타 줄 끊어짐
* 드럼 스틱 분실
* 마이크 피드백
* 앰프 고장
* 케이블 단선
* 관객 난입
* 무대에 물 쏟아짐
* 전원 문제

사고를 방치하면 실제 음악의 해당 파트가 사라지고 관객 만족도가 떨어진다.

공연이 끝날 때까지 관객 만족도를 유지하면 승리한다.

시각 규칙은 `ART_GUIDE.md` 가 헌법이다. 이 파일은 개발 순서와 시스템 범위의 헌법이다.

---

# 1. 절대 지켜야 할 개발 원칙

## 1-1. 한 단계씩 구현

전체 시스템을 한 번에 만들지 않는다.

현재 단계에 필요한 기능만 구현한다.

각 단계 완료 후 반드시 다음을 알려준다.

1. 생성한 파일
2. 수정한 파일
3. Unity Editor에서 내가 해야 하는 작업
4. Inspector에서 연결해야 하는 항목
5. 테스트 방법
6. 정상 작동 기준
7. 현재 발견된 문제
8. 다음 단계

그리고 내가 정상 작동한다고 확인하기 전에는 다음 단계의 코드를 작성하지 않는다.

---

# 2. 코드 스타일

Unity C#을 사용한다.

가능하면 시스템별 책임을 분리한다.

예:

- PlayerController
- PlayerMovement
- PlayerInteraction
- Interactable
- PickupItem
- AccidentManager
- Accident
- StageManager
- AudienceManager
- AudioStemManager
- GameManager

단, 지나친 추상화나 불필요한 디자인 패턴은 사용하지 않는다.

프로토타입 단계에서 의미 없는 Interface, Manager, Singleton을 남발하지 않는다.

조건문이나 표현식이 지나치게 길지 않다면 불필요하게 여러 줄로 나누지 않는다.

변수 이름만 보고 역할을 이해할 수 있도록 작성한다.

`[SerializeField]`를 활용하여 Unity Inspector에서 값을 조절할 수 있도록 한다.

하드코딩은 최소화한다.

---

# 3. 픽셀 아트 규칙

프로젝트 전체에서 다음 미감을 유지한다. 상세 hex / 금지 항목은 `ART_GUIDE.md`.

## Resolution

기준 해상도: **320 × 180**

Pixel Perfect Camera 사용.

Sprite Filter Mode: Point  
Compression: None  
Anti Aliasing: 사용하지 않음.

픽셀 아트가 카메라 이동 중 흔들리거나 흐려지지 않도록 한다.

## Pixel Unit

- 기본 타일: 16 × 16 px
- 캐릭터: 약 16 × 24 px
- 작은 아이템: 8~16 px
- 앰프/대형 장비: 16~32 px
- 가능하면 PPU를 통일한다. (16)

---

# 4. 시각적 우선순위

화면의 시각적 계층은 항상 다음과 같아야 한다.

BACKGROUND < STAGE < CHARACTER < INTERACTABLE < ACCIDENT

배경이 플레이어보다 튀어서는 안 된다.

상호작용 가능한 물체는 배경보다 쉽게 보여야 한다.

사고가 발생하면 텍스트를 읽지 않아도 위치를 알아볼 수 있어야 한다.

---

# 5. 색상 규칙

색상을 임의로 계속 추가하지 않는다.

제한된 픽셀 팔레트를 사용한다. 단일 소스는 `src/palette.js` / `tools/gen_sprites.py` (Unity 이전  palettes는 Art 폴더로 이관).

- 배경: 저채도 / 낮은 대비
- 캐릭터: 상대적으로 높은 채도
- 상호작용 물체: 높은 명도
- 위험: 따뜻한 강조색
- 성공: 밝은 강조색

새로운 Sprite/UI/Effect를 만들 때 기존 화면과 어울리는지를 먼저 고려한다.

---

# 6. Animation 규칙

과도하게 부드러운 애니메이션보다 픽셀게임 특유의 명확한 동작을 사용한다.

- Idle: 2~4 frames
- Walk: 4 frames 전후
- Interaction: 2~4 frames
- Panic: 2 frames 이상

가능하면 짧고 과장된 동작을 사용한다.

---

# 7. Game Feel 원칙

게임 로직 구현 이후 반드시 Juice Pass를 별도로 진행한다. (Phase 16)

상호작용 성공:

* 짧은 Squash
* 1~2px Bounce
* 작은 Particle
* 명확한 Sound
* 필요한 경우 0.03~0.06초 Hit Stop

사고 발생:

* 해당 Object Shake
* ! 표시
* 짧은 경고음
* 명확한 Animation

사고 해결:

* Success Effect
* 관객 반응
* 해당 악기 음악 복귀

실패:

* 장비 연기
* 캐릭터 Panic
* 관객 반응 감소
* 해당 Instrument Stem 감소

단, 카메라 흔들림이나 파티클을 과도하게 사용하지 않는다.

게임 로직을 Juice 코드와 강하게 결합하지 않는다.

---

# 8. UI 원칙

텍스트 설명에 지나치게 의존하지 않는다.

좋은 예:

기타 줄 끊어짐 → 기타 Sprite 변화 → ! 표시 → 기타 소리 사라짐

나쁜 예:

"기타 줄이 끊어졌습니다!"라는 큰 팝업만 표시

게임 상황 자체가 UI 역할을 하도록 한다.

---

# 9. 핵심 Gameplay Loop

공연 시작 → 음악 재생 → 사고 발생 → 플레이어가 사고 발견 → 필요한 도구 확인 → 백스테이지 이동 → 아이템 획득 → 사고 장소 이동 → 상호작용 → 수리 → 음악 복구 → 다른 사고 발생 → 공연 종료 → 결과

---

# 10. MVP 범위

첫 번째 버전에서는 절대로 범위를 확장하지 않는다.

- 맵: 학교 축제 무대 1개
- 곡: 1개
- 캐릭터: 1명부터 시작. MVP에서 최종 2명
- 사고 4개: 기타 케이블 빠짐 / 기타 줄 끊어짐 / 드럼 스틱 분실 / 마이크 피드백
- 공연 시간: 약 3분

---

# PHASE 1 — PROJECT FOUNDATION

먼저 프로젝트 상태를 분석한다.

현재 Unity 버전, Scene 구조, 기존 Scripts, Input System 사용 여부를 확인한다.

기존 코드가 있다면 무조건 삭제하거나 새로 만들지 않는다. 재사용 가능한 것은 재사용한다.

필요한 Folder 구조를 제안한다. 현재 프로젝트에 맞게 필요한 만큼만 생성한다.

이 단계에서는 게임 시스템을 구현하지 않는다.

제안 폴더:

```
Assets/
  Art/Characters/ Environment/ Items/ Effects/
  Audio/Music/ SFX/
  Prefabs/Characters/ Stage/ Items/ Accidents/
  Scenes/
  Scripts/Core/ Player/ Interaction/ Stage/ Accident/ Audio/ UI/
```

---

# PHASE 2 — PLAYER MOVEMENT

목표: 픽셀게임에 어울리는 기본 이동.

- WASD 이동
- 대각선 이동 Normalize
- Rigidbody2D 기반 이동
- 벽 충돌
- 이동속도 Inspector 조절
- 방향 정보 저장
- Idle / Walk Animation 연결 가능한 구조

Pixel Perfect 환경에서 이동이 보기 좋도록 한다.

아직 상호작용을 만들지 않는다.

---

# PHASE 3 — PLAYER INTERACTION

기본 키: E

- Interaction Range
- 가장 가까운 상호작용 대상 탐지
- 현재 상호작용 대상 표시
- 범위를 벗어나면 표시 제거
- 강조: 1px Bounce 또는 작은 아이콘. Outline/Glow 금지

---

# PHASE 4 — PICKUP / CARRY / DROP

- E → 아이템 집기
- E → 필요한 대상에 사용
- Q → 바닥에 내려놓기
- 한 번에 하나만
- 들고 있는 아이템은 플레이어 앞쪽에, 방향에 따라, 픽셀 정렬 유지

아이템 예: 기타 케이블, 예비 기타, 드럼 스틱, 공구

---

# PHASE 5 — BASIC STAGE

구역: 관객 → Stage → Backstage

Stage: 보컬, 기타, 베이스, 드럼, 마이크, 앰프, 페달보드  
Backstage: 예비 기타, 케이블, 스틱, 공구함

동선이 겹치게. 넓은 방이 아니라 일부 좁은 통로.

---

# PHASE 6 — GENERIC ACCIDENT SYSTEM

개별 사고 전에 공통 시스템.

필요 정보: AccidentType, State, TargetObject, RequiredItem, RepairDuration, FailureTime, Severity

상태: Inactive / Active / Repairing / Resolved / Failed

발생 시 장비가 시각적으로 변한다. 사고 종류 추가가 쉬워야 하되 지나친 추상화는 피한다.

---

# PHASE 7 — ACCIDENT 01: CABLE DISCONNECT  ★ Vertical Slice

기타 케이블이 빠진다. 기타 사운드 중단. 사고 표시.

해결: 케이블 획득 → 올바른 장비 접근 → E → 짧은 Repair → 연결 복구 → 기타 사운드 복귀

**이 사고 하나가 완벽하게 동작하기 전까지 다른 사고를 추가하지 않는다.**

검증할 30초:

Player 이동 → 기타 케이블 사고 → 기타 음악 사라짐 → 백스테이지로 달려감 → 케이블 획득 → 앰프로 이동 → 수리 → 기타 음악이 다시 들어옴 → 관객 환호

---

# PHASE 8 — ACCIDENT 02: BROKEN GUITAR STRING

예비 기타를 기타리스트에게 전달. 짧은 교체 후 연주 복귀.

---

# PHASE 9 — ACCIDENT 03: LOST DRUM STICK

제한된 Spawn Point 중 하나. 완전 랜덤 좌표 금지.

---

# PHASE 10 — ACCIDENT 04: MICROPHONE FEEDBACK

Item Delivery만 하지 않는다. MVP는 간단한 Interaction. 향후 마이크/스피커 위치 미니게임으로 확장 가능하게.

발생 시: 피드백 SFX, 마이크 Shake, 관객 반응 감소, 보컬 파트 영향

---

# PHASE 11 — ACCIDENT SPAWNER / DIRECTOR

완전 Random만 사용하지 않는다.

- 0~30초: 최대 1개
- 30~90초: 최대 2개
- 90~150초: 최대 2~3개
- 150~180초: Final Chaos

같은 사고 연속 / 해결 불가능한 조합 금지.

---

# PHASE 12 — AUDIENCE SATISFACTION

일반 HP 대신 공연 만족도 0~100.

정상 연주: 유지 또는 천천히 증가  
사고: 감소  
중요 파트 중단: 더 빠르게 감소  
해결: 작은 회복

High: 점프 / 손 흔들기  
Medium: 일반 관람  
Low: 무표정 / 야유

UI 숫자만으로 상태를 전달하지 않는다.

---

# PHASE 13 — AUDIO STEM SYSTEM

Vocals / Guitar / Bass / Drums. 모든 Stem은 정확히 같은 시점에서 시작.

사고 시 해당 Stem Volume 감소. 해결 시 복구. 짧은 Fade. 재생 위치는 절대 어긋나면 안 된다.

Vertical Slice(Phase 7)에서는 Guitar stem fade만 최소 구현할 수 있다. 풀 시스템은 Phase 13.

---

# PHASE 14 — PERFORMANCE TIMER

MVP 180초. 시간 종료까지 버티면 성공. 만족도 0이면 실패.

---

# PHASE 15 — GAME FLOW

Ready → Countdown → Performance → Result

결과: 최종 만족도, 해결한 사고, 놓친 사고, 최대 동시 사고, 등급 S/A/B/C/F

---

# PHASE 16 — JUICE PASS

모든 핵심 기능이 정상 작동한 이후에만 진행한다.

로직과 Juice를 강하게 결합하지 않는다.

---

# PHASE 17 — CHAOS INTERACTION

기본 게임이 재미있다는 것이 확인된 후.

불합리한 Random Death 금지. 플레이어가 보고 대응할 수 있어야 한다.

---

# PHASE 18 — LOCAL CO-OP

싱글플레이가 완성된 후에만. 2 Player부터. 처음부터 온라인 금지.

P1 Keyboard, P2 Gamepad 또는 Input System PlayerInput.

---

# PHASE 19 — CONTENT EXPANSION

MVP 플레이테스트 이후에만.

공연장마다 Skin만 바꾸지 말고 환경 기믹을 최소 하나 추가한다.

---

# 구현 전에 항상 판단할 것

1. 이 기능이 핵심 재미를 강화하는가?
2. 플레이어가 화면만 보고 이해할 수 있는가?
3. 다른 시스템과 재미있는 상호작용을 만드는가?
4. 불필요하게 복잡하지 않은가?
5. 기존 픽셀 미감을 해치지 않는가?
6. 1~4인 협동으로 확장 가능한가?

3개 이상 만족하지 않는 기능은 구현 전에 다시 검토한다.

---

# 작업 지시 템플릿

사용자:

> `GAME_SPEC.md`를 먼저 읽고 현재 Phase만 작업해.

에이전트:

1. Current Phase를 읽는다.
2. 그 Phase 범위 밖의 파일을 만들지 않는다.
3. 완료 보고 8항목을 출력한다.
4. 사용자 확인 전에 다음 Phase로 넘어가지 않는다.
