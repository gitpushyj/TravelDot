# Google 로그인(Supabase Auth) 셋업 가이드 — 초보자용

VisitGrid에 Google 로그인을 활성화하기 위해 콘솔에서 해야 하는 모든 단계를 정리한 문서입니다. 코드는 이미 준비되어 있으니 아래 단계만 따라 하면 됩니다.

> 전체 흐름:
> ① Supabase 프로젝트 → ② Google Cloud OAuth 클라이언트 3개 → ③ 두 콘솔 연결 → ④ 로컬 `.env` & `app.json` → ⑤ 빌드 & 실행

소요 시간: 처음 하면 30~60분.

---

## 0. 시작하기 전에

### 0-1. Expo Go에서는 안 됩니다
이 앱은 네이티브 모듈(`@react-native-google-signin/google-signin`)을 사용하므로 **Expo Go(스토어 앱)** 에서는 동작하지 않습니다.
반드시 다음 둘 중 하나로 빌드해야 합니다.
- 로컬: `npx expo run:ios` 또는 `npx expo run:android`
- 클라우드: EAS Build (`eas build`)

### 0-2. 필요한 도구
- **Node.js / npm** (이미 사용 중)
- **iOS 빌드:** macOS + Xcode (App Store에서 무료 설치)
- **Android 빌드:** Android Studio (또는 최소한 Android SDK + Java JDK)
- **Java/`keytool` 명령**: SHA-1 발급에 필요. macOS에는 보통 시스템 java가 있고, 없다면 `brew install openjdk`.

---

## 1. Supabase 프로젝트 만들기

### 1-1. 가입 + 프로젝트 생성
1. https://supabase.com/dashboard 접속 → GitHub 또는 이메일로 가입
2. 우상단 **New project** 클릭
3. 입력:
   - Organization: 기본값 그대로
   - Name: 예) `visitgrid`
   - Database password: 강한 비밀번호 (DB 안 쓰더라도 필수, 어딘가 메모)
   - Region: `Northeast Asia (Seoul)` 추천 (가까울수록 빠름)
   - Plan: Free
4. **Create new project** 클릭 → 1~2분 대기

### 1-2. URL과 anon 키 복사
1. 좌측 메뉴에서 ⚙ **Project Settings** → **API**
2. 두 값을 메모장 등에 복사:
   - **Project URL** (예: `https://abcdefg.supabase.co`)
   - **Project API Keys → anon public** (eyJ... 로 시작하는 긴 문자열)

> 이 둘은 나중에 `.env`에 넣습니다.

---

## 2. Google Cloud Console 준비

### 2-1. 프로젝트 만들기
1. https://console.cloud.google.com 접속 (Google 계정 필요)
2. 상단 **프로젝트 선택** 드롭다운 → **새 프로젝트** 클릭
3. 이름: 예) `VisitGrid` → **만들기**
4. 생성 후 상단 드롭다운에서 새 프로젝트가 선택되어 있는지 확인

### 2-2. OAuth 동의 화면(consent screen) 설정 — **반드시 먼저 해야 함**
> Client ID를 만들려면 동의 화면이 먼저 설정되어 있어야 합니다. 이걸 빼먹으면 Client ID 만들기에서 막힙니다.

1. 좌측 메뉴 ☰ → **API 및 서비스(APIs & Services)** → **OAuth 동의 화면(OAuth consent screen)**
2. **User Type: 외부(External)** 선택 → **만들기**
3. 1단계: 앱 정보
   - 앱 이름: `VisitGrid`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
   - 다른 항목은 비워둬도 OK → **저장 후 계속**
4. 2단계: 범위(Scopes) — **저장 후 계속** (아무것도 추가 안 함, `email`/`profile`은 자동)
5. 3단계: 테스트 사용자 — 본인 Google 계정 이메일 추가 → **저장 후 계속**
   > 외부 앱은 처음에 "테스트" 모드라 등록된 사용자만 로그인 가능. 본인 계정 꼭 넣기.
6. **대시보드로 돌아가기**

---

## 3. OAuth Client ID 3개 만들기

좌측 **API 및 서비스 → 사용자 인증 정보(Credentials)** 페이지로 이동.

