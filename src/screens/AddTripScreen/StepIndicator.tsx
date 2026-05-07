import React from "react";
import { Text, View } from "react-native";

import type { AddTripStyles } from "./styles";

type Props = {
  styles: AddTripStyles;
  current: number;
  labels: string[];
};

export default function StepIndicator({ styles, current, labels }: Props) {
  return (
    <View>
      <View style={styles.indicatorRow}>
        {labels.map((_, i) => (
          <View
            key={i}
            style={[
              styles.indicatorSegment,
              i <= current && styles.indicatorSegmentActive,
            ]}
          />
        ))}
      </View>
      <View style={styles.indicatorLabels}>
        {labels.map((label, i) => (
          <View key={label} style={styles.indicatorLabelCell}>
            <Text
              style={[
                styles.indicatorLabel,
                i === current && styles.indicatorLabelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
