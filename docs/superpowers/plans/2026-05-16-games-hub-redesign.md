# Games Hub 화면 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 게임 리스트 화면(GamesHub)을 새 디자인으로 리뉴얼한다. 인트로 헤더(트로피 일러스트 + 카피)와 컬러 테마별 게임 카드 2장(국기 퀴즈=오렌지, 여행 상식=블루)을 도입하고, 각 카드에 "이번 주 1등 점수 / 나의 최고 점수 / 문제 수" 3칸 통계를 노출한다.

**Architecture:** GamesHubScreen.tsx를 컴포지션 root로 두고, 인트로(GamesHubIntro)와 새 GameCard 2개를 그 안에 배치한다. 카드별 컬러는 theme.ts의 새 토큰(`gameCardFlag*`, `gameCardTrivia*`, `gameCardSeparator`)으로 light/dark 모두 지원. 점수 데이터는 기존 scoreService의 RPC 4개를 useGamesHubScores 훅이 `useFocusEffect`로 병렬(`Promise.allSettled`) 호출. CLAUDE.md 룰 5(파일 분할)는 GameCard sub-component를 별도 파일로 빼지 않고 GameCard.tsx 안에 함수 단위로 유지 — 카드가 200줄 이하라 단순성을 우선.

**Tech Stack:** React Native 0.81 + Expo 54, Zustand(theme), react-i18next, Supabase RPC(`get_flag_quiz_leaderboard`, `get_travel_trivia_leaderboard`, `get_my_flag_quiz_score`, `get_my_travel_trivia_score`), lucide-react-native, @react-navigation/native(useFocusEffect)

---

## File Structure

### Created
- `assets/game_tropi.png` — 헤더용 트로피+세계지도 일러스트 (외부 경로에서 복사)
- `assets/game_earth.png` — 국기 퀴즈 카드 일러스트 (지구본+깃발)
- `assets/game_passport.png` — 여행 상식 카드 일러스트 (여권+나침반)
- `src/screens/GamesHub/GamesHubIntro.tsx` — 인트로 헤더 컴포넌트
- `src/screens/GamesHub/useGamesHubScores.ts` — 4개 RPC 병렬 호출 + focus 시 재호출 훅

### Modified
- `src/theme/theme.ts` — 카드 light/dark 컬러 토큰 5개 추가
- `src/screens/GamesHub/GameCard.tsx` — 재작성 (배지, 일러스트, 타이틀, 통계 3칸, CTA 버튼)
- `src/screens/GamesHub/GamesHubScreen.tsx` — 인트로 + 새 카드 2개로 컴포지션 변경, 점수 훅 연결
- `src/i18n/locales/ko.json`, `en.json`, `ja.json`, `de.json`, `fr.json`, `it.json`, `es.json`, `zh-CN.json`, `zh-TW.json`, `ru.json` — `gamesHub` 네임스페이스 키 갱신 (10개)

### Untouched (확인용)
- `src/navigation/screens/GamesHubScreenNav.tsx` — props 인터페이스 그대로 유지
- `src/features/flagQuiz/scoreService.ts`, `src/features/travelTrivia/scoreService.ts` — 호출만 하고 수정 안 함
- 게임 플레이 화면(FlagQuizScreen, TravelTriviaScreen) — 변경 없음

---

## Notes on conventions

- **Commit policy:** 각 task 끝에 conventional commit. CLAUDE.md 6번에 따라 작업 완료 시점에 main에 squash merge 예정 (push 금지).
- **시안의 "게임" 단어 오렌지 강조:** 한국어 시안 특유의 디테일. 다국어 일관성을 위해 본 plan에서는 모든 언어에서 단일 `textPrimary` 컬러로 처리. 한국어만 강조하는 변형은 후속 작업.
- **빈 점수 처리:** `score == null || score <= 0`이면 `t("gamesHub.emptyScore")` = `"-"`.
- **숫자 포매팅:** `new Intl.NumberFormat(i18n.language).format(n)` — 한국어 `1,250`, 독일어 `1.250` 등.

---

## Task 1: 이미지 자산 복사

**Files:**
- Create: `assets/game_tropi.png`, `assets/game_earth.png`, `assets/game_passport.png`

