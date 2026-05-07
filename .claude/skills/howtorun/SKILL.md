---
name: howtorun
description: "VisitGrid (Expo/RN) 앱을 디바이스에 빌드/설치/실행하기 위해 사용자가 직접 터미널에 입력해야 하는 명령어를 안내만 해주는 스킬. 사용법: /howtorun [android|ios|both] [debug|release]. 사용자가 '/howtorun', '실행 명령어 알려줘', '어떻게 실행해', '앱 어떻게 돌려', '실행 방법', 'run 명령어' 등 직접 실행할 명령을 묻거나 가이드를 요청하면 트리거. 절대 명령어를 직접 실행하지 않는다 — 안내만 한다."
argument-hint: "[android|ios|both] [debug|release]"
---

# Howtorun Skill (VisitGrid)

VisitGrid 앱을 디바이스에 올리고 로그를 보기 위해 **사용자가 직접 입력해야 하는 명령어**를 안내하는 스킬. **Bash 도구로 빌드/실행 명령을 직접 호출하지 않는다.**

## 왜 직접 실행하지 않는가

`npx expo run:ios` / `run:android`는 빌드+설치만 하고 종료된다. Metro dev server를 함께 띄우지 않으므로, 클로드가 일회성으로 실행해 버리면 사용자는 콘솔 로그도 못 보고 핫리로드도 못 받는다. 사용자가 본인 터미널에서 직접 띄워야 Metro와 앱이 한 세션에서 살아 있게 된다.

## 인자 파싱

스킬 호출 시 인자 (둘 다 선택):

1. **platform**: `android` | `ios` | `both` — 생략 시 표 전체 안내
2. **mode**: `debug` | `release` — 생략 시 debug 기준으로 안내하되 release 명령도 함께 보여준다

대소문자 무시하고 받되 내부적으로 소문자로 정규화한다. platform/mode가 위 값이 아니면 다시 묻지 말고 그냥 전체 표를 보여준다 (스킬 자체가 안내용이라 막을 필요 없음).

## 응답 구성

응답은 **명령어 안내 + 부가 설명**으로 구성한다. 답변 자체는 짧고 복붙하기 쉽게.

### A. 빌드/설치 명령

| platform | mode    | 명령어                                                     |
|----------|---------|-------------------------------------------------------------|
| ios      | debug   | `npx expo run:ios --device`                                 |
| ios      | release | `npx expo run:ios --configuration Release --device`         |
| android  | debug   | `npx expo run:android --device`                             |
| android  | release | `npx expo run:android --variant release --device`           |

- `--device`는 시뮬레이터/에뮬레이터가 아닌 실제 디바이스에 설치하기 위함. 디바이스가 여러 개면 expo가 자체 프롬프트로 선택을 요구한다.
- `both`로 호출되면 두 개의 터미널 탭에서 각각 실행하라고 안내한다 (한 셸에서 동시에 돌리기는 권장하지 않음 — 빌드 로그가 섞임).

### B. Metro dev server (debug 빌드일 때 필수)

별도 터미널에서:

```bash
npx expo start
```

- 디바이스에서 앱을 실행하면 자동으로 `localhost:8081`의 Metro에 연결된다.
- `console.log`, RN warn/error는 이 터미널에 스트리밍된다.
- `r` 입력 시 리로드, `j` 입력 시 디버거 오픈.

release 빌드는 JS가 번들에 박혀 있어 Metro가 필요 없다. 대신 콘솔 로그를 못 본다.

### C. 네이티브/시스템 로그

iOS:
```bash
npx react-native log-ios
```
또는 Xcode → Window → Devices and Simulators → 해당 폰 → "Open Console".

Android:
```bash
npx react-native log-android
# 또는
adb logcat
```

## 응답 톤

- 사용자는 직접 터미널에 붙여넣을 거다. 명령어는 백틱 코드 블록으로 감싸 복붙 가능하게 둔다.
- 인자에 따라 필요한 줄만 강조하고, 나머지는 짧게 언급하거나 생략한다.
- **절대 Bash 도구로 `expo run:*`이나 `expo start`를 호출하지 않는다.** 안내가 끝나면 응답을 마무리한다.

## 예시

호출: `/howtorun ios debug`

> iOS debug로 디바이스에서 돌리려면 두 개의 터미널이 필요합니다.
>
> **1) Metro 서버 (콘솔 로그/핫리로드)**
> ```bash
> npx expo start
> ```
>
> **2) 빌드+설치 (한 번만 돌리면 됨)**
> ```bash
> npx expo run:ios --device
> ```
>
> 디바이스가 여러 개면 expo가 선택지를 보여줍니다. 이후엔 코드 수정 시 Metro에서 `r`로 리로드만 하면 됩니다.

호출: `/howtorun` (인자 없음)

> 전체 표를 그대로 보여주고, debug면 Metro도 같이 띄워야 한다는 점, release면 로그가 Xcode/logcat에서만 보인다는 점을 함께 안내한다.

## 주의사항 (안내에 포함할 것)

- `release` 모드는 dev 서버 없이 번들로 동작 → 콘솔 로그/디버거 막힘. 동작 검증용으로만.
- iOS release는 코드사이닝 필요. 실패 시 Xcode에서 팀/프로비저닝 확인.
- `ios/`, `android/` 폴더가 outdated거나 없으면 expo가 자동으로 prebuild 수행 — 첫 실행은 시간이 더 걸림.
- 디바이스 미연결 시 `--device`는 시뮬/에뮬로 fallback하지 않고 에러. 그 경우 `--device`를 빼서 시뮬레이터로 돌리거나 디바이스 USB 연결을 확인하도록 안내.
