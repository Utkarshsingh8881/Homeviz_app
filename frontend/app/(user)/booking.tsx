import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius, font, formatINR } from "@/src/theme";

export default function Booking() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [intent, setIntent] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) return;
    api.get("/bookings/my").then((r) => {
      const b = r.data.find((x: any) => x.id === bookingId);
      setBooking(b);
      if (b?.payment_status === "succeeded") setPaid(true);
    });
  }, [bookingId]);

  const startPayment = async () => {
    setBusy(true);
    try {
      const res = await api.post("/payments/create-intent", { booking_id: bookingId });
      setIntent(res.data);
    } catch {
      // fall through to mock
    } finally {
      setBusy(false);
    }
  };

  const confirmPayment = async () => {
    setBusy(true);
    try {
      const res = await api.post("/payments/mock-confirm", { booking_id: bookingId });
      setBooking(res.data);
      setPaid(true);
    } finally {
      setBusy(false);
    }
  };

  if (!booking) {
    return (
      <View style={[s.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <View style={s.header}>
        <Pressable testID="booking-back" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={s.title}>Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 200 }}>
        {paid ? (
          <View style={s.successBox}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={s.successTitle}>Token booked!</Text>
            <Text style={s.successDesc}>
              Your unit {booking.unit_label} at {booking.project_name} is reserved. Our team will reach
              out shortly to complete KYC and full sale agreement.
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.kicker}>Reserving</Text>
            <Text style={s.projectName}>{booking.project_name}</Text>
            <Text style={s.unitLabel}>
              Unit {booking.unit_label} · {formatINR(booking.total_price)}
            </Text>

            <View style={s.summary}>
              <View style={s.row}>
                <Text style={s.rowLabel}>Total estimated price</Text>
                <Text style={s.rowVal}>{formatINR(booking.total_price)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.rowLabel}>Token amount (refundable)</Text>
                <Text style={s.rowVal}>{formatINR(booking.booking_token)}</Text>
              </View>
              <View style={[s.row, s.rowTotal]}>
                <Text style={s.rowLabel}>Due now</Text>
                <Text style={s.rowValBig}>{formatINR(booking.booking_token)}</Text>
              </View>
            </View>

            <View style={s.note}>
              <Ionicons name="information-circle" size={16} color={colors.info} />
              <Text style={s.noteTxt}>
                Test mode: Stripe PaymentIntent will be created on the server. Tap “Confirm token
                payment” to simulate a successful test charge.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {!paid && (
        <View style={s.ctaBar}>
          {!intent ? (
            <Pressable testID="start-payment" onPress={startPayment} disabled={busy} style={s.ctaBtn}>
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                  <Text style={s.ctaBtnText}>Start Stripe payment</Text>
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              testID="confirm-payment"
              onPress={confirmPayment}
              disabled={busy}
              style={s.ctaBtn}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={s.ctaBtnText}>Confirm token payment</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  kicker: { color: colors.onSurfaceTertiary, fontSize: 12, letterSpacing: 2, marginBottom: 4 },
  projectName: { fontSize: 28, fontWeight: "300", color: colors.onSurface },
  unitLabel: { color: colors.onSurfaceSecondary, marginTop: 4, marginBottom: spacing.xl },
  summary: { backgroundColor: colors.surfaceSecondary, padding: spacing.lg, borderRadius: radius.md },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  rowTotal: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  rowLabel: { color: colors.onSurfaceSecondary },
  rowVal: { color: colors.onSurface, fontWeight: "600" },
  rowValBig: { fontSize: 20, fontWeight: "700", color: colors.brand },
  note: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#EFF6FF",
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  noteTxt: { flex: 1, color: colors.info, fontSize: 12 },
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  ctaBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: font.lg },
  successBox: { alignItems: "center", paddingVertical: 32, gap: spacing.md },
  successTitle: { fontSize: 26, fontWeight: "600", color: colors.onSurface },
  successDesc: { color: colors.onSurfaceSecondary, textAlign: "center", lineHeight: 22 },
});