- [ ] **Step 1: PNG 3장을 assets/로 복사**

```bash
cp /Users/ocean.view/dev/PixelTravelResource/games/game_tropi.png assets/game_tropi.png
cp /Users/ocean.view/dev/PixelTravelResource/games/game_earth.png assets/game_earth.png
cp /Users/ocean.view/dev/PixelTravelResource/games/game_passport.png assets/game_passport.png
```

- [ ] **Step 2: 복사 확인**

Run: `ls -lh assets/game_*.png`
Expected: 3개 파일 — `game_earth.png` ~2.1MB, `game_passport.png` ~0.8MB, `game_tropi.png` ~2.1MB.

- [ ] **Step 3: Commit**

```bash
git add assets/game_tropi.png assets/game_earth.png assets/game_passport.png
git commit -m "chore(games): add game card illustrations"
```

---

## Task 2: theme.ts에 게임 카드 컬러 토큰 추가

**Files:**
- Modify: `src/theme/theme.ts`

- [ ] **Step 1: `Theme` 타입에 5개 토큰 추가**

`src/theme/theme.ts`의 `Theme` 타입(라인 5-56) 끝(`statusBar` 직전)에 다음 5줄을 삽입:

```ts
  // 게임 허브 카드 — 국기 퀴즈는 오렌지 톤, 여행 상식은 블루 톤
  gameCardFlagBg: string;
  gameCardFlagAccent: string;
  gameCardTriviaBg: string;
  gameCardTriviaAccent: string;
  gameCardSeparator: string;
```

- [ ] **Step 2: `LIGHT_THEME`에 라이트 값 추가**

`LIGHT_THEME` 객체의 `statusBar: "dark",` 줄 바로 위에 추가:

```ts
  gameCardFlagBg: "#fff0e2",
  gameCardFlagAccent: "#ff8b3a",
  gameCardTriviaBg: "#e7eefb",
  gameCardTriviaAccent: "#3d7bd9",
  gameCardSeparator: "rgba(0,0,0,0.06)",
```

- [ ] **Step 3: `DARK_THEME`에 다크 값 추가**

`DARK_THEME` 객체의 `statusBar: "light",` 줄 바로 위에 추가:

```ts
  gameCardFlagBg: "#3a261a",
  gameCardFlagAccent: "#ff8b3a",
  gameCardTriviaBg: "#1c2638",
  gameCardTriviaAccent: "#5d92ef",
  gameCardSeparator: "rgba(255,255,255,0.10)",
```

- [ ] **Step 4: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (게임 카드 컴포넌트는 아직 새 토큰을 안 쓰니까 미사용 경고도 없음).

- [ ] **Step 5: Commit**

```bash
git add src/theme/theme.ts
git commit -m "feat(theme): add game card color tokens"
```

---

## Task 3: 10개 locale에 `gamesHub` 키 갱신

**Files:**
- Modify: `src/i18n/locales/ko.json` (line 938-944)
- Modify: `src/i18n/locales/en.json` (line 938-944)
- Modify: `src/i18n/locales/ja.json` (line 709~)
- Modify: `src/i18n/locales/de.json` (line 709~)
- Modify: `src/i18n/locales/fr.json` (line 709~)
- Modify: `src/i18n/locales/it.json` (line 709~)
- Modify: `src/i18n/locales/es.json` (line 709~)
- Modify: `src/i18n/locales/zh-CN.json` (line 709~)
- Modify: `src/i18n/locales/zh-TW.json` (line 709~)
- Modify: `src/i18n/locales/ru.json` (line 709~)

각 파일에서 기존 `gamesHub` 블록 전체(5개 키)를 새 블록(12개 키)으로 교체. 기존 `flagQuizDesc`, `triviaDesc`는 삭제. 모든 파일에서 후행 콤마 유지에 주의 (다음 키가 있다면 `}` 뒤에 콤마).

- [ ] **Step 1: ko.json 갱신**

Edit으로 다음 블록을 교체:

old_string:
```json
  "gamesHub": {
    "title": "게임",
    "flagQuizTitle": "국기 퀴즈",
    "flagQuizDesc": "국기를 보고 나라를 맞혀보세요",
    "triviaTitle": "여행 상식 퀴즈",
    "triviaDesc": "전 세계 여행 상식 100문제에 도전해 보세요"
  },
```