상단 **+ 사용자 인증 정보 만들기 → OAuth 클라이언트 ID** 를 **3번** 누르며 아래 3개를 만듭니다.

### 3-1. 웹 애플리케이션 (Web Client) — Supabase 검증용 (필수)

> 이 Client ID가 모바일 ID 토큰의 `audience` 가 됩니다. 즉 모바일에서 받은 ID 토큰도 이 Web Client ID 기반으로 발급되도록 SDK에 설정합니다.

1. **애플리케이션 유형: 웹 애플리케이션** 선택
2. 이름: `VisitGrid Web`
3. **승인된 리디렉션 URI(Authorized redirect URIs)** → **+ URI 추가**:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```
   (`YOUR_PROJECT`을 1-2에서 복사한 Project URL의 서브도메인으로 교체)
4. **만들기** 클릭
5. 팝업에 **Client ID**와 **Client secret** 두 값이 뜸 → 둘 다 복사해서 메모
   - Client ID → `.env`의 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - Client secret → 4-2에서 Supabase에 입력

### 3-2. iOS

1. **애플리케이션 유형: iOS** 선택
2. 이름: `VisitGrid iOS`
3. **번들 ID**: `com.gitpush.visitgrid` (정확히 이대로 — `app.json`의 `ios.bundleIdentifier`와 일치해야 함)
4. **만들기**
5. 생성된 클라이언트를 클릭해서 들어가면:
   - **클라이언트 ID** 복사 → `.env`의 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - **iOS URL scheme** 복사 (예: `com.googleusercontent.apps.123456-abcdef`) → 5-2에서 `app.json`에 사용
   > URL scheme은 Client ID를 거꾸로 뒤집은 형태입니다.

### 3-3. Android

> Android는 SHA-1 인증서 지문이 필요합니다. 먼저 발급부터 받아야 함.

#### SHA-1 발급 (디버그용)
디버그 keystore는 Android Studio를 처음 실행하거나 `npx expo run:android`를 한 번 돌리면 자동 생성됩니다 (`~/.android/debug.keystore`).

터미널에서 실행:
```bash
keytool -keystore ~/.android/debug.keystore \
        -list -v \
        -alias androiddebugkey \
        -storepass android -keypass android
```

출력 중 **`SHA1: AA:BB:CC:...`** 라인 복사 (콜론 포함, 60자 정도).

> `keytool: command not found` 에러가 나면 JDK가 필요합니다: `brew install openjdk` 후 안내된 PATH 설정. 또는 Android Studio가 깔려 있다면 `/Applications/Android\ Studio.app/Contents/jbr/Contents/Home/bin/keytool` 풀 경로로 실행.

#### 클라이언트 만들기
1. **애플리케이션 유형: Android** 선택
2. 이름: `VisitGrid Android`
3. **패키지 이름**: `com.gitpush.visitgrid`
   > `app.json`에 `android.package`가 명시되어 있지 않으면 자동으로 `com.gitpush.visitgrid`가 사용됩니다. 다르게 하려면 `app.json`을 먼저 수정.
4. **SHA-1 인증서 지문**: 위에서 복사한 값 붙여넣기
5. **만들기**
6. **Client ID** 복사 → 4-2에서 Supabase에 등록할 때 사용 (앱 코드에는 직접 안 넣음)

> 배포용 빌드(EAS Build / Play Store)를 할 땐 릴리즈 keystore의 SHA-1도 추가로 등록해야 합니다. EAS의 경우 `eas credentials` 명령으로 확인 가능. 지금은 디버그용만 있어도 OK.

---

## 4. Supabase에 Google Provider 연결

### 4-1. Provider 활성화
1. Supabase Dashboard → 좌측 **Authentication** → **Providers**
2. 목록에서 **Google** 클릭 → 토글 ON

### 4-2. 입력
- **Client ID (for OAuth)**: 3-1의 Web Client ID
- **Client Secret (for OAuth)**: 3-1의 Web Client secret
- **Authorized Client IDs** (있는 경우 — Sign in with Google native 섹션): 3-1, 3-2, 3-3에서 만든 Web/iOS/Android Client ID **세 개를 모두 콤마(,)로 구분해서** 입력
  > Supabase 콘솔 UI는 가끔 바뀝니다. "Client IDs" 또는 "Authorized Client IDs" 같은 필드가 보이면 거기에 모두 넣으세요. 모바일 네이티브 로그인 시 Supabase가 "이 Client ID에서 발급된 토큰만 신뢰" 하기 때문에 모두 등록해야 합니다.
3. **Save** 클릭

---

## 5. 로컬 프로젝트 설정

### 5-1. `.env` 파일 만들기
프로젝트 루트(이 worktree 디렉토리)에서:
```bash
cp .env.example .env
```
`.env`를 열어 값 채우기:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co        # 1-2
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...                # 1-2
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123-xxx.apps.googleusercontent.com  # 3-1
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=456-yyy.apps.googleusercontent.com  # 3-2
```
> `.env`는 git에 커밋되지 않습니다 (`.gitignore`에 등록되어 있음).

