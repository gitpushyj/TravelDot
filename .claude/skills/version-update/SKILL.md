---
name: version-update
description: "VisitGrid iOS 앱의 버전을 시멘틱버저닝(SemVer) 규칙에 따라 다음 버전으로 올리고 expo prebuild까지 실행하는 스킬. 사용법: /version-update [patch|minor|major]. 사용자가 '/version-update', '버전 올려줘', '버전 업', '다음 버전', 'patch 올려', 'minor 올려', 'major 올려', 'version up' 등 버전 bump를 요청하면 트리거. 기본 추천은 patch. iOS buildNumber는 항상 +1. Android(versionCode)는 건드리지 않는다."
argument-hint: "[patch|minor|major]"
---

# Version Update Skill (VisitGrid)

VisitGrid의 iOS 앱 버전을 한 단계 올리고 native에 동기화한다. **사용자 승인 없이는 절대 파일을 수정하지 않는다.**

## 동작 흐름

1. **현재 버전 읽기** — `app.json`의 `expo.version`과 `expo.ios.buildNumber`
2. **다음 버전 계산** — semver 룰 적용 + buildNumber +1
3. **사용자에게 확인** — 추천값 보여주고 명시적 승인 대기
4. **승인 후 적용** — `app.json` 수정 → `npx expo prebuild --platform ios` 실행
5. **결과 보고** — Xcode Archive 안내

## 인자 파싱

호출 시 인자 (선택):

| 인자 | 효과 | 예시 |
|---|---|---|
| `patch` (기본) | `1.0.3 → 1.0.4` | 버그 수정·작은 개선 |
| `minor` | `1.0.3 → 1.1.0` (patch는 0 리셋) | 기능 추가 (하위호환) |
| `major` | `1.0.3 → 2.0.0` (minor·patch 0 리셋) | 호환성 깨지는 변경 |

- 인자 없거나 자연어 호출이면 **patch** 추천.
- 사용자가 "minor 올려줘" / "major bump" 같이 명시하면 그에 맞춰 계산.
- 인자가 위 셋이 아니면 patch로 가정 (다시 묻지 말고 진행).

## buildNumber 규칙

`expo.ios.buildNumber`는 **semver 종류와 무관하게 항상 현재 + 1**.

App Store가 같은 build number 재업로드를 거부하기 때문. 문자열이므로 `parseInt → +1 → String` 순으로 처리.

## Android는 건드리지 않음

현재 iOS만 배포 중. `expo.android.versionCode`는 손대지 않는다. Android도 함께 올릴 시점이 오면 사용자가 명시적으로 요청한다.

## 실행 절차

### Step 1: 현재 버전 읽기

```bash
jq -r '"\(.expo.version)|\(.expo.ios.buildNumber)"' app.json
```

출력 예시: `1.0.3|4` → 현재 1.0.3 (build 4).

### Step 2: 다음 버전 계산

`MAJOR.MINOR.PATCH` 분리 후:
- patch: `MAJOR.MINOR.(PATCH+1)`
- minor: `MAJOR.(MINOR+1).0`
- major: `(MAJOR+1).0.0`

buildNumber: `current + 1` (정수 연산 후 문자열).

### Step 3: 사용자 확인 (필수)

다음 형식으로 보여주고 **명시적 승인 대기**:

```
현재: 1.0.3 (4)
다음: 1.0.4 (5)  ← patch

진행할까요?
```

사용자가 "응"/"yes"/"확인"/"진행"/"go"/"오케이"/"ㅇㅇ" 등 명확한 승인을 줘야 Step 4로. 다른 종류 요청 시 재계산해서 다시 확인.

### Step 4: app.json 수정

jq로 두 필드 동시 수정 (in-place 아님, 임시 파일 경유):

```bash
NEXT_VERSION="1.0.4"; NEXT_BUILD="5"
jq --arg v "$NEXT_VERSION" --arg b "$NEXT_BUILD" \
  '.expo.version = $v | .expo.ios.buildNumber = $b' \
  app.json > app.json.tmp && mv app.json.tmp app.json
```

두 값 모두 **문자열로 저장** (buildNumber 따옴표 주의).

### Step 5: prebuild 실행

```bash
npx expo prebuild --platform ios
```

`@bacons/apple-targets` 등 플러그인 이슈로 실패하면 에러 메시지 그대로 보고하고, `pbxproj` 직접 수정 옵션을 안내:

```bash
sed -i '' \
  -e "s/MARKETING_VERSION = [0-9.]*/MARKETING_VERSION = $NEXT_VERSION/g" \
  -e "s/CURRENT_PROJECT_VERSION = [0-9]*/CURRENT_PROJECT_VERSION = $NEXT_BUILD/g" \
  ios/PixelTravel.xcodeproj/project.pbxproj
```

(이 sed 폴백은 자동 실행하지 말고 사용자에게 한 번 더 확인.)

### Step 6: 보고

성공 시 한 줄로:

```
✅ 1.0.3 (4) → 1.0.4 (5) 완료. 이제 Xcode에서 Product → Archive 하시면 됩니다.
```

## 안전 규칙

- **사용자 승인 없이는 파일을 절대 수정하지 않는다.** 항상 Step 3 확인 후 진행.
- **자동 커밋 금지.** 사용자가 별도 요청할 때만 git add/commit.
- **원격 push 금지.** 절대 자동 push하지 않는다.
- prebuild가 native 파일을 변경하므로, 진행 전에 `git status` 한 번 보여주는 게 좋다 (사용자가 미커밋 변경사항 잃지 않도록).

## 트리거 예시

- `/bump-version`
- `/bump-version patch`
- `/bump-version minor`
- `/bump-version major`
- "버전 올려줘"
- "다음 버전으로 올려"
- "patch 한 단계 올려"
- "minor bump"
- "version up"
- "버전 업해줘"