new_string:
```json
  "gamesHub": {
    "title": "게임",
    "introTitle": "여행도 지식도\n게임으로 즐겨보세요!",
    "introSubtitle": "퀴즈를 풀고 세계 여행 마스터가 되어보세요.",
    "flagQuizBadge": "국기 퀴즈",
    "flagQuizTitle": "국기를 보고\n나라를 맞혀보세요!",
    "triviaBadge": "여행 상식 퀴즈",
    "triviaTitle": "전 세계 여행 상식\n100문제에 도전해 보세요!",
    "topScore": "1등 점수",
    "myBestScore": "나의 최고",
    "questionCount": "문제 수",
    "play": "플레이하기",
    "challenge": "도전하기",
    "emptyScore": "-"
  },
```

- [ ] **Step 2: en.json 갱신**

먼저 Read로 정확한 기존 블록을 확인한 뒤 Edit. 새 블록:
```json
  "gamesHub": {
    "title": "Games",
    "introTitle": "Travel and trivia,\nturned into a game!",
    "introSubtitle": "Play the quizzes and become a world travel master.",
    "flagQuizBadge": "Flag Quiz",
    "flagQuizTitle": "See the flag,\nname the country!",
    "triviaBadge": "Travel Trivia",
    "triviaTitle": "100 travel facts\nfrom around the world!",
    "topScore": "Top Score",
    "myBestScore": "My Best",
    "questionCount": "Questions",
    "play": "Play",
    "challenge": "Take On",
    "emptyScore": "-"
  },
```

- [ ] **Step 3: ja.json 갱신**

새 블록:
```json
  "gamesHub": {
    "title": "ゲーム",
    "introTitle": "旅も知識も\nゲームで楽しもう！",
    "introSubtitle": "クイズに挑戦して、世界トラベルマスターになろう。",
    "flagQuizBadge": "国旗クイズ",
    "flagQuizTitle": "国旗を見て\n国名を当てよう！",
    "triviaBadge": "旅クイズ",
    "triviaTitle": "世界の旅トリビア\n100問にチャレンジ！",
    "topScore": "1位スコア",
    "myBestScore": "ベスト",
    "questionCount": "問題数",
    "play": "プレイ",
    "challenge": "挑戦",
    "emptyScore": "-"
  },
```

- [ ] **Step 4: de.json 갱신**

새 블록:
```json
  "gamesHub": {
    "title": "Spiele",
    "introTitle": "Reisen und Wissen —\nspielerisch entdecken!",
    "introSubtitle": "Spiel die Quiz und werde Reise-Master.",
    "flagQuizBadge": "Flaggen-Quiz",
    "flagQuizTitle": "Sieh die Flagge,\nnenn das Land!",
    "triviaBadge": "Reise-Quiz",
    "triviaTitle": "100 Fragen rund\nums Reisen!",
    "topScore": "Top-Score",
    "myBestScore": "Mein Bestwert",
    "questionCount": "Fragen",
    "play": "Spielen",
    "challenge": "Loslegen",
    "emptyScore": "-"
  },
```

- [ ] **Step 5: fr.json 갱신**

새 블록:
```json
  "gamesHub": {
    "title": "Jeux",
    "introTitle": "Voyage et savoir,\nen mode jeu !",
    "introSubtitle": "Joue aux quiz et deviens maître du voyage.",
    "flagQuizBadge": "Quiz Drapeaux",
    "flagQuizTitle": "Vois le drapeau,\ndevine le pays !",
    "triviaBadge": "Quiz Voyage",
    "triviaTitle": "100 questions sur\nle voyage à travers le monde !",
    "topScore": "Meilleur score",
    "myBestScore": "Mon record",
    "questionCount": "Questions",
    "play": "Jouer",
    "challenge": "Relever",
    "emptyScore": "-"
  },
```

- [ ] **Step 6: it.json 갱신**

