import React, { useEffect, useMemo, useRef } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../theme/themeStore";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5; // 위/아래 2칸 + 가운데 1칸
const PADDING_ITEMS = (VISIBLE_ITEMS - 1) / 2;

export type WheelItem = { value: string; label: string };

type Props = {
  items: WheelItem[];
  selectedValue: string;
  onChange: (value: string) => void;
  width?: number;
};

export default function WheelPicker({
  items,
  selectedValue,
  onChange,
  width,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const listRef = useRef<FlatList<WheelItem>>(null);

  const selectedIndex = useMemo(() => {
    const i = items.findIndex((it) => it.value === selectedValue);
    return i < 0 ? 0 : i;
  }, [items, selectedValue]);

  // 외부에서 selectedValue가 바뀌면 그 위치로 스크롤 동기화한다.
  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const idx = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    const next = items[clamped];
    if (next && next.value !== selectedValue) {
      onChange(next.value);
    }
  };

  return (
    <View style={[styles.wrap, width ? { width } : null]}>
      <View pointerEvents="none" style={styles.highlight} />
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(it) => it.value}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * PADDING_ITEMS,
        }}
        initialScrollIndex={selectedIndex}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => {
          const isSelected = item.value === selectedValue;
          return (
            <View style={styles.item}>
              <Text
                style={[styles.itemText, isSelected && styles.itemTextSelected]}
              >
                {item.label}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

WheelPicker.ITEM_HEIGHT = ITEM_HEIGHT;
WheelPicker.VISIBLE_ITEMS = VISIBLE_ITEMS;

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    wrap: {
      height: ITEM_HEIGHT * VISIBLE_ITEMS,
      overflow: "hidden",
      justifyContent: "center",
    },
    highlight: {
      position: "absolute",
      left: 0,
      right: 0,
      top: ITEM_HEIGHT * PADDING_ITEMS,
      height: ITEM_HEIGHT,
      backgroundColor: theme.accentSoftBg,
      borderRadius: 12,
    },
    item: {
      height: ITEM_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    itemText: {
      fontSize: 17,
      color: theme.textMuted,
      fontWeight: "600",
    },
    itemTextSelected: {
      color: theme.accent,
      fontSize: 22,
      fontWeight: "800",
    },
  });
}
