import { StatusBar } from "expo-status-bar";

import AiScreen from "../../screens/AiScreen";
import { useTheme } from "../../theme/themeStore";

export default function AiScreenNav() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <AiScreen />
    </>
  );
}