새 블록:
```json
  "gamesHub": {
    "title": "Giochi",
    "introTitle": "Viaggio e cultura,\ndivertiti giocando!",
    "introSubtitle": "Gioca ai quiz e diventa un maestro del viaggio.",
    "flagQuizBadge": "Quiz Bandiere",
    "flagQuizTitle": "Guarda la bandiera,\nindovina il paese!",
    "triviaBadge": "Quiz Viaggio",
    "triviaTitle": "100 domande di curiosità\nsul viaggio nel mondo!",
    "topScore": "Punteggio top",
    "myBestScore": "Il mio record",
    "questionCount": "Domande",
    "play": "Gioca",
    "challenge": "Sfida",
    "emptyScore": "-"
  },
```

- [ ] **Step 7: es.json 갱신**

새 블록:
```json
  "gamesHub": {
    "title": "Juegos",
    "introTitle": "Viajes y trivia,\n¡a jugar!",
    "introSubtitle": "Juega a los quizzes y conviértete en maestro viajero.",
    "flagQuizBadge": "Quiz de Banderas",
    "flagQuizTitle": "Mira la bandera,\n¡adivina el país!",
    "triviaBadge": "Quiz Viajero",
    "triviaTitle": "¡100 preguntas de\ncuriosidades del mundo!",
    "topScore": "Mejor puntuación",
    "myBestScore": "Mi récord",
    "questionCount": "Preguntas",
    "play": "Jugar",
    "challenge": "Aceptar",
    "emptyScore": "-"
  },
```

- [ ] **Step 8: zh-CN.json 갱신**

새 블록:
```json
  "gamesHub": {
    "title": "游戏",
    "introTitle": "旅行也好知识也好，\n用游戏享受吧！",
    "introSubtitle": "玩转测验，成为世界旅行大师。",
    "flagQuizBadge": "国旗测验",
    "flagQuizTitle": "看国旗，\n猜国家！",
    "triviaBadge": "旅行常识测验",
    "triviaTitle": "全世界旅行常识\n100题大挑战！",
    "topScore": "第一名",
    "myBestScore": "我的最高",
    "questionCount": "题数",
    "play": "开始玩",
    "challenge": "去挑战",
    "emptyScore": "-"
  },
```

- [ ] **Step 9: zh-TW.json 갱신**

새 블록:
```json
  "gamesHub": {
    "title": "遊戲",
    "introTitle": "旅行也好知識也好，\n用遊戲享受吧！",
    "introSubtitle": "玩轉測驗，成為世界旅行大師。",
    "flagQuizBadge": "國旗測驗",
    "flagQuizTitle": "看國旗，\n猜國家！",
    "triviaBadge": "旅行常識測驗",
    "triviaTitle": "全世界旅行常識\n100題大挑戰！",
    "topScore": "第一名",
    "myBestScore": "我的最高",
    "questionCount": "題數",
    "play": "開始玩",
    "challenge": "去挑戰",
    "emptyScore": "-"
  },
```

- [ ] **Step 10: ru.json 갱신**

새 블록:
```json
  "gamesHub": {
    "title": "Игры",
    "introTitle": "Путешествия и эрудиция —\nв формате игры!",
    "introSubtitle": "Играй в квизы и становись мастером путешествий.",
    "flagQuizBadge": "Квиз флагов",
    "flagQuizTitle": "Угадай страну\nпо флагу!",
    "triviaBadge": "Квиз путешественника",
    "triviaTitle": "100 вопросов о путешествиях\nпо миру!",
    "topScore": "Топ-рекорд",
    "myBestScore": "Мой рекорд",
    "questionCount": "Вопросов",
    "play": "Играть",
    "challenge": "Принять",
    "emptyScore": "-"
  },
```

- [ ] **Step 11: 모든 JSON 파싱 검증**

```bash
for f in src/i18n/locales/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "OK: $f" || echo "FAIL: $f"; done
```
Expected: 10개 모두 `OK:` 출력.

- [ ] **Step 12: 새 키가 모든 locale에 존재하는지 검증**

```bash
for f in src/i18n/locales/*.json; do
  for k in introTitle introSubtitle flagQuizBadge triviaBadge topScore myBestScore questionCount play challenge emptyScore; do
    if ! grep -q "\"$k\"" "$f"; then echo "MISSING $k in $f"; fi
  done
done
```
Expected: 출력 없음.

- [ ] **Step 13: 삭제된 키(`flagQuizDesc`, `triviaDesc`)가 안 남아있는지 검증**

