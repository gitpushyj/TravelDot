import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import DotMap from "../components/DotMap";
import { useVisitStore } from "../features/travel/visitStore";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";
import { useTheme } from "../theme/themeStore";

const TOAST_DURATION_MS = 3000;

// 가로 화면에서 노치/다이내믹 아일랜드는 시각적 좌측에 위치한다.
// X 버튼이 그 라인과 겹치지 않게 statusbar 높이만큼 안쪽으로 들여둔다.
// iOS는 노치 기기 기준으로 약 50, 노치 없는 기기는 약 20 → 안전하게 50으로 둔다.
const NOTCH_INSET =
  Platform.OS === "ios" ? 50 : RNStatusBar.currentHeight ?? 24;

type Props = {
  visitCounts: Record<string, number>;
  onClose: () => void;
};

// 도트맵 자연 비율(viewBoxW=360, viewBoxH=maxLat-minLat=145).
const MAP_ASPECT = 360 / 145;
// 도트가 가장자리에서 잘리지 않도록 살짝 안쪽으로 들여서 모든 나라가 풀로 보이게 한다.
const EDGE_INSET_RATIO = 0.97;

// 앱이 portrait로 잠겨 있어 화면 자체는 회전하지 않는다. 컨텐츠를 90도 회전시켜
// 사용자가 디바이스를 가로로 돌렸을 때 가로로 꽉 차는 형태로 보이도록 한다.
export default function MapZoomScreen({ visitCounts, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const selectedCountry = useVisitStore((s) => s.selectedCountry);
  const theme = useTheme();

  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);

  // 국가를 선택할 때마다 이름을 토스트로 띄우고 3초 뒤에 자동으로 숨긴다.
  // 같은 국가를 다시 탭해도 setSelectedCountry가 새 객체를 만들어 useEffect가
  // 재실행되므로 타이머가 리셋된다.
  const [toastName, setToastName] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!selectedCountry) return;
    setToastName(getCountryName(selectedCountry.code, getCurrentLocale()));
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setToastName(null);
      hideTimer.current = null;
    }, TOAST_DURATION_MS);
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [selectedCountry]);

  // 회전 컨테이너 안에서 자연 비율로 contain 피팅한 뒤 중앙 정렬한다.
  // 단순히 longEdge × shortEdge로 채우면 비율이 어긋나 가장자리 도트가 잘려 보인다.
  const containerAspect = longEdge / shortEdge;
  let mapW: number;
  let mapH: number;
  if (containerAspect > MAP_ASPECT) {
    mapH = shortEdge * EDGE_INSET_RATIO;
    mapW = mapH * MAP_ASPECT;
  } else {
    mapW = longEdge * EDGE_INSET_RATIO;
    mapH = mapW / MAP_ASPECT;
  }

  return (
    <View
      style={[styles.outer, { width, height, backgroundColor: theme.homeBg }]}
    >
      <StatusBar hidden />
      <View
        style={[
          styles.rotated,
          {
            width: longEdge,
            height: shortEdge,
            top: (height - shortEdge) / 2,
            left: (width - longEdge) / 2,
            backgroundColor: theme.homeBg,
          },
        ]}
      >
        <View
          style={[
            styles.mapHolder,
            {
              width: mapW,
              height: mapH,
              left: (longEdge - mapW) / 2,
              top: (shortEdge - mapH) / 2,
            },
          ]}
        >
          <DotMap
            visitCounts={visitCounts}
            autoPickFirst
            playIntro={false}
            parentRotated90
            mapAreaStyle={{ width: mapW, height: mapH }}
          />
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: theme.cardBg },
            pressed && styles.closeBtnPressed,
          ]}
        >
          <Text style={[styles.closeIcon, { color: theme.textPrimary }]}>
            ✕
          </Text>
        </Pressable>
        {toastName && (
          <View pointerEvents="none" style={styles.bottomOverlay}>
            <View style={styles.namePill}>
              <Text style={styles.nameText} numberOfLines={1}>
                {toastName}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
  },
  rotated: {
    position: "absolute",
    transform: [{ rotate: "90deg" }],
  },
  mapHolder: {
    position: "absolute",
  },
  // 회전 컨테이너의 로컬 프레임은 가로 시각 프레임과 일치한다(부모 90° CW 회전).
  // 시각적 좌측에 노치가 있으므로 left에 statusbar 높이만큼 인셋을 더해 겹침을 피한다.
  closeBtn: {
    position: "absolute",
    top: 20,
    left: NOTCH_INSET,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  closeBtnPressed: {
    opacity: 0.7,
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: "700",
  },
  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  namePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(26, 26, 26, 0.85)",
    borderRadius: 999,
    maxWidth: "80%",
  },
  nameText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
