import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, font, radius } from "@/src/theme";
import { ProjectCard, ProjectCardData } from "@/src/components/ProjectCard";

const CITIES = ["All", "Mumbai", "Bangalore", "Chennai"];
const BHKS = ["All", "2BHK", "3BHK", "4BHK"];

export default function Discover() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [city, setCity] = useState("All");
  const [bhk, setBhk] = useState("All");

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (city !== "All") params.city = city;
      if (bhk !== "All") params.bhk = bhk;
      const res = await api.get("/projects", { params });
      setProjects(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [city, bhk]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <View style={s.header}>
        <Text style={s.brand}>AURA</Text>
        <Pressable testID="search-btn" style={s.searchBtn}>
          <Ionicons name="search-outline" size={20} color={colors.brand} />
        </Pressable>
      </View>

      <Text style={s.title}>Exclusive properties,{"\n"}curated for refined living</Text>

      <View testID="filter-chip-row" style={s.chipRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRowContent}
        >
          {CITIES.map((c) => (
            <Pressable
              key={c}
              testID={`chip-city-${c}`}
              style={[s.chip, city === c && s.chipActive]}
              onPress={() => setCity(c)}
            >
              <Text style={[s.chipText, city === c && s.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
          <View style={s.chipDivider} />
          {BHKS.map((b) => (
            <Pressable
              key={b}
              testID={`chip-bhk-${b}`}
              style={[s.chip, bhk === b && s.chipActive]}
              onPress={() => setBhk(b)}
            >
              <Text style={[s.chipText, bhk === b && s.chipTextActive]}>{b}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.brand} />
          <Text style={s.loadingTxt}>Curating exclusive properties...</Text>
        </View>
      ) : (
        <FlatList
          testID="projects-list"
          data={projects}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <ProjectCard project={item} onPress={() => router.push(`/(user)/project/${item.id}` as any)} />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="business-outline" size={48} color={colors.onSurfaceTertiary} />
              <Text style={s.emptyTxt}>No listings match your criteria.</Text>
              <Pressable
                onPress={() => {
                  setCity("All");
                  setBhk("All");
                }}
                style={s.clearBtn}
              >
                <Text style={s.clearBtnText}>Clear filters</Text>
              </Pressable>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  brand: { letterSpacing: 5, fontWeight: "700", color: colors.brand, fontSize: 14 },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "300",
    color: colors.onSurface,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  chipRowWrap: { height: 56, marginBottom: spacing.md },
  chipRowContent: {
    paddingHorizontal: spacing.xl,
    gap: 8,
    alignItems: "center",
    height: 56,
  },
  chip: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: colors.onBrandPrimary },
  chipDivider: { width: 1, height: 24, backgroundColor: colors.borderStrong, alignSelf: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingTxt: { color: colors.onSurfaceTertiary, fontSize: font.sm },
  empty: { alignItems: "center", paddingVertical: 80, gap: spacing.md },
  emptyTxt: { color: colors.onSurfaceSecondary },
  clearBtn: { backgroundColor: colors.brand, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.pill },
  clearBtnText: { color: colors.onBrandPrimary, fontWeight: "600" },
});
