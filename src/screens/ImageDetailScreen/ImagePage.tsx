import { Image, Pressable, View } from "react-native";

import { styles } from "./styles";

type Props = {
  uri: string;
  onTap: () => void;
};

export default function ImagePage({ uri, onTap }: Props) {
  return (
    <View style={styles.page}>
      <Pressable onPress={onTap} style={styles.image}>
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      </Pressable>
    </View>
  );
}
