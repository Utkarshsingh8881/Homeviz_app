import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth";
import { colors, spacing, radius, font } from "@/src/theme";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  if (!user) return null;

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <Text style={s.title}>Profile</Text>

      <View style={s.card}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>
            {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={s.name}>{user.name}</Text>
        <Text style={s.email}>{user.email}</Text>
        <View style={s.rolePill}>
          <Text style={s.roleTxt}>
            {user.role === "user" ? "Buyer" : user.role === "builder" ? "Builder" : "Admin"}
          </Text>
        </View>
      </View>

      <View style={s.section}>
        {[
          { icon: "person-outline", label: "Account settings" },
          { icon: "shield-checkmark-outline", label: "Trust & verification" },
          { icon: "card-outline", label: "Payment methods" },
          { icon: "help-circle-outline", label: "Help & support" },
        ].map((row) => (
          <View key={row.label} style={s.row}>
            <Ionicons name={row.icon as any} size={20} color={colors.onSurfaceSecondary} />
            <Text style={s.rowLabel}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceTertiary} />
          </View>
        ))}
      </View>

      <Pressable testID="logout-btn" onPress={onLogout} style={s.logout}>
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={s.logoutTxt}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  title: { fontSize: 28, fontWeight: "300", color: colors.onSurface, marginTop: spacing.sm, marginBottom: spacing.lg },
  card: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  name: { fontSize: font.xl, fontWeight: "700", color: colors.onSurface, marginTop: spacing.sm },
  email: { color: colors.onSurfaceSecondary },
  rolePill: {
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  roleTxt: { color: colors.onBrandTertiary, fontWeight: "700", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  section: { marginTop: spacing.xl, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, color: colors.onSurface, fontWeight: "600" },
  logout: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
  },
  logoutTxt: { color: colors.error, fontWeight: "700" },
});
