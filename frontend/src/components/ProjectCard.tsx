import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, font, formatINR } from "@/src/theme";

export type ProjectCardData = {
  id: string;
  name: string;
  tagline: string;
  city: string;
  locality: string;
  hero_image_url: string;
  min_price: number;
  max_price: number;
  bhk_types: string[];
  builder_name: string;
  builder_verified: boolean;
  trust_score: number;
  possession_date: string;
};

export function ProjectCard({ project, onPress }: { project: ProjectCardData; onPress: () => void }) {
  return (
    <Pressable testID={`project-card-${project.id}`} onPress={onPress} style={s.card}>
      <View style={s.imgWrap}>
        <Image source={{ uri: project.hero_image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(2,16,19,0.85)"]}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        {project.builder_verified && (
          <View style={s.verified}>
            <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
            <Text style={s.verifiedTxt}>Verified</Text>
          </View>
        )}
        <View style={s.imgFoot}>
          <Text style={s.name} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={s.tagline} numberOfLines={1}>
            {project.locality}, {project.city}
          </Text>
        </View>
      </View>
      <View style={s.body}>
        <View style={s.row}>
          <Text style={s.price}>
            {formatINR(project.min_price)} – {formatINR(project.max_price)}
          </Text>
          <View style={s.trust}>
            <Ionicons name="star" size={12} color={colors.brand} />
            <Text style={s.trustTxt}>{project.trust_score}</Text>
          </View>
        </View>
        <View style={s.metaRow}>
          <Text style={s.meta}>{project.bhk_types.join(" · ")}</Text>
          <Text style={s.dot}>·</Text>
          <Text style={s.meta}>Possession {project.possession_date}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imgWrap: { height: 240, backgroundColor: colors.surfaceTertiary },
  verified: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10,37,40,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  verifiedTxt: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  imgFoot: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.lg },
  name: { color: "#FFFFFF", fontSize: 22, fontWeight: "600", marginBottom: 2 },
  tagline: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  body: { padding: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  trust: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  trustTxt: { fontSize: 12, fontWeight: "700", color: colors.onBrandTertiary },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xs, gap: 6 },
  meta: { color: colors.onSurfaceSecondary, fontSize: font.sm },
  dot: { color: colors.onSurfaceTertiary },
});
