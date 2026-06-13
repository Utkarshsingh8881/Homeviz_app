import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius, font, formatINR } from "@/src/theme";

export default function Bookings() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/bookings/my");
      setItems(r.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <Text style={s.title}>Your bookings</Text>
      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.brand} /></View>
      ) : (
        <FlatList
          testID="bookings-list"
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.brand}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="bookmark-outline" size={48} color={colors.onSurfaceTertiary} />
              <Text style={s.emptyTxt}>No bookings yet.</Text>
              <Pressable onPress={() => router.push("/(user)/discover" as any)} style={s.cta}>
                <Text style={s.ctaTxt}>Explore properties</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`booking-${item.id}`}
              onPress={() => router.push({ pathname: "/(user)/booking", params: { bookingId: item.id } } as any)}
              style={s.card}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.bName}>{item.project_name}</Text>
                <Text style={s.bUnit}>{item.unit_label} · {formatINR(item.total_price)}</Text>
                <View style={s.bMeta}>
                  <View style={[s.statusPill, item.payment_status === "succeeded" ? s.success : s.pending]}>
                    <Text style={[s.statusTxt, item.payment_status === "succeeded" ? s.successTxt : s.pendingTxt]}>
                      {item.payment_status === "succeeded" ? "Confirmed" : "Pending payment"}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceTertiary} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  title: { fontSize: 28, fontWeight: "300", color: colors.onSurface, paddingHorizontal: spacing.xl, marginTop: spacing.sm, marginBottom: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: spacing.md },
  emptyTxt: { color: colors.onSurfaceSecondary },
  cta: { backgroundColor: colors.brand, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.pill },
  ctaTxt: { color: "#FFFFFF", fontWeight: "600" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  bName: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  bUnit: { color: colors.onSurfaceSecondary, marginTop: 2 },
  bMeta: { flexDirection: "row", marginTop: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  success: { backgroundColor: "#DCFCE7" },
  pending: { backgroundColor: "#FEF3C7" },
  statusTxt: { fontSize: 11, fontWeight: "700" },
  successTxt: { color: colors.success },
  pendingTxt: { color: colors.warning },
});