```bash
grep -n "flagQuizDesc\|triviaDesc" src/i18n/locales/*.json
```
Expected: 결과 없음.

- [ ] **Step 14: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(i18n): refresh gamesHub keys across 10 locales"
```

---

## Task 4: `useGamesHubScores` 훅 작성

**Files:**
- Create: `src/screens/GamesHub/useGamesHubScores.ts`

- [ ] **Step 1: 훅 파일 작성**

내용:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { fetchLeaderboard, fetchMyQuizScore } from "../../features/flagQuiz/scoreService";
import {
  fetchTriviaLeaderboard,
  fetchMyTriviaScore,
} from "../../features/travelTrivia/scoreService";

export type GamesHubScores = {
  flagTop: number | null;
  flagMyBest: number | null;
  triviaTop: number | null;
  triviaMyBest: number | null;
};

const INITIAL: GamesHubScores = {
  flagTop: null,
  flagMyBest: null,
  triviaTop: null,
  triviaMyBest: null,
};

// 4개 RPC를 병렬로 호출. 한 호출이 실패해도 나머지 칸은 정상 표시.
// 0점 또는 row 없음은 null로 정규화 — UI에서 "-"로 표시된다.
export function useGamesHubScores(): GamesHubScores {
  const [scores, setScores] = useState<GamesHubScores>(INITIAL);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const [flagTopRes, flagMineRes, triviaTopRes, triviaMineRes] = await Promise.allSettled([
      fetchLeaderboard(1),
      fetchMyQuizScore(),
      fetchTriviaLeaderboard(1),
      fetchMyTriviaScore(),
    ]);
    if (!isMountedRef.current) return;

    const pickTop = (
      res: PromiseSettledResult<Array<{ bestScore: number }>>,
    ): number | null => {
      if (res.status !== "fulfilled") return null;
      const best = res.value[0]?.bestScore ?? 0;
      return best > 0 ? best : null;
    };
    const pickMine = (
      res: PromiseSettledResult<{ bestScore: number } | null>,
    ): number | null => {
      if (res.status !== "fulfilled" || !res.value) return null;
      return res.value.bestScore > 0 ? res.value.bestScore : null;
    };

    setScores({
      flagTop: pickTop(flagTopRes),
      flagMyBest: pickMine(flagMineRes),
      triviaTop: pickTop(triviaTopRes),
      triviaMyBest: pickMine(triviaMineRes),
    });
  }, []);

  // 화면 mount + focus 복귀 시마다 fresh fetch (게임 풀고 돌아오면 즉시 갱신).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return scores;
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/screens/GamesHub/useGamesHubScores.ts
git commit -m "feat(games): add useGamesHubScores hook"
```

---

## Task 5: `GameCard.tsx` 재작성

**Files:**
- Modify: `src/screens/GamesHub/GameCard.tsx` (전체 교체)

- [ ] **Step 1: GameCard.tsx 전체를 새 내용으로 교체**

내용:

