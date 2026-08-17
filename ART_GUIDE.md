# LAST SONG! VISUAL RULES

이 문서는 프로젝트의 헌법이다.
코드, 스프라이트, 이펙트, UI는 이 규칙을 위반하지 않는다.
AI는  prescriptive 하지 않다. 이 파일에 없는 비주얼 결정은 임의로 만들지 말고, 기존 팔레트·규격·계층을 재사용한다.

한 줄 정체성:
> 음악에 맞춰 버튼을 누르는 게임이 아니라, 음악이 끊기지 않도록 무대를 지키는 게임.

---

## Resolution

- 기준 해상도: **320 × 180**
- 화면 확대는 **정수 배율만** (2×, 3×, 4× …)
- Pixel Perfect Camera에 해당하는 정수 스케일 카메라 사용
- 모든 Sprite PPU 대응값: **16** (1 타일 = 16px = 1 world unit)
- Point Filtering / `imageSmoothingEnabled = false`
- Anti Aliasing 금지
- 좌표는 로직에서 float여도 **그릴 때는 정수 픽셀로 round**

---

## Character

- 기본 캐릭터: **16 × 24 px**
- 머리를 크게, 몸을 작게
- 실루엣만 보고 역할을 구분할 수 있어야 함
  - P1: 파란 스태프 셔츠, 짧은 머리
  - P2: 노란 스태프 셔츠, 포니테일
  - Vocalist: 빨간 재킷
  - Guitarist: 검정 조끼 + 기타 실루엣
  - Drummer: 앉은 자세 + 키 실루엣
- 그림자는 발밑 **타원 2px**, 팔레트의 `BG_SHADOW`만 사용

---

## Environment

- 기본 타일: **16 × 16 px**
- 기타 / 앰프 / 마이크 등 주요 오브젝트: **16 ~ 32 px**
- 상호작용 오브젝트는 배경보다 높은 대비
- 레이아웃(탑다운 + 약간 비스듬 / 3/4):

```
y   0–44    AUDIENCE   어둡고 저채도
y  44–52    RAIL       관객과 무대 분리
y  52–136   STAGE      갈색 / 회색 목재
y 136–180   BACKSTAGE  STAGE보다 한 단계 어둡게
```

플레이어는 무대와 백스테이지를 뛰어다닌다.
사고 동선: **문제 발견 → 백스테이지 → 물건 획득 → 문제 장소 → 수리**

---

## Color roles (32색, 이 밖에는 쓰지 않음)

시각 계층: **배경 < 캐릭터 < 상호작용 < 위험**

정확한 hex는 `src/palette.js` 와 `tools/gen_sprites.py` 가 단일 소스다.

| Role | 규칙 |
|---|---|
| BACKGROUND | 어둡고 저채도 |
| STAGE | 갈색 / 회색 계열 |
| CHARACTER | 밝고 선명 |
| INTERACTABLE | 높은 명도 |
| DANGER | 빨강 / 주황 계열 |
| SUCCESS | 밝은 강조색 |

새 색을 추가하려면 이 파일을 먼저 수정한다. 코드에서 hex를 즉흥 생성하지 않는다.

---

## Animation

- Idle: 2~4 frames
- Walk: 4 frames
- Interaction: 3~4 frames
- Panic: 2 frames
- 프레임은 정수 픽셀 이동만. 서브픽셀 보간 금지.

---

## Effects / Juice

- 파티클도 **정수 픽셀** 단위
- Blur 금지
- 과한 Glow 금지
- 부드러운 Gradient 최소화 (있다면 2~3단 밴딩만)
- 외곽선 하이라이트 추가 금지. 상호작용 가능 범위 = **오브젝트가 1px 위로 이동 + 2프레임 bounce**
- Perfect Repair: `Freeze 0.05s → Squash → 별 파티클 → 관객 점프 → 작은 Camera Shake → SFX`
- 사고 발생: `오브젝트 Shake → ! Pop → Danger Sound → 위치 Highlight`
- 실패: `장비 연기 → 캐릭터 Sweat → 관객 Boo → 해당 Stem Mute`

---

## Accident is the UI

사고는 글자로 알려주지 않는다.

- 기타 줄: 기타 위 큰 `!` + 기타리스트 Panic + Guitar stem mute
- 앰프 고장: 연기 픽셀 + 스파크
- 마이크 피드백: 화면 파동 1px + 관객이 귀를 막음
- 케이블 빠짐: 바닥에 케이블 실루엣 + 단자 비어 있음

---

## Audio stems

곡은 stem으로 분리한다.

- `vocals` / `guitar` / `bass` / `drums`
- 사고 중이면 해당 stem 게인 = 0
- 전부 복구되면 밴드 사운드가 다시 터진다

---

## Forbidden

- 팔레트 밖 색
- 텍스트 경고로 사고 알리기 (`⚠ 기타 줄이 끊어졌습니다!` 금지)
- AA, blur, glow, 부드러운 그라데이션
- 비정수 스케일 / 서브픽셀 렌더
- "예쁘게"를 위한 즉흥 장식 레이어
