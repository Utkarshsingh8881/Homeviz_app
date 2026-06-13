import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius, font, formatINR } from "@/src/theme";

type Project = any;

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "units" | "progress" | "trust">("overview");

  useEffect(() => {
    if (!id) return;
    api.get(`/projects/${id}`).then((r) => {
      setProject(r.data);
      setUnitId(r.data?.units?.[0]?.id ?? null);
    });
  }, [id]);

  const unit = useMemo(() => project?.units?.find((u: any) => u.id === unitId), [project, unitId]);

  if (!project) {
    return (
      <View style={[s.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Image source={{ uri: project.hero_image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(2,16,19,0.45)", "rgba(2,16,19,0)", "rgba(2,16,19,0.85)"]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top"]} style={s.heroTop}>
            <Pressable testID="back-btn" onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>
          <View style={s.heroFoot}>
            {project.builder_verified && (
              <View style={s.vbadge}>
                <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                <Text style={s.vbadgeTxt}>RERA Verified</Text>
              </View>
            )}
            <Text style={s.heroName}>{project.name}</Text>
            <Text style={s.heroTag}>
              {project.locality}, {project.city}
            </Text>
          </View>
        </View>

        <View style={s.priceRow}>
          <View>
            <Text style={s.priceLabel}>Starting from</Text>
            <Text style={s.price}>{formatINR(project.min_price)}</Text>
          </View>
          <View style={s.trustBig}>
            <Ionicons name="star" size={14} color={colors.brand} />
            <Text style={s.trustBigTxt}>{project.trust_score} Trust</Text>
          </View>
        </View>

        <View testID="detail-tabs" style={s.tabs}>
          {(["overview", "units", "progress", "trust"] as const).map((t) => (
            <Pressable
              key={t}
              testID={`detail-tab-${t}`}
              style={[s.tab, tab === t && s.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "overview" && (
          <View style={s.section}>
            <Text style={s.about}>{project.description}</Text>
            <Text style={s.sectionTitle}>Amenities</Text>
            <View style={s.amenities}>
              {project.amenities.map((a: string) => (
                <View key={a} style={s.amChip}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.brand} />
                  <Text style={s.amTxt}>{a}</Text>
                </View>
              ))}
            </View>
            <Text style={s.sectionTitle}>Builder</Text>
            <View style={s.builderRow}>
              <View style={s.builderAvatar}>
                <Text style={s.builderInitials}>
                  {project.builder_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.builderName}>{project.builder_name}</Text>
                <Text style={s.builderMeta}>
                  {project.builder_verified ? "Verified Builder" : "Pending Verification"} · RERA{" "}
                  {project.rera_id || "—"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {tab === "units" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Available units</Text>
            {project.units.map((u: any) => (
              <Pressable
                key={u.id}
                testID={`unit-${u.id}`}
                onPress={() => setUnitId(u.id)}
                style={[s.unitCard, unitId === u.id && s.unitCardActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.unitLabel}>{u.label}</Text>
                  <Text style={s.unitMeta}>
                    {u.type} · {u.carpet_area} sqft · Floor {u.floor} · {u.facing} facing
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.unitPrice}>{formatINR(u.base_price)}</Text>
                  <Text style={[s.unitStatus, u.status !== "available" && { color: colors.warning }]}>
                    {u.status}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {tab === "progress" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Construction progress</Text>
            <View style={s.progressBarOuter}>
              <View
                style={[
                  s.progressBarInner,
                  { width: `${project.progress[project.progress.length - 1]?.percent || 0}%` },
                ]}
              />
            </View>
            <Text style={s.progressPct}>
              {project.progress[project.progress.length - 1]?.percent || 0}% complete
            </Text>
            {project.progress.map((p: any, idx: number) => (
              <View key={p.id} style={s.timelineRow}>
                <View style={s.timelineCol}>
                  <View style={s.timelineDot} />
                  {idx < project.progress.length - 1 && <View style={s.timelineLine} />}
                </View>
                <View style={s.timelineCard}>
                  <Text style={s.timelineTitle}>{p.title}</Text>
                  <Text style={s.timelineDesc}>{p.description}</Text>
                  <Text style={s.timelinePct}>{p.percent}% complete</Text>
                </View>
              </View>
            ))}
            {project.progress.length === 0 && (
              <Text style={s.empty}>No construction updates yet.</Text>
            )}
          </View>
        )}

        {tab === "trust" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Documents & compliance</Text>
            {project.documents.map((d: any) => (
              <View key={d.name} style={s.docRow}>
                <Ionicons
                  name={d.verified ? "shield-checkmark" : "document-outline"}
                  size={18}
                  color={d.verified ? colors.success : colors.onSurfaceTertiary}
                />
                <Text style={s.docName}>{d.name}</Text>
                <Text style={[s.docStatus, { color: d.verified ? colors.success : colors.warning }]}>
                  {d.verified ? "Verified" : "Pending"}
                </Text>
              </View>
            ))}
            <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>Trust score breakdown</Text>
            {[
              { k: "Builder verified", v: project.builder_verified ? 25 : 0 },
              { k: "RERA registered", v: project.rera_id ? 25 : 0 },
              { k: "Documents on file", v: project.documents.length * 10 },
              { k: "Active progress updates", v: project.progress.length * 5 },
            ].map((row) => (
              <View key={row.k} style={s.scoreRow}>
                <Text style={s.scoreLabel}>{row.k}</Text>
                <Text style={s.scoreVal}>+{row.v}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={s.ctaBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.ctaLabel}>{unit?.label}</Text>
          <Text style={s.ctaPrice}>{unit ? formatINR(unit.base_price) : "—"}</Text>
        </View>
        <Pressable
          testID="customize-cta"
          style={s.ctaBtn}
          onPress={() =>
            router.push({
              pathname: "/(user)/studio",
              params: { projectId: project.id, unitId: unit?.id },
            } as any)
          }
        >
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          <Text style={s.ctaBtnText}>Customize & price</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 360 },
  heroTop: { position: "absolute", top: 0, left: 0, right: 0, padding: spacing.lg },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(2,16,19,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroFoot: { position: "absolute", bottom: spacing.xl, left: spacing.xl, right: spacing.xl },
  vbadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    backgroundColor: "rgba(10,37,40,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  vbadgeTxt: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  heroName: { color: "#FFFFFF", fontSize: 32, fontWeight: "300" },
  heroTag: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 4 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.xl,
  },
  priceLabel: { color: colors.onSurfaceTertiary, fontSize: font.sm },
  price: { fontSize: 24, fontWeight: "700", color: colors.onSurface, marginTop: 2 },
  trustBig: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  trustBigTxt: { color: colors.onBrandTertiary, fontWeight: "700" },
  tabs: { flexDirection: "row", paddingHorizontal: spacing.xl, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  tab: { paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.brand },
  tabText: { color: colors.onSurfaceTertiary, fontWeight: "600" },
  tabTextActive: { color: colors.brand },
  section: { padding: spacing.xl, gap: spacing.md },
  about: { color: colors.onSurfaceSecondary, lineHeight: 22, fontSize: font.lg },
  sectionTitle: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface, marginTop: spacing.md },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  amTxt: { fontSize: 12, color: colors.onSurfaceSecondary },
  builderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  builderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  builderInitials: { color: colors.onBrandTertiary, fontWeight: "700" },
  builderName: { fontSize: font.lg, fontWeight: "600", color: colors.onSurface },
  builderMeta: { color: colors.onSurfaceTertiary, fontSize: font.sm, marginTop: 2 },
  unitCard: {
    flexDirection: "row",
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  unitCardActive: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
  unitLabel: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  unitMeta: { color: colors.onSurfaceSecondary, fontSize: font.sm, marginTop: 4 },
  unitPrice: { fontSize: font.lg, fontWeight: "700", color: colors.brand },
  unitStatus: { fontSize: font.sm, color: colors.success, textTransform: "capitalize", marginTop: 4 },
  progressBarOuter: { height: 8, backgroundColor: colors.surfaceTertiary, borderRadius: 4, overflow: "hidden" },
  progressBarInner: { height: "100%", backgroundColor: colors.brand },
  progressPct: { color: colors.brand, fontWeight: "700", marginTop: spacing.xs, fontSize: font.lg },
  timelineRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  timelineCol: { alignItems: "center", width: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.brand, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 },
  timelineCard: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md },
  timelineTitle: { fontWeight: "700", color: colors.onSurface },
  timelineDesc: { color: colors.onSurfaceSecondary, marginTop: 2, fontSize: font.sm },
  timelinePct: { color: colors.brand, marginTop: 4, fontSize: font.sm, fontWeight: "600" },
  empty: { color: colors.onSurfaceTertiary, textAlign: "center", paddingVertical: 32 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  docName: { flex: 1, color: colors.onSurface, fontWeight: "600" },
  docStatus: { fontWeight: "700", fontSize: font.sm },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  scoreLabel: { color: colors.onSurfaceSecondary },
  scoreVal: { color: colors.brand, fontWeight: "700" },
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  ctaLabel: { color: colors.onSurfaceTertiary, fontSize: font.sm },
  ctaPrice: { fontSize: 18, fontWeight: "700", color: colors.onSurface, marginTop: 2 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  ctaBtnText: { color: "#FFFFFF", fontWeight: "700" },
});