### 5-2. `app.json`에 iOS URL scheme 추가
3-2에서 복사한 **iOS URL scheme**을 plugin 옵션으로 넣어줍니다. 현재 `app.json`의 `plugins`를 다음과 같이 수정:

```json
{
  "expo": {
    "plugins": [
      "expo-sqlite",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.123456-abcdef"
        }
      ]
    ]
  }
}
```
> ⚠️ `iosUrlScheme` 값을 본인 것으로 정확히 교체하세요. plugin이 알아서 iOS Info.plist에 URL scheme을 등록해줍니다. (수동 편집 불필요)

---

## 6. 빌드 & 실행

### 6-1. 네이티브 코드 재생성
plugin 설정이 바뀌었으므로 네이티브 폴더를 다시 만듭니다.
```bash
npx expo prebuild --clean
```
> 이 명령이 `ios/`, `android/` 폴더를 생성/갱신합니다. 두 폴더는 `.gitignore`에 있어 커밋되지 않습니다.

### 6-2. 실행
**iOS (시뮬레이터):**
```bash
npx expo run:ios
```
**Android (에뮬레이터 또는 실기기 USB):**
```bash
npx expo run:android
```

처음에는 빌드가 5~10분 걸립니다. 그 다음부터는 캐시되어 빠릅니다.

### 6-3. 테스트
앱이 뜨면 곧바로 **로그인 화면**이 보입니다 → **"Google로 계속하기"** 탭 → Google 시트 → 본인 Google 계정 선택 → 메인 앱 진입.

로그아웃은 **설정(⚙︎) → 계정 → 로그아웃**.

---

## 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| **"DEVELOPER_ERROR" / 코드 10** (Android) | SHA-1이 Google Cloud의 Android Client에 등록되지 않았거나 패키지 이름 불일치. SHA-1 다시 발급해 등록. 디버그/릴리즈 keystore가 다르면 둘 다 등록. |
| **"Unable to verify the ID token"** | Supabase Google provider의 "Authorized Client IDs"에 모바일 Client ID가 누락. Web/iOS/Android 3개 모두 등록되어 있는지 확인. |
| **"redirect_uri_mismatch"** | Web Client의 Authorized redirect URI가 Supabase Project URL과 다름. `https://YOUR_PROJECT.supabase.co/auth/v1/callback` 정확히 일치해야 함. |
| **iOS 빌드 시 `'GIDSignIn/GIDSignIn.h' file not found`** | `npx expo prebuild --clean` 후 `cd ios && pod install`. |
| **Expo Go에서 흰 화면** | 정상. Dev Client(`run:ios`/`run:android`) 또는 EAS Build 사용. |
| **"테스트 사용자만 로그인 가능" 메시지** | 2-2 단계 5에서 본인 이메일을 테스트 사용자로 추가하지 않음. 추가하면 됨. |
| **`keytool: command not found`** | JDK 설치 필요: `brew install openjdk`. 또는 Android Studio의 `bin/keytool` 풀 경로 사용. |

---

## 다음 단계 (참고)

지금은 **인증만** 붙은 상태입니다. 향후 DB 동기화로 넘어갈 때:
1. Supabase에서 테이블 생성 (예: `trips`, `visits`)
2. 각 테이블에 RLS 정책 추가: `auth.uid() = user_id` 형태로 본인 데이터만 접근 가능하도록
3. 앱에서 로컬 SQLite ↔ Supabase 동기화 구현

이 단계는 별도 작업으로 진행합니다.
