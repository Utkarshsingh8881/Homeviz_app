import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, Role } from "@/src/auth";
import { colors, spacing, radius, font } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80";

export default function Login() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const u = mode === "login" ? await login(email, password) : await signup(email, password, name || email, role);
      const home =
        u.role === "admin"
          ? "/(admin)/verify"
          : u.role === "builder"
            ? "/(builder)/projects"
            : "/(user)/discover";
      router.replace(home as any);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (kind: "user" | "builder" | "admin") => {
    const creds = {
      user: { e: "demo@user.com", p: "demo123" },
      builder: { e: "builder@aurelia.com", p: "builder123" },
      admin: { e: "admin@aura.com", p: "admin123" },
    }[kind];
    setEmail(creds.e);
    setPassword(creds.p);
    setMode("login");
  };

  return (
    <View style={s.root}>
      <View style={s.hero}>
        <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["rgba(2,16,19,0.3)", "rgba(2,16,19,0.95)"]}
          locations={[0.3, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={["top"]} style={s.heroInner}>
          <Text style={s.brand}>AURA</Text>
          <Text style={s.heroTitle}>Exclusive properties,{"\n"}reimagined.</Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.sheet}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.tabs}>
            <Pressable
              testID="tab-login"
              style={[s.tab, mode === "login" && s.tabActive]}
              onPress={() => setMode("login")}
            >
              <Text style={[s.tabText, mode === "login" && s.tabTextActive]}>Sign in</Text>
            </Pressable>
            <Pressable
              testID="tab-signup"
              style={[s.tab, mode === "signup" && s.tabActive]}
              onPress={() => setMode("signup")}
            >
              <Text style={[s.tabText, mode === "signup" && s.tabTextActive]}>Create account</Text>
            </Pressable>
          </View>

          {mode === "signup" && (
            <>
              <Text style={s.label}>Full name</Text>
              <TextInput
                testID="name-input"
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Aarav Mehta"
                placeholderTextColor={colors.onSurfaceTertiary}
              />
              <Text style={s.label}>I am a</Text>
              <View style={s.roleRow}>
                {(["user", "builder", "admin"] as Role[]).map((r) => (
                  <Pressable
                    key={r}
                    testID={`role-${r}`}
                    onPress={() => setRole(r)}
                    style={[s.roleChip, role === r && s.roleChipActive]}
                  >
                    <Text style={[s.roleText, role === r && s.roleTextActive]}>
                      {r === "user" ? "Buyer" : r === "builder" ? "Builder" : "Admin"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text style={s.label}>Email</Text>
          <TextInput
            testID="email-input"
            style={s.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
            placeholderTextColor={colors.onSurfaceTertiary}
          />
          <Text style={s.label}>Password</Text>
          <TextInput
            testID="password-input"
            style={s.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="\u2022\u2022\u2022\u2022\u2022\u2022"
            placeholderTextColor={colors.onSurfaceTertiary}
          />

          {err && (
            <Text testID="auth-error" style={s.err}>
              {err}
            </Text>
          )}

          <Pressable
            testID="submit-auth"
            onPress={submit}
            disabled={busy}
            style={[s.cta, busy && { opacity: 0.6 }]}
          >
            {busy ? (
              <ActivityIndicator color={colors.onBrandPrimary} />
            ) : (
              <Text style={s.ctaText}>{mode === "login" ? "Sign in" : "Create account"}</Text>
            )}
          </Pressable>

          <View style={s.demoBox}>
            <Text style={s.demoTitle}>Quick demo accounts</Text>
            <View style={s.demoRow}>
              <Pressable testID="demo-user" style={s.demoBtn} onPress={() => fillDemo("user")}>
                <Text style={s.demoBtnText}>Buyer</Text>
              </Pressable>
              <Pressable testID="demo-builder" style={s.demoBtn} onPress={() => fillDemo("builder")}>
                <Text style={s.demoBtnText}>Builder</Text>
              </Pressable>
              <Pressable testID="demo-admin" style={s.demoBtn} onPress={() => fillDemo("admin")}>
                <Text style={s.demoBtnText}>Admin</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 320 },
  heroInner: { flex: 1, justifyContent: "flex-end", padding: spacing.xl },
  brand: { color: "#FFFFFF", letterSpacing: 6, fontSize: 14, marginBottom: spacing.sm, fontWeight: "600" },
  heroTitle: { color: "#FFFFFF", fontSize: 34, lineHeight: 40, fontWeight: "300" },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.brand },
  tabText: { color: colors.onSurfaceSecondary, fontWeight: "600", fontSize: font.base },
  tabTextActive: { color: colors.onBrandPrimary },
  label: { fontSize: font.sm, color: colors.onSurfaceSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: font.lg,
    color: colors.onSurface,
    backgroundColor: colors.surface,
  },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  roleChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
  },
  roleChipActive: { backgroundColor: colors.brand },
  roleText: { color: colors.onBrandTertiary, fontWeight: "600" },
  roleTextActive: { color: colors.onBrandPrimary },
  cta: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  ctaText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: font.lg },
  err: { color: colors.error, marginTop: spacing.md, fontSize: font.base },
  demoBox: { marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  demoTitle: { fontSize: font.sm, color: colors.onSurfaceSecondary, marginBottom: spacing.sm, fontWeight: "600" },
  demoRow: { flexDirection: "row", gap: spacing.sm },
  demoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  demoBtnText: { color: colors.onSurface, fontWeight: "600", fontSize: font.sm },
});
