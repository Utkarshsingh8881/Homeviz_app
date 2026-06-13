import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/src/api";
import { colors, spacing, radius, font, formatINR } from "@/src/theme";

const FALLBACK_HERO =
  "https://images.pexels.com/photos/20418771/pexels-photo-20418771.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

type Option = { key: string; label: string; price_delta: number; category: string };

const ROOMS = ["living", "bedroom", "kitchen"] as const;

export default function Studio() {
  const router = useRouter();
  const { projectId, unitId } = useLocalSearchParams<{ projectId?: string; unitId?: string }>();
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [unit, setUnit] = useState<any>(null);
  const [room, setRoom] = useState<(typeof ROOMS)[number]>("living");
  const [selected, setSelected] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [renderUri, setRenderUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  // Load default project if none passed
  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}`).then((r) => {
        setProject(r.data);
        const u = r.data.units?.find((x: any) => x.id === unitId) || r.data.units?.[0];
        setUnit(u);
      });
    } else {
      api.get("/projects").then((r) => {
        setProjects(r.data);
        if (r.data.length > 0) {
          setProject(r.data[0]);
          setUnit(r.data[0].units?.[0]);
        }
      });
    }
  }, [projectId, unitId]);

  const options = useMemo(() => (project?.design_options as Option[]) || [], [project]);

  const optionsByCat = useMemo(() => {
    const m: Record<string, Option[]> = {};
    options.forEach((o) => {
      m[o.category] = m[o.category] || [];
      m[o.category].push(o);
    });
    return m;
  }, [options]);

  const toggle = (key: string, category: string) => {
    setSelected((prev) => {
      // one per category
      const filtered = prev.filter((k) => {
        const opt = options.find((o) => o.key === k);
        return opt?.category !== category;
      });
      return prev.includes(key) ? filtered : [...filtered, key];
    });
  };

  const recompute = useCallback(async () => {
    if (!project || !unit) return;
    setBusy(true);
    try {
      const res = await api.post("/pricing/estimate", {
        project_id: project.id,
        unit_id: unit.id,
        selected_option_keys: selected,
      });
      setEstimate(res.data);
    } finally {
      setBusy(false);
    }
  }, [project, unit, selected]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  const generate = async () => {
    if (!project || !unit) return;
    setAiBusy(true);
    setRenderUri(null);
    try {
      const labels = selected
        .map((k) => options.find((o) => o.key === k)?.label)
        .filter(Boolean)
        .join(", ");
      const res = await api.post("/ai/customize-room", {
        project_id: project.id,
        unit_id: unit.id,
        room_type: room,
        style_prompt: labels || "modern, premium, magazine-quality finishes",
      });
      setRenderUri(`data:${res.data.mime_type};base64,${res.data.image_base64}`);
    } catch (e: any) {
      // ignore — fallback hero will still show
    } finally {
      setAiBusy(false);
    }
  };

  const book = async () => {
    if (!project || !unit || !estimate) return;
    setBusy(true);
    try {
      const b = await api.post("/bookings", {
        project_id: project.id,
        unit_id: unit.id,
        selected_option_keys: selected,
        total_price: estimate.total_price,
      });
      router.push({ pathname: "/(user)/booking", params: { bookingId: b.data.id } } as any);
    } finally {
      setBusy(false);
    }
  };

  if (!project || !unit) {
    return (
      <View style={[s.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.imgWrap}>
        <Image
          source={{ uri: renderUri || project.hero_image_url || FALLBACK_HERO }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={["rgba(2,16,19,0.5)", "rgba(2,16,19,0)", "rgba(2,16,19,0.85)"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={["top"]} style={s.imgTop}>
          <Pressable onPress={() => router.back()} style={s.backBtn} testID="studio-back">
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={s.roomChips}>
            {ROOMS.map((r) => (
              <Pressable
                key={r}
                testID={`room-${r}`}
                onPress={() => setRoom(r)}
                style={[s.roomChip, room === r && s.roomChipActive]}
              >
                <Text style={[s.roomChipTxt, room === r && s.roomChipTxtActive]}>
                  {r[0].toUpperCase() + r.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ width: 40 }} />
        </SafeAreaView>
        <View style={s.imgFoot}>
          <Text style={s.studioLabel}>AI Studio · {project.name}</Text>
          <Text style={s.studioUnit}>
            {unit.label} · {unit.type} · {unit.carpet_area} sqft
          </Text>
          <Pressable
            testID="generate-ai"
            onPress={generate}
            disabled={aiBusy}
            style={[s.genBtn, aiBusy && { opacity: 0.6 }]}
          >
            {aiBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                <Text style={s.genBtnTxt}>{renderUri ? "Regenerate" : "Generate AI preview"}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <View style={s.sheet}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(optionsByCat).map(([cat, opts]) => (
            <View key={cat} style={s.catBlock}>
              <Text style={s.catTitle}>{cat[0].toUpperCase() + cat.slice(1)}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.optRow}
              >
                {opts.map((o) => (
                  <Pressable
                    key={o.key}
                    testID={`opt-${o.key}`}
                    onPress={() => toggle(o.key, o.category)}
                    style={[s.optChip, selected.includes(o.key) && s.optChipActive]}
                  >
                    <Text style={[s.optLabel, selected.includes(o.key) && s.optLabelActive]}>
                      {o.label}
                    </Text>
                    <Text style={[s.optDelta, selected.includes(o.key) && s.optDeltaActive]}>
                      +{formatINR(o.price_delta)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        <View style={s.ctaBar}>
          <View style={{ flex: 1 }}>
            <Text style={s.totalLabel}>Estimated total</Text>
            <Text testID="total-price" style={s.totalPrice}>
              {busy ? "…" : estimate ? formatINR(estimate.total_price) : "—"}
            </Text>
            {estimate && estimate.upgrades_total > 0 && (
              <Text style={s.upgradeNote}>+ {formatINR(estimate.upgrades_total)} upgrades</Text>
            )}
          </View>
          <Pressable testID="book-cta" onPress={book} disabled={busy} style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>Book unit</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  imgWrap: { height: 380, backgroundColor: colors.surfaceTertiary },
  imgTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(2,16,19,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  roomChips: { flexDirection: "row", gap: 6, backgroundColor: "rgba(2,16,19,0.5)", padding: 4, borderRadius: radius.pill },
  roomChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  roomChipActive: { backgroundColor: "#FFFFFF" },
  roomChipTxt: { color: "rgba(255,255,255,0.85)", fontWeight: "600", fontSize: 12 },
  roomChipTxtActive: { color: colors.brand },
  imgFoot: { position: "absolute", left: spacing.xl, right: spacing.xl, bottom: spacing.xl },
  studioLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, letterSpacing: 2, marginBottom: 4 },
  studioUnit: { color: "#FFFFFF", fontSize: 22, fontWeight: "300" },
  genBtn: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(10,37,40,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  genBtnTxt: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.xl,
  },
  catBlock: { marginBottom: spacing.lg },
  catTitle: {
    paddingHorizontal: spacing.xl,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: spacing.sm,
    fontSize: font.lg,
  },
  optRow: { paddingHorizontal: spacing.xl, gap: 10 },
  optChip: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 140,
  },
  optChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  optLabel: { color: colors.onSurface, fontWeight: "600", fontSize: 13 },
  optLabelActive: { color: "#FFFFFF" },
  optDelta: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 4 },
  optDeltaActive: { color: "rgba(255,255,255,0.85)" },
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  totalLabel: { color: colors.onSurfaceTertiary, fontSize: font.sm },
  totalPrice: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  upgradeNote: { color: colors.brand, fontSize: 11, marginTop: 2 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brand,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  ctaBtnText: { color: "#FFFFFF", fontWeight: "700" },
});
