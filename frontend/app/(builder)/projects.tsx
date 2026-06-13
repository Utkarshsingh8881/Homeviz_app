import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { colors, spacing, radius, font, formatINR } from "@/src/theme";

export default function BuilderProjects() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/builder/my-projects");
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <View style={s.head}>
        <View>
          <Text style={s.kicker}>BUILDER</Text>
          <Text style={s.title}>{user?.company_name || user?.name}</Text>
          {!user?.verified && (
            <View style={s.warnPill}>
              <Ionicons name="warning-outline" size={12} color={colors.warning} />
              <Text style={s.warnTxt}>Awaiting admin verification</Text>
            </View>
          )}
        </View>
        <Pressable
          testID="new-project-btn"
          onPress={() => router.push("/(builder)/create-project" as any)}
          style={s.newBtn}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.brand} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="business-outline" size={48} color={colors.onSurfaceTertiary} />
              <Text style={s.emptyTxt}>No projects yet.</Text>
              <Pressable onPress={() => router.push("/(builder)/create-project" as any)} style={s.cta}>
                <Text style={s.ctaTxt}>Create your first project</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <View testID={`bproj-${item.id}`} style={s.card}>
              <Image source={{ uri: item.hero_image_url }} style={s.img} contentFit="cover" />
              <View style={s.cardBody}>
                <View style={s.cardHead}>
                  <Text style={s.cardName}>{item.name}</Text>
                  <View style={[s.statusPill, item.approved ? s.approved : s.pending]}>
                    <Text style={[s.statusTxt, item.approved ? s.approvedTxt : s.pendingTxt]}>
                      {item.approved ? "Live" : "Pending"}
                    </Text>
                  </View>
                </View>
                <Text style={s.cardMeta}>{item.locality}, {item.city}</Text>
                <Text style={s.cardPrice}>
                  {formatINR(item.min_price)} – {formatINR(item.max_price)}
                </Text>
                <View style={s.stats}>
                  <View style={s.stat}>
                    <Text style={s.statVal}>{item.units?.length || 0}</Text>
                    <Text style={s.statLabel}>units</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>{item.progress?.length || 0}</Text>
                    <Text style={s.statLabel}>updates</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>{item.trust_score}</Text>
                    <Text style={s.statLabel}>trust</Text>
                  </View>
                </View>
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
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  kicker: { color: colors.onSurfaceTertiary, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  warnPill: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  warnTxt: { color: colors.warning, fontSize: 11, fontWeight: "600" },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 80, gap: spacing.md },
  emptyTxt: { color: colors.onSurfaceSecondary },
  cta: { backgroundColor: colors.brand, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.pill },
  ctaTxt: { color: "#FFFFFF", fontWeight: "600" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  img: { height: 140, backgroundColor: colors.surfaceTertiary },
  cardBody: { padding: spacing.lg },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface, flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  approved: { backgroundColor: "#DCFCE7" },
  pending: { backgroundColor: "#FEF3C7" },
  statusTxt: { fontSize: 11, fontWeight: "700" },
  approvedTxt: { color: colors.success },
  pendingTxt: { color: colors.warning },
  cardMeta: { color: colors.onSurfaceSecondary, marginTop: 2 },
  cardPrice: { color: colors.brand, fontWeight: "700", marginTop: 4 },
  stats: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  stat: {},
  statVal: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  statLabel: { fontSize: 11, color: colors.onSurfaceTertiary, textTransform: "uppercase" },
});
