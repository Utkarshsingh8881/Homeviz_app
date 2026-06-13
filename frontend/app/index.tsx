import { View, ActivityIndicator } from "react-native";
import { colors } from "@/src/theme";

export default function Index() {
  // _layout's Gate handles redirect — show spinner while it decides.
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}
