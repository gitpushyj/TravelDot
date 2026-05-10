import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Canvas, Group, RoundedRect } from "@shopify/react-native-skia";
import { MapPin } from "lucide-react-native";

import dotData from "../../../assets/data/dots.json";
import type { DotData } from "../../types";
import type { Theme } from "../../theme/theme";

type Props = { theme: Theme; brand: string };

const FILL_RATIO = 0.6;

// 결제 화면 헤더. 배경은 색칠되지 않은 단색 dot지도를 매우 낮은 opacity로 깔고
// 그 위에 브랜드 핀 아이콘 + 텍스트를 얹는다.
export default function HeroDotMap({ theme, brand }: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { dots, gridSize, minLat, maxLat } = dotData as DotData;
  const [size, setSize] = useState({ width: 0, height: 0 });

  const viewBoxW = 360;
  const viewBoxH = maxLat - minLat;

  const positioned = useMemo(() => {
    if (size.width === 0 || size.height === 0) return [];
    const widthFit = size.width / viewBoxW;
    const heightFit = size.height / viewBoxH;
    const baseScale = Math.max(widthFit, heightFit) || 1;
    const dotPx = gridSize * FILL_RATIO * baseScale;
    const halfDotPx = dotPx / 2;
    const radius = dotPx * 0.25;
    const items = dots.map((d) => ({
      id: d.id,
      x: (d.lng + 180) * baseScale - halfDotPx,
      y: (maxLat - d.lat) * baseScale - halfDotPx,
    }));
    return [{ items, dotPx, radius }] as const;
  }, [size.width, size.height, dots, gridSize, viewBoxH, maxLat]);

  const dotColor = theme.statusBar === "dark"
    ? "rgba(0,0,0,0.10)"
    : "rgba(255,255,255,0.10)";

  return (
    <View style={styles.root}>
      <View
        style={styles.mapArea}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width !== size.width || height !== size.height) {
            setSize({ width, height });
          }
        }}
      >
        {size.width > 0 && positioned[0] && (
          <Canvas style={{ width: size.width, height: size.height }}>
            <Group>
              {positioned[0].items.map((d) => (
                <RoundedRect
                  key={d.id}
                  x={d.x}
                  y={d.y}
                  width={positioned[0].dotPx}
                  height={positioned[0].dotPx}
                  r={positioned[0].radius}
                  color={dotColor}
                />
              ))}
            </Group>
          </Canvas>
        )}
      </View>
      <View style={styles.brandRow} pointerEvents="none">
        <MapPin
          size={28}
          color={theme.accent}
          fill={theme.accent}
          strokeWidth={2.4}
        />
        <Text style={styles.brandText} numberOfLines={1} adjustsFontSizeToFit>
          {brand}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      minHeight: 130,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    mapArea: {
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
    },
    brandRow: {
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 10,
    },
    brandText: {
      color: theme.accent,
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
  });
}
