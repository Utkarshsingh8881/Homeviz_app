import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius, font } from "@/src/theme";

const DEFAULT_OPTIONS = [
  { key: "wall_warm_white", label: "Warm White Walls", price_delta: 25000, category: "wall" },
  { key: "wall_terracotta", label: "Terracotta Accent Wall", price_delta: 65000, category: "wall" },
  { key: "floor_oak", label: "European Oak Flooring", price_delta: 180000, category: "flooring" },
  { key: "floor_marble", label: "Italian Marble", price_delta: 320000, category: "flooring" },
  { key: "kitchen_modular", label: "Modular Kitchen", price_delta: 250000, category: "kitchen" },
  { key: "light_smart", label: "Smart Home Lighting", price_delta: 180000, category: "lighting" },
  { key: "furniture_scandi", label: "Scandinavian Furniture", price_delta: 220000, category: "furniture" },
  { key: "finish_premium", label: "Premium Finish Package", price_delta: 350000, category: "finish" },
];

const HERO_OPTIONS = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
];

export default function CreateProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [locality, setLocality] = useState("");
  const [possession, setPossession] = useState("Dec 2026");
  const [description, setDescription] = useState("");
  const [minPrice, setMinPrice] = useState("25000000");
  const [maxPrice, setMaxPrice] = useState("60000000");
  const [hero, setHero] = useState(HERO_OPTIONS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const minP = parseInt(minPrice, 10) || 0;
      const maxP = parseInt(maxPrice, 10) || 0;
      const units = [8, 12, 14, 18].map((floor, i) => ({
        id: `u-${floor}`,
        label: `A-${floor.toString().padStart(2, "0")}04`,
        type: i % 2 === 0 ? "3BHK" : "2BHK",
        carpet_area: 900 + floor * 20,
        floor,
        facing: ["East", "North-East", "West", "South"][i],
        status: "available",
        base_price: minP + floor * 150000,
      }));
      const res = await api.post("/projects", {
        name,
        tagline,
        city,
        locality,
        possession_date: possession,
        description,
        hero_image_url: hero,
        gallery: [],
        bhk_types: ["2BHK", "3BHK"],
        min_price: minP,
        max_price: maxP,
        amenities: ["Pool", "Gym", "Concierge"],
        units,
        design_options: DEFAULT_OPTIONS,
        rera_id: null,
      });
      router.back();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Could not create project");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <View style={s.head}>
        <Pressable onPress={() => router.back()} style={s.backBtn} testID="cp-back">
          <Ionicons name="chevron-back" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={s.title}>New project</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <Text style={s.label}>Project name</Text>
          <TextInput testID="cp-name" style={s.input} value={name} onChangeText={setName} placeholder="Aurelia Heights" />
          <Text style={s.label}>Tagline</Text>
          <TextInput testID="cp-tagline" style={s.input} value={tagline} onChangeText={setTagline} placeholder="Sky-touch residences" />
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>City</Text>
              <TextInput testID="cp-city" style={s.input} value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Locality</Text>
              <TextInput testID="cp-locality" style={s.input} value={locality} onChangeText={setLocality} placeholder="Bandra West" />
            </View>
          </View>
          <Text style={s.label}>Possession</Text>
          <TextInput testID="cp-possession" style={s.input} value={possession} onChangeText={setPossession} />
          <Text style={s.label}>Description</Text>
          <TextInput
            testID="cp-description"
            style={[s.input, { height: 80 }]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Curated 2 & 3 BHK..."
          />
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Min price (INR)</Text>
              <TextInput
                testID="cp-min-price"
                style={s.input}
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Max price (INR)</Text>
              <TextInput
                testID="cp-max-price"
                style={s.input}
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
          <Text style={s.label}>Hero image</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {HERO_OPTIONS.map((url) => (
              <Pressable key={url} onPress={() => setHero(url)} style={[s.heroOpt, hero === url && s.heroOptActive]}>
                <Text style={s.heroOptTxt}>{HERO_OPTIONS.indexOf(url) + 1}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {err && <Text style={s.err}>{err}</Text>}
        </ScrollView>
        <View style={s.ctaBar}>
          <Pressable testID="cp-submit" onPress={submit} disabled={busy || !name} style={[s.cta, (busy || !name) && { opacity: 0.6 }]}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.ctaTxt}>Publish project</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: font.lg, fontWeight: "700" },
  label: { color: colors.onSurfaceSecondary, marginTop: spacing.md, marginBottom: 4, fontSize: font.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: font.base,
  },
  row2: { flexDirection: "row", gap: spacing.md },
  heroOpt: {
    width: 80, height: 60, borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  heroOptActive: { borderColor: colors.brand },
  heroOptTxt: { color: colors.onSurfaceSecondary, fontWeight: "700" },
  err: { color: colors.error, marginTop: spacing.md },
  ctaBar: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  cta: { backgroundColor: colors.brand, paddingVertical: 16, borderRadius: radius.md, alignItems: "center" },
  ctaTxt: { color: "#FFFFFF", fontWeight: "700", fontSize: font.lg },
});
