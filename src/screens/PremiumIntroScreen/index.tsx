import React, { useEffect, useMemo, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePremiumIntroStore } from "../../features/premiumIntro/premiumIntroStore";
import { useScreenBottomInset } from "../../hooks/useScreenInsets";
import { useTheme } from "../../theme/themeStore";
import PagingDots from "./PagingDots";
import PremiumIntroFooter from "./PremiumIntroFooter";
import { makeStyles } from "./styles";
import AiChatSlide from "./slides/AiChatSlide";
import DeviceSyncSlide from "./slides/DeviceSyncSlide";
import MapStyleSlide from "./slides/MapStyleSlide";
import TitlesSlide from "./slides/TitlesSlide";

type Props = {
  /** "구독 안내 보기" — 구독 화면으로 이동. */
  onGoToSubscription: () => void;
  /** "나중에 할게요" — 안내를 닫고 채팅으로. */
  onDismiss: () => void;
};

const SLIDE_COUNT = 4;

// 프리미엄 기능 안내 페이지. 슬라이드 4개를 가로 paging으로 보여주고
// 하단에 점 인디케이터 + 고정 CTA를 둔다. 마운트되는 순간 "본 적 있음"으로 기록한다.
export default function PremiumIntroScreen({ onGoToSubscription, onDismiss }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomInset = useScreenBottomInset();
  const markSeen = usePremiumIntroStore((s) => s.markSeen);
  const [activeIndex, setActiveIndex] = useState(0);

  // 마운트 시 1회만 "본 적 있음"으로 기록한다. 이후 AI 탭은 가로채지 않는다.
  useEffect(() => {
    void markSeen();
  }, [markSeen]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.min(Math.max(index, 0), SLIDE_COUNT - 1));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        style={styles.carousel}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        <View style={{ width }}>
          <AiChatSlide />
        </View>
        <View style={{ width }}>
          <DeviceSyncSlide />
        </View>
        <View style={{ width }}>
          <TitlesSlide />
        </View>
        <View style={{ width }}>
          <MapStyleSlide />
        </View>
      </ScrollView>

      <PagingDots count={SLIDE_COUNT} activeIndex={activeIndex} />

      <View style={[styles.footer, { paddingBottom: bottomInset + 20 }]}>
        <PremiumIntroFooter
          onPressCta={onGoToSubscription}
          onPressLater={onDismiss}
        />
      </View>
    </View>
  );
}
