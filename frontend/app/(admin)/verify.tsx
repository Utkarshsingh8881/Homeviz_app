import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api } from "@/src/api";
import { colors, spacing, radius, font } from "@/src/theme";

export default function AdminVerify() {
  const [builders, setBuilders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/builders");
      setBuilders(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const verify = async (id: string) => {
    setActingId(id);
    try {
      await api.post(`/admin/builders/${id}/verify`, {});
      await load();
    } finally {
      setActingId(null);
    }
  };

  const pending = builders.filter((b) => !b.verified);
  const verified = builders.filter((b) => b.verified);

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <View style={s.head}>
        <Text style={s.kicker}>ADMIN</Text>
        <Text style={s.title}>Builder verification</Text>
        <View style={s.statRow}>
          <View style={s.stat}><Text style={s.statV}>{pending.length}</Text><Text style={s.statL}>Pending</Text></View>
          <View style={s.stat}><Text style={s.statV}>{verified.length}</Text><Text style={s.statL}>Verified</Text></View>
          <View style={s.stat}><Text style={s.statV}>{builders.length}</Text><Text style={s.statL}>Total</Text></View>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.brand} /></View>
      ) : (
        <FlatList
          testID="verify-list"
          data={builders}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.onSurfaceTertiary} />
              <Text style={s.emptyTxt}>No pending verifications.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View testID={`builder-${item.id}`} style={s.card}>
              <View style={s.avatar}>
                <Text style={s.avTxt}>{(item.company_name || item.name).slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.company_name || item.name}</Text>
                <Text style={s.email}>{item.email}</Text>
                <View style={[s.pill, item.verified ? s.ok : s.warn]}>
                  <Ionicons
                    name={item.verified ? "shield-checkmark" : "alert-circle"}
                    size={11}
                    color={item.verified ? colors.success : colors.warning}
                  />
                  <Text style={[s.pillTxt, { color: item.verified ? colors.success : colors.warning }]}>
                    {item.verified ? "Verified" : "Pending"}
                  </Text>
                </View>
              </View>
              {!item.verified && (
                <Pressable
                  testID={`verify-${item.id}`}
                  onPress={() => verify(item.id)}
                  disabled={actingId === item.id}
                  style={s.act}
                >
                  {actingId === item.id ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={s.actTxt}>Verify</Text>
                  )}
                </Pressable>
              )}
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
  title: { fontSize: 26, fontWeight: "600", color: colors.onSurface, marginTop: 4, marginBottom: spacing.md },
  statRow: { flexDirection: "row", gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surfaceSecondary, padding: spacing.md, borderRadius: radius.md },
  statV: { fontSize: font.xl, fontWeight: "700", color: colors.brand },
  statL: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 80, gap: spacing.md },
  emptyTxt: { color: colors.onSurfaceSecondary },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.onBrandTertiary, fontWeight: "700" },
  name: { fontWeight: "700", color: colors.onSurface },
  email: { color: colors.onSurfaceSecondary, fontSize: font.sm, marginTop: 2 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, marginTop: 6 },
  ok: { backgroundColor: "#DCFCE7" },
  warn: { backgroundColor: "#FEF3C7" },
  pillTxt: { fontSize: 11, fontWeight: "700" },
  act: { backgroundColor: colors.brand, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  actTxt: { color: "#FFFFFF", fontWeight: "700", fontSize: font.sm },
});
