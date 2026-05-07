import { Animated, Pressable, Text, View } from "react-native";

import { useScreenBottomInset } from "../../hooks/useScreenInsets";

import { styles } from "./styles";

type Props = {
  opacity: Animated.AnimatedInterpolation<number> | Animated.Value;
  title: string;
  flag: string;
  current: number;
  total: number;
  caption: string;
  onClose: () => void;
};

export default function Overlay({
  opacity,
  title,
  flag,
  current,
  total,
  caption,
  onClose,
}: Props) {
  const bottomInset = useScreenBottomInset();
  return (
    <>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.overlayHeader, { opacity }]}
      >
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
        >
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerFlag}>{flag}</Text>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerCounter}>
            {current} / {total}
          </Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.overlayCaption,
          { opacity, paddingBottom: 36 + bottomInset },
        ]}
      >
        <Text style={styles.captionText}>{caption}</Text>
      </Animated.View>
    </>
  );
}