```tsx
import { Image, Pressable, Text, View, type ImageSourcePropType } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";

export type GameCardPalette = {
  bg: string;
  accent: string;
  accentText: string;
  separator: string;
  titleText: string;
  statLabel: string;
  statValue: string;
};

export type GameCardStat = {
  icon: LucideIcon;
  label: string;
  value: string;
};

// 게임 허브의 카드 1개. dumb component — 컬러/콘텐츠는 모두 props로 받는다.
export function GameCard({
  palette,
  illustration,
  badgeIcon: BadgeIcon,
  badgeLabel,
  title,
  stats,
  ctaLabel,
  onPress,
}: {
  palette: GameCardPalette;
  illustration: ImageSourcePropType;
  badgeIcon: LucideIcon;
  badgeLabel: string;
  title: string;
  stats: [GameCardStat, GameCardStat, GameCardStat];
  ctaLabel: string;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 14,
        padding: 16,
        borderRadius: 24,
        backgroundColor: palette.bg,
      }}
    >
      <Image
        source={illustration}
        style={{ width: 96, height: 96 }}
        resizeMode="contain"
      />
      <View style={{ flex: 1, gap: 10 }}>
        <View style={{ flexDirection: "row" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: palette.accent,
            }}
          >
            <BadgeIcon color={palette.accentText} size={14} />
            <Text
              style={{ color: palette.accentText, fontSize: 13, fontWeight: "700" }}
            >
              {badgeLabel}
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: palette.titleText,
            lineHeight: 26,
          }}
        >
          {title}
        </Text>
        <View
          style={{
            flexDirection: "row",
            paddingVertical: 10,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: palette.separator,
          }}
        >
          {stats.map(({ icon: StatIcon, label, value }, idx) => (
            <View key={idx} style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <StatIcon color={palette.accent} size={14} />
                <Text style={{ fontSize: 11, color: palette.statLabel }}>{label}</Text>
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: palette.statValue,
                }}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: palette.accent,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{ color: palette.accentText, fontSize: 16, fontWeight: "700" }}
          >
            {ctaLabel}
          </Text>
          <ChevronRight color={palette.accentText} size={18} />
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: GamesHubScreen에서 기존 `GameCard`의 props가 변경되어 에러 발생 가능 — 다음 task에서 통합하므로 일단 무시 가능. 단, GameCard 파일 자체에는 에러가 없어야 함.

- [ ] **Step 3: Commit**

```bash
git add src/screens/GamesHub/GameCard.tsx
git commit -m "feat(games): redesign GameCard with palette, stats, CTA"
```

---

## Task 6: `GamesHubIntro.tsx` 컴포넌트 작성

**Files:**
- Create: `src/screens/GamesHub/GamesHubIntro.tsx`

- [ ] **Step 1: 새 파일 작성**

내용:

```tsx
import { Image, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";

// 게임 허브 상단 인트로 — 좌측 타이틀/부제 + 우측 트로피 일러스트.
export function GamesHubIntro() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
      }}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: theme.textPrimary,
            lineHeight: 30,
          }}
        >
          {t("gamesHub.introTitle")}
        </Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary }}>
          {t("gamesHub.introSubtitle")}
        </Text>
      </View>
      <Image
        source={require("../../../assets/game_tropi.png")}
        style={{ width: 140, height: 140 }}
        resizeMode="contain"
      />
    </View>
  );
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: GamesHubIntro 파일 자체에 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/screens/GamesHub/GamesHubIntro.tsx
git commit -m "feat(games): add GamesHubIntro header component"
```

---

## Task 7: `GamesHubScreen.tsx` 통합

**Files:**
- Modify: `src/screens/GamesHub/GamesHubScreen.tsx` (전체 교체)

- [ ] **Step 1: GamesHubScreen.tsx 전체를 새 내용으로 교체**

내용:

```tsx
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BarChart3,
  ChevronLeft,
  Flag,
  Globe2,
  ListChecks,
  Star,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import { GameCard, type GameCardPalette } from "./GameCard";
import { GamesHubIntro } from "./GamesHubIntro";
import { useGamesHubScores } from "./useGamesHubScores";

const FLAG_QUIZ_QUESTIONS = 50;
const TRIVIA_QUESTIONS = 100;

