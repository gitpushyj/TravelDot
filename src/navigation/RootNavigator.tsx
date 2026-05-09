import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GlobalSyncProgressBar from "../components/GlobalSyncProgressBar";
import { useTheme } from "../theme/themeStore";
import MainTabs from "./MainTabs";
import AddTripScreenNav from "./screens/AddTripScreenNav";
import AllCountriesScreenNav from "./screens/AllCountriesScreenNav";
import ChangeHomeScreenNav from "./screens/ChangeHomeScreenNav";
import CountryDetailScreenNav from "./screens/CountryDetailScreenNav";
import CountryMergeScreenNav from "./screens/CountryMergeScreenNav";
import EditTripScreenNav from "./screens/EditTripScreenNav";
import HistoryScreenNav from "./screens/HistoryScreenNav";
import ImageDetailScreenNav from "./screens/ImageDetailScreenNav";
import LanguageScreenNav from "./screens/LanguageScreenNav";
import MapZoomScreenNav from "./screens/MapZoomScreenNav";
import ReviewSuspectScreenNav from "./screens/ReviewSuspectScreenNav";
import MilestonesScreenNav from "./screens/MilestonesScreenNav";
import TitlesScreenNav from "./screens/TitlesScreenNav";
import TripDetailScreenNav from "./screens/TripDetailScreenNav";
import { navigationRef } from "./navigationRef";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const theme = useTheme();
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.homeBg },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AddTrip" component={AddTripScreenNav} />
        <Stack.Screen name="ChangeHome" component={ChangeHomeScreenNav} />
        <Stack.Screen name="Titles" component={TitlesScreenNav} />
        <Stack.Screen name="Milestones" component={MilestonesScreenNav} />
        <Stack.Screen name="MapZoom" component={MapZoomScreenNav} />
        <Stack.Screen name="CountryDetail" component={CountryDetailScreenNav} />
        <Stack.Screen name="CountryMerge" component={CountryMergeScreenNav} />
        <Stack.Screen name="TripDetail" component={TripDetailScreenNav} />
        <Stack.Screen name="EditTrip" component={EditTripScreenNav} />
        <Stack.Screen name="History" component={HistoryScreenNav} />
        <Stack.Screen name="ReviewSuspect" component={ReviewSuspectScreenNav} />
        <Stack.Screen name="AllCountries" component={AllCountriesScreenNav} />
        <Stack.Screen name="Language" component={LanguageScreenNav} />
        <Stack.Screen
          name="ImageDetail"
          component={ImageDetailScreenNav}
          options={{ animation: "fade" }}
        />
      </Stack.Navigator>
      <GlobalSyncProgressBar />
    </NavigationContainer>
  );
}
