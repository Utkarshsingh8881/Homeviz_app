import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius, font, formatINR } from "@/src/theme";

export default function BuilderLeads() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/builder/leads");
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalToken = items.filter((b) => b.payment_status === "succeeded").reduce((sum, b) => sum + b.booking_token, 0);

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <View style={s.head}>
        <Text style={s.kicker}>LEADS &amp; BOOKINGS</Text>
        <Text style={s.title}>{items.length} total</Text>
      </View>

      <View style={s.stats}>
        <View style={s.statCard}>
          <Text style={s.statVal}>{items.length}</Text>
          <Text style={s.statLabel}>Total leads</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statVal}>{items.filter((b) => b.payment_status === "succeeded").length}</Text>
          <Text style={s.statLabel}>Confirmed</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statVal}>{formatINR(totalToken)}</Text>
          <Text style={s.statLabel}>Token revenue</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.brand} /></View>
      ) : (
        <FlatList
          testID="leads-list"
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={48} color={colors.onSurfaceTertiary} />
              <Text style={s.emptyTxt}>No leads yet. Promote your projects to capture interest.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.avatar}><Text style={s.avTxt}>{(item.user_name || "U").charAt(0)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.user_name}</Text>
                <Text style={s.meta}>{item.project_name} · {item.unit_label}</Text>
                <Text style={s.price}>{formatINR(item.total_price)}</Text>
              </View>
              <View style={[s.pill, item.payment_status === "succeeded" ? s.ok : s.pend]}>
                <Text style={[s.pillTxt, item.payment_status === "succeeded" ? s.okTxt : s.pendTxt]}>
                  {item.payment_status === "succeeded" ? "Confirmed" : "Pending"}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  head: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, marginBottom: spacing.md },
  kicker: { color: colors.onSurfaceTertiary, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  stats: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md },
  statVal: { fontSize: font.xl, fontWeight: "700", color: colors.brand },
  statLabel: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 80, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTxt: { color: colors.onSurfaceSecondary, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.onBrandTertiary, fontWeight: "700" },
  name: { color: colors.onSurface, fontWeight: "700" },
  meta: { color: colors.onSurfaceSecondary, fontSize: font.sm, marginTop: 2 },
  price: { color: colors.brand, fontWeight: "600", marginTop: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  ok: { backgroundColor: "#DCFCE7" },
  pend: { backgroundColor: "#FEF3C7" },
  pillTxt: { fontSize: 11, fontWeight: "700" },
  okTxt: { color: colors.success },
  pendTxt: { color: colors.warning },
});