export default function GamesHubScreen({
  onClose,
  onOpenFlagQuiz,
  onOpenTravelTrivia,
}: {
  onClose: () => void;
  onOpenFlagQuiz: () => void;
  onOpenTravelTrivia: () => void;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const scores = useGamesHubScores();

  const flagPalette: GameCardPalette = useMemo(
    () => ({
      bg: theme.gameCardFlagBg,
      accent: theme.gameCardFlagAccent,
      accentText: "#ffffff",
      separator: theme.gameCardSeparator,
      titleText: theme.textPrimary,
      statLabel: theme.textSecondary,
      statValue: theme.textPrimary,
    }),
    [theme],
  );
  const triviaPalette: GameCardPalette = useMemo(
    () => ({
      bg: theme.gameCardTriviaBg,
      accent: theme.gameCardTriviaAccent,
      accentText: "#ffffff",
      separator: theme.gameCardSeparator,
      titleText: theme.textPrimary,
      statLabel: theme.textSecondary,
      statValue: theme.textPrimary,
    }),
    [theme],
  );

  const fmt = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const display = (score: number | null) =>
    score == null || score <= 0 ? t("gamesHub.emptyScore") : fmt.format(score);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.homeBg }}
      edges={["top", "bottom"]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Pressable onPress={onClose} hitSlop={10} style={{ padding: 8 }}>
          <ChevronLeft color={theme.textPrimary} size={26} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.textPrimary }}>
          {t("gamesHub.title")}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24, gap: 16 }}>
        <GamesHubIntro />
        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <GameCard
            palette={flagPalette}
            illustration={require("../../../assets/game_earth.png")}
            badgeIcon={Flag}
            badgeLabel={t("gamesHub.flagQuizBadge")}
            title={t("gamesHub.flagQuizTitle")}
            stats={[
              {
                icon: Star,
                label: t("gamesHub.topScore"),
                value: display(scores.flagTop),
              },
              {
                icon: BarChart3,
                label: t("gamesHub.myBestScore"),
                value: display(scores.flagMyBest),
              },
              {
                icon: ListChecks,
                label: t("gamesHub.questionCount"),
                value: fmt.format(FLAG_QUIZ_QUESTIONS),
              },
            ]}
            ctaLabel={t("gamesHub.play")}
            onPress={onOpenFlagQuiz}
          />
          <GameCard
            palette={triviaPalette}
            illustration={require("../../../assets/game_passport.png")}
            badgeIcon={Globe2}
            badgeLabel={t("gamesHub.triviaBadge")}
            title={t("gamesHub.triviaTitle")}
            stats={[
              {
                icon: Star,
                label: t("gamesHub.topScore"),
                value: display(scores.triviaTop),
              },
              {
                icon: BarChart3,
                label: t("gamesHub.myBestScore"),
                value: display(scores.triviaMyBest),
              },
              {
                icon: ListChecks,
                label: t("gamesHub.questionCount"),
                value: fmt.format(TRIVIA_QUESTIONS),
              },
            ]}
            ctaLabel={t("gamesHub.challenge")}
            onPress={onOpenTravelTrivia}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음. 모든 새 토큰·키·훅·컴포넌트가 일관되게 연결돼야 함.

- [ ] **Step 3: Commit**

```bash
git add src/screens/GamesHub/GamesHubScreen.tsx
git commit -m "feat(games): wire new GamesHub layout with intro and score cards"
```

---

## Task 8: 최종 검증

**Files:** 없음 (검증 단계).

- [ ] **Step 1: 전체 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 0개.

- [ ] **Step 2: locale JSON 일관성 재확인**

```bash
for f in src/i18n/locales/*.json; do
  node -e "
    const o = JSON.parse(require('fs').readFileSync('$f','utf8')).gamesHub;
    const required = ['title','introTitle','introSubtitle','flagQuizBadge','flagQuizTitle','triviaBadge','triviaTitle','topScore','myBestScore','questionCount','play','challenge','emptyScore'];
    const missing = required.filter(k => !(k in o));
    if (missing.length) { console.log('$f MISSING:', missing); process.exit(1); }
    if ('flagQuizDesc' in o || 'triviaDesc' in o) { console.log('$f STALE:', Object.keys(o).filter(k => k === 'flagQuizDesc' || k === 'triviaDesc')); process.exit(1); }
  " && echo "OK: $f"
done
```
Expected: 10개 모두 `OK:` 출력.

- [ ] **Step 3: 사용자 시각 검증 요청**

다음 시나리오를 사용자가 직접 디바이스/시뮬레이터에서 확인:

1. 홈 → "게임" 버튼 → GamesHub 진입. 인트로 헤더에 트로피 일러스트가 보이고 카피가 2줄 + 부제로 표시.
2. 국기 퀴즈 카드(오렌지): 좌측 지구본 일러스트, 상단 "🏁 국기 퀴즈" 배지, "국기를 보고 / 나라를 맞혀보세요!" 타이틀, 통계 3칸(이번 주 1등 점수 · 나의 최고 · 문제 수 50), 오렌지 "플레이하기 >" 버튼.
3. 여행 상식 카드(블루): 좌측 여권 일러스트, 상단 "🌐 여행 상식 퀴즈" 배지, "전 세계 여행 상식 / 100문제에 도전해 보세요!" 타이틀, 통계 3칸(문제 수 100), 블루 "도전하기 >" 버튼.
4. 비로그인 상태에서 나의 최고는 `-` 표시. 시즌 첫 진입(아무도 안 풀음)이면 1등 점수도 `-`.
5. 카드 탭 → 해당 게임 진입. 게임 풀고 돌아오면 점수가 갱신(focus effect).
6. 라이트/다크 모드 모두에서 가독성 OK, 컬러 톤 어색하지 않은지 확인.
7. 언어 변경 → 다른 locale로 바꿔도 텍스트 깨지지 않고 자연스러운지.

