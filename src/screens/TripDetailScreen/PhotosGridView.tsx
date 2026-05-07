import React from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GRID_COLS, type TripDetailStyles } from "./styles";

export type GridPhoto = {
  key: string;
  uri: string;
  takenAt: number;
  date: string;
};

type Props = {
  photos: GridPhoto[];
  loading: boolean;
  countryName: string;
  flag: string;
  styles: TripDetailStyles;
  onBack: () => void;
  onSelectPhoto: (index: number) => void;
};

export default function PhotosGridView({
  photos,
  loading,
  countryName,
  flag,
  styles,
  onBack,
  onSelectPhoto,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
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
          <Text style={styles.headerTitle}>{countryName}</Text>
          <Text style={styles.headerCode}>
            {t("tripDetail.photosGridHeader", { count: photos.length })}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      {photos.length === 0 ? (
        <View style={styles.gridEmpty}>
          <Text style={styles.emptyText}>
            {loading
              ? t("tripDetail.photosLoading")
              : t("tripDetail.photosGridEmpty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(p) => p.key}
          numColumns={GRID_COLS}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          // 큰 사진첩에서도 메모리/스크롤 성능을 안정화한다.
          removeClippedSubviews
          windowSize={5}
          initialNumToRender={24}
          maxToRenderPerBatch={24}
          renderItem={({ item, index }) => (
            <Pressable
              style={styles.gridCell}
              onPress={() => onSelectPhoto(index)}
            >
              <Image source={{ uri: item.uri }} style={styles.gridImage} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
