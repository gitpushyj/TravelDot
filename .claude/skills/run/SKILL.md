---
name: run
description: "Expo (React Native) 앱을 디바이스에 설치/실행하는 프로젝트 스코프 스킬. 사용법: /run <android|ios|both> [debug|release]. 사용자가 '/run', '앱 실행', '앱 돌려', '빌드해서 설치', 'release로 깔아', 'iOS에 release 설치' 등 VisitGrid 앱을 디바이스에 올려달라고 요청하면 트리거. mode 생략 시 debug, both는 iOS/Android 병렬 실행."
argument-hint: "<android|ios|both> [debug|release]"
---

# Run Skill (VisitGrid)

Expo prebuild 기반 RN 앱을 연결된 디바이스에 설치/실행한다.

## 인자 파싱

스킬 호출 시 인자 순서:

1. **platform** (필수): `android` | `ios` | `both`
2. **mode** (선택): `debug` | `release` — 생략 시 `debug`

규칙:
- platform이 없거나 위 셋 중 하나가 아니면 사용자에게 물어본다.
- mode가 위 둘 중 하나가 아니면 사용자에게 물어본다 (오타 방지).
- 인자는 대소문자 구분 없이 받되 내부 처리는 소문자로 정규화한다.

## 명령어 매핑

| platform | mode    | 명령어                                                      |
|----------|---------|-------------------------------------------------------------|
| ios      | debug   | `npx expo run:ios --device`                                 |
| ios      | release | `npx expo run:ios --configuration Release --device`         |
| android  | debug   | `npx expo run:android --device`                             |
| android  | release | `npx expo run:android --variant release --device`           |

`--device` 플래그는 시뮬레이터/에뮬레이터가 아닌 실제 연결된 디바이스에 설치하기 위함이다. 디바이스가 여러 개면 expo가 자체 프롬프트로 선택을 요구한다.

## 실행 절차

### 1. 작업 디렉토리 확인

`package.json`이 있는 프로젝트 루트(`/Users/ocean.view/dev/VisitGrid`)에서 실행한다. 다른 위치에서 호출됐다면 cd 없이 절대경로 명령으로 처리하지 말고, Bash 호출 시 작업 디렉토리가 프로젝트 루트인지만 확인한다.

### 2. platform/mode에 따라 명령 실행

- **단일 platform** (`ios` 또는 `android`): 위 표의 명령어 1개를 포그라운드로 실행한다. 빌드/설치 로그를 그대로 보여준다.
- **`both`**: iOS와 Android를 병렬로 실행한다. Bash 도구의 `run_in_background: true`로 각각 띄우고, 두 작업 모두 완료될 때까지 기다린다. 둘 다 끝나면 각 결과를 요약해서 보고한다.

### 3. 결과 보고

빌드 성공/실패 여부, 어떤 디바이스에 설치됐는지(로그에서 추출 가능하면), release 빌드라면 Metro 없이 번들된 JS로 동작한다는 점을 짧게 알려준다.

## 주의사항

- `release` 모드는 dev 서버 없이 번들된 JS로 실행된다. 콘솔 로그/디버거가 막혀 있으니 동작 검증용으로만 쓰도록 안내한다.
- iOS release 빌드는 코드사이닝이 필요하다. 실패 시 Xcode에서 팀/프로비저닝 설정을 확인하라고 안내한다.
- `expo prebuild`가 안 돼 있는 상태(`ios/`, `android/` 폴더가 없거나 outdated)면 expo가 자동으로 prebuild를 수행한다. 시간이 더 걸릴 수 있다는 점만 알린다.
- 디바이스가 연결되어 있지 않으면 expo가 시뮬레이터/에뮬레이터로 fallback 하지 않고 에러를 낸다. 그 경우 사용자에게 디바이스 연결 또는 `--device` 제거 여부를 물어본다.