문제 있는 항목이 있으면 해당 task로 돌아가 수정.

- [ ] **Step 4: 워크트리 squash merge 준비 (사용자 확인 후)**

CLAUDE.md 6번에 따라 작업 완료 시 main에 squash merge. 사용자에게 squash merge 여부 확인 후 실행. (push 금지.)

```bash
# main으로 돌아가서 (현재 브랜치 확인)
git log --oneline -10
# squash merge는 사용자 승인 후 main 브랜치에서:
#   cd /Users/ocean.view/dev/VisitGrid
#   git checkout main
#   git merge --squash claude/naughty-brown-d21596
#   git commit -m "feat(games): redesign GamesHub with intro header and score cards"
```

---

## Self-Review

이 plan을 spec과 대조해서 자체 검증:

**1. Spec coverage**

| Spec 요구사항 | 담당 Task |
|---|---|
| 인트로 헤더 (타이틀, 부제, 트로피 일러스트) | Task 1 (이미지) + Task 6 (Intro) + Task 7 (배치) |
| 게임 카드 2장 (오렌지/블루) + 일러스트 + 배지 + 통계 3칸 + CTA | Task 5 (GameCard) + Task 7 (palette 적용) |
| 통계: 1등 점수, 나의 최고, 문제 수 | Task 4 (훅) + Task 7 (display 매핑) |
| Promise.allSettled 병렬 호출 + useFocusEffect 갱신 | Task 4 |
| 빈 값/0점/비로그인 → `-` | Task 4 (normalize) + Task 7 (display fn) |
| 숫자 포매팅 `Intl.NumberFormat(language)` | Task 7 |
| 10개 locale 새 키 + 기존 desc 키 삭제 | Task 3 |
| 카드 컬러 light/dark theme.ts 토큰화 | Task 2 |
| 이미지 자산 `assets/` 직속 복사 | Task 1 |
| 컴포넌트 파일 분할 (단, GameCard 내부는 inline 유지) | Task 4-7 |
| `GamesHubScreen`의 props 인터페이스 유지 (`onClose`, `onOpenFlagQuiz`, `onOpenTravelTrivia`) | Task 7 (확인됨) |
| 게임 플레이 화면 변경 없음 | Out of Scope — 본 plan 작업 대상 아님 |

→ 모든 spec 요구사항이 task에 매핑됨.

**2. Placeholder scan**

- TBD, TODO, "implement later", "add appropriate error handling" 등 → 없음
- 모든 step에 실제 코드/명령/검증 출력 포함

**3. Type consistency**

- `GameCardPalette` (Task 5)와 Task 7의 palette 객체 — `bg, accent, accentText, separator, titleText, statLabel, statValue` 일치 ✓
- `GamesHubScores` 타입(Task 4) — `flagTop, flagMyBest, triviaTop, triviaMyBest` 4개 필드, Task 7의 `scores.flagTop` 등 접근 일치 ✓
- `GameCardStat`의 `icon, label, value` — Task 7에서 동일하게 사용 ✓
- theme 토큰 (`gameCardFlagBg`, `gameCardFlagAccent`, `gameCardTriviaBg`, `gameCardTriviaAccent`, `gameCardSeparator`) — Task 2 정의, Task 7 소비 일치 ✓
- i18n 키 (`gamesHub.introTitle`, `gamesHub.flagQuizBadge`, `gamesHub.topScore`, ...) — Task 3에서 정의, Task 6·7에서 호출 일치 ✓
- scoreService 함수명(`fetchLeaderboard`, `fetchMyQuizScore`, `fetchTriviaLeaderboard`, `fetchMyTriviaScore`) — Task 4에서 import한 그대로 사용 ✓

→ 일관성 OK.
