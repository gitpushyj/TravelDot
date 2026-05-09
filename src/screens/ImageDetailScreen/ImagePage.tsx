import { Image, Pressable, View } from "react-native";

import { useResolvedUri } from "../../features/photoSync/useResolvedUri";

import { styles } from "./styles";

type Props = {
  id: string;
  uri: string;
  onTap: () => void;
};

export default function ImagePage({ id, uri, onTap }: Props) {
  const resolved = useResolvedUri(id, uri);
  return (
    <View style={styles.page}>
      <Pressable onPress={onTap} style={styles.image}>
        {resolved ? (
          <Image
            source={{ uri: resolved }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.image} />
        )}
      </Pressable>
    </View>
  );
}
