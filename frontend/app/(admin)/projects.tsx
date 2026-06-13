import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api } from "@/src/api";
import { colors, spacing, radius, font, formatINR } from "@/src/theme";

export default function AdminProjects() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "pending">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/projects");
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const approve = async (id: string) => {
    setActingId(id);
    try {
      await api.post(`/admin/projects/${id}/approve`, {});
      await load();
    } finally {
      setActingId(null);
    }
  };

  const filtered = tab === "pending" ? items.filter((p) => !p.approved) : items;

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <View style={s.head}>
        <Text style={s.kicker}>ADMIN</Text>
        <Text style={s.title}>Project approvals</Text>
      </View>

      <View testID="admin-proj-tabs" style={s.tabs}>
        <Pressable
          testID="tab-pending"
          onPress={() => setTab("pending")}
          style={[s.tab, tab === "pending" && s.tabActive]}
        >
          <Text style={[s.tabTxt, tab === "pending" && s.tabTxtActive]}>
            Pending ({items.filter((p) => !p.approved).length})
          </Text>
        </Pressable>
        <Pressable testID="tab-all" onPress={() => setTab("all")} style={[s.tab, tab === "all" && s.tabActive]}>
          <Text style={[s.tabTxt, tab === "all" && s.tabTxtActive]}>All ({items.length})</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.brand} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="business-outline" size={48} color={colors.onSurfaceTertiary} />
              <Text style={s.emptyTxt}>No projects in this view.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View testID={`aproj-${item.id}`} style={s.card}>
              <Image source={{ uri: item.hero_image_url }} style={s.img} contentFit="cover" />
              <View style={s.body}>
                <View style={s.row}>
                  <Text style={s.name}>{item.name}</Text>
                  <View style={[s.pill, item.approved ? s.ok : s.warn]}>
                    <Text style={[s.pillTxt, { color: item.approved ? colors.success : colors.warning }]}>
                      {item.approved ? "Live" : "Pending"}
                    </Text>
                  </View>
                </View>
                <Text style={s.meta}>by {item.builder_name} · {item.city}</Text>
                <Text style={s.price}>{formatINR(item.min_price)} – {formatINR(item.max_price)}</Text>
                {!item.approved && (
                  <Pressable
                    testID={`approve-${item.id}`}
                    onPress={() => approve(item.id)}
                    disabled={actingId === item.id}
                    style={s.approve}
                  >
                    {actingId === item.id ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                        <Text style={s.approveTxt}>Approve listing</Text>
                      </>
                    )}
                  </Pressable>
                )}
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
  tabs: { flexDirection: "row", paddingHorizontal: spacing.xl, gap: 8, marginBottom: spacing.md },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary },
  tabActive: { backgroundColor: colors.brand },
  tabTxt: { color: colors.onSurfaceSecondary, fontWeight: "600", fontSize: 13 },
  tabTxtActive: { color: "#FFFFFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 80, gap: spacing.md },
  emptyTxt: { color: colors.onSurfaceSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: spacing.lg },
  img: { height: 120, backgroundColor: colors.surfaceTertiary },
  body: { padding: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface, flex: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  ok: { backgroundColor: "#DCFCE7" },
  warn: { backgroundColor: "#FEF3C7" },
  pillTxt: { fontSize: 11, fontWeight: "700" },
  meta: { color: colors.onSurfaceSecondary, marginTop: 2 },
  price: { color: colors.brand, fontWeight: "700", marginTop: 4 },
  approve: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  approveTxt: { color: "#FFFFFF", fontWeight: "700", fontSize: font.sm },
});
