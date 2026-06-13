import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api } from "@/src/api";
import { colors, spacing, radius, font } from "@/src/theme";

export default function BuilderProgress() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [percent, setPercent] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get("/builder/my-projects");
    setProjects(r.data);
    if (!selectedId && r.data.length > 0) setSelectedId(r.data[0].id);
  }, [selectedId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const current = projects.find((p) => p.id === selectedId);

  const submit = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await api.post(`/projects/${current.id}/progress`, {
        id: "x",
        title,
        description: desc,
        percent: parseInt(percent, 10) || 0,
        image_base64: null,
        created_at: new Date().toISOString(),
      });
      setTitle(""); setDesc(""); setPercent("");
      setModalOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <View style={s.head}>
        <View>
          <Text style={s.kicker}>CONSTRUCTION</Text>
          <Text style={s.title}>Progress updates</Text>
        </View>
        <Pressable
          testID="add-update-btn"
          onPress={() => setModalOpen(true)}
          disabled={!current}
          style={[s.addBtn, !current && { opacity: 0.4 }]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={s.addBtnTxt}>Update</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.projRow}>
        {projects.map((p) => (
          <Pressable
            key={p.id}
            testID={`prog-proj-${p.id}`}
            onPress={() => setSelectedId(p.id)}
            style={[s.projChip, selectedId === p.id && s.projChipActive]}
          >
            <Text style={[s.projChipTxt, selectedId === p.id && s.projChipTxtActive]}>{p.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
        {current ? (
          <>
            <Image source={{ uri: current.hero_image_url }} style={s.heroImg} contentFit="cover" />
            <View style={s.barOuter}>
              <View style={[s.barInner, { width: `${current.progress[current.progress.length - 1]?.percent || 0}%` }]} />
            </View>
            <Text style={s.pct}>
              {current.progress[current.progress.length - 1]?.percent || 0}% complete
            </Text>
            {current.progress.length === 0 ? (
              <Text style={s.empty}>No updates yet. Add the first milestone.</Text>
            ) : (
              current.progress.slice().reverse().map((u: any) => (
                <View key={u.id} style={s.upd}>
                  <View style={s.updHead}>
                    <Text style={s.updTitle}>{u.title}</Text>
                    <Text style={s.updPct}>{u.percent}%</Text>
                  </View>
                  <Text style={s.updDesc}>{u.description}</Text>
                </View>
              ))
            )}
          </>
        ) : (
          <Text style={s.empty}>Create a project first to post updates.</Text>
        )}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.modalRoot}>
          <Pressable style={s.modalBg} onPress={() => setModalOpen(false)} />
          <View style={s.modalCard}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>New progress update</Text>
              <Pressable onPress={() => setModalOpen(false)} testID="close-modal">
                <Ionicons name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>
            <Text style={s.label}>Milestone title</Text>
            <TextInput
              testID="upd-title"
              style={s.input}
              value={title}
              onChangeText={setTitle}
              placeholder="6th Floor Slab Complete"
            />
            <Text style={s.label}>Description</Text>
            <TextInput
              testID="upd-desc"
              style={[s.input, { height: 70 }]}
              value={desc}
              onChangeText={setDesc}
              multiline
              placeholder="6th floor slab poured and cured."
            />
            <Text style={s.label}>Completion %</Text>
            <TextInput
              testID="upd-percent"
              style={s.input}
              value={percent}
              onChangeText={setPercent}
              keyboardType="numeric"
              placeholder="60"
            />
            <Pressable testID="upd-submit" onPress={submit} disabled={busy || !title} style={[s.submit, (busy || !title) && { opacity: 0.6 }]}>
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.submitTxt}>Post update</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  kicker: { color: colors.onSurfaceTertiary, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  addBtnTxt: { color: "#FFFFFF", fontWeight: "700", fontSize: font.sm },
  projRow: { paddingHorizontal: spacing.xl, gap: 8, paddingBottom: spacing.md },
  projChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
  },
  projChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  projChipTxt: { color: colors.onSurfaceSecondary, fontWeight: "600", fontSize: 13 },
  projChipTxtActive: { color: "#FFFFFF" },
  heroImg: { height: 160, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary, marginBottom: spacing.lg },
  barOuter: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  barInner: { height: "100%", backgroundColor: colors.brand },
  pct: { color: colors.brand, fontWeight: "700", fontSize: font.lg, marginTop: 6, marginBottom: spacing.lg },
  empty: { color: colors.onSurfaceTertiary, textAlign: "center", paddingVertical: 40 },
  upd: { padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, marginBottom: spacing.sm },
  updHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  updTitle: { fontWeight: "700", color: colors.onSurface, flex: 1 },
  updPct: { color: colors.brand, fontWeight: "700" },
  updDesc: { color: colors.onSurfaceSecondary, marginTop: 4, fontSize: font.sm },
  // modal
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,16,19,0.5)" },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: font.xl, fontWeight: "700", color: colors.onSurface },
  label: { color: colors.onSurfaceSecondary, marginTop: spacing.md, marginBottom: 4, fontSize: font.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: font.base },
  submit: { backgroundColor: colors.brand, padding: 16, borderRadius: radius.md, alignItems: "center", marginTop: spacing.lg },
  submitTxt: { color: "#FFFFFF", fontWeight: "700", fontSize: font.lg },
});
