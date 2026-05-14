import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  BotMessageSquare,
  Globe2,
  Home as HomeIcon,
  Settings as SettingsIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { usePremiumIntroStore } from "../features/premiumIntro/premiumIntroStore";
import { useSubscriptionStore } from "../features/subscription/subscriptionStore";
import MainScreen from "../screens/MainScreen";
import { useTheme } from "../theme/themeStore";
import AiScreenNav from "./screens/AiScreenNav";
import AllCountriesScreenNav from "./screens/AllCountriesScreenNav";
import SettingsScreenNav from "./screens/SettingsScreenNav";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.cardBg,
          borderTopColor: theme.cardBorder,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={MainScreen}
        options={{
          tabBarLabel: t("tabs.home"),
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AllCountries"
        component={AllCountriesScreenNav}
        options={{
          tabBarLabel: t("tabs.allCountries"),
          tabBarIcon: ({ color, size }) => <Globe2 color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AI"
        component={AiScreenNav}
        options={{
          tabBarLabel: t("tabs.ai"),
          tabBarIcon: ({ color, size }) => (
            <BotMessageSquare color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // 무료 + 아직 안 본 사용자만: 채팅 진입을 막고 프리미엄 안내로 보낸다.
            const { hydrated, seen } = usePremiumIntroStore.getState();
            const tier = useSubscriptionStore.getState().tier;
            if (hydrated && !seen && tier === "free") {
              e.preventDefault();
              navigation.getParent()?.navigate("PremiumIntro");
            }
          },
        })}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreenNav}
        options={{
          tabBarLabel: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
