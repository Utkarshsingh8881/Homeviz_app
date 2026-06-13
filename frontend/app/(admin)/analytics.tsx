import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api } from "@/src/api";
import { colors, spacing, radius, font, formatINR } from "@/src/theme";

export default function AdminAnalytics() {
  const [stats, setStats] = useState<any | null>(null);

  const load = useCallback(async () => {
    const r = await api.get("/admin/stats");
    setStats(r.data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!stats) {
    return (
      <View style={[s.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const conversion = stats.bookings > 0 ? Math.round((stats.paid_bookings / stats.bookings) * 100) : 0;
  const verifiedPct = stats.builders > 0 ? Math.round((stats.verified_builders / stats.builders) * 100) : 0;
  const approvedPct = stats.projects > 0 ? Math.round((stats.approved_projects / stats.projects) * 100) : 0;

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <View style={s.head}>
        <Text style={s.kicker}>PLATFORM</Text>
        <Text style={s.title}>Analytics</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
        <View style={s.hero}>
          <Text style={s.heroLabel}>Total token revenue</Text>
          <Text style={s.heroValue}>{formatINR(stats.revenue)}</Text>
          <Text style={s.heroSub}>{stats.paid_bookings} confirmed bookings</Text>
        </View>

        <View style={s.grid}>
          <Stat icon="people" label="Users" value={stats.users} />
          <Stat icon="business" label="Builders" value={`${stats.verified_builders}/${stats.builders}`} sub={`${verifiedPct}% verified`} />
          <Stat icon="home" label="Projects" value={`${stats.approved_projects}/${stats.projects}`} sub={`${approvedPct}% approved`} />
          <Stat icon="bookmark" label="Bookings" value={stats.bookings} sub={`${conversion}% conversion`} />
        </View>

        <Text style={s.sectionTitle}>Platform health</Text>
        <Row label="Builder verification rate" pct={verifiedPct} />
        <Row label="Project approval rate" pct={approvedPct} />
        <Row label="Booking conversion" pct={conversion} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, label, value, sub }: { icon: any; label: string; value: any; sub?: string }) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon} size={18} color={colors.brand} />
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub && <Text style={s.statSub}>{sub}</Text>}
    </View>
  );
}

function Row({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={s.rowHead}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowPct}>{pct}%</Text>
      </View>
      <View style={s.barOuter}>
        <View style={[s.barInner, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  head: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, marginBottom: spacing.md },
  kicker: { color: colors.onSurfaceTertiary, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  hero: { backgroundColor: colors.brand, padding: spacing.xl, borderRadius: radius.lg },
  heroLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, letterSpacing: 2 },
  heroValue: { color: "#FFFFFF", fontSize: 36, fontWeight: "700", marginTop: 6 },
  heroSub: { color: "rgba(255,255,255,0.8)", marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg },
  statCard: { width: "47.5%", padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: 6 },
  statVal: { fontSize: font.xxl, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  statLabel: { color: colors.onSurfaceSecondary, fontSize: font.sm },
  statSub: { color: colors.brand, fontSize: 11, fontWeight: "600" },
  sectionTitle: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  rowHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  rowLabel: { color: colors.onSurfaceSecondary, fontSize: font.sm },
  rowPct: { color: colors.brand, fontWeight: "700" },
  barOuter: { height: 8, backgroundColor: colors.surfaceTertiary, borderRadius: 4, overflow: "hidden" },
  barInner: { height: "100%", backgroundColor: colors.brand },
});
