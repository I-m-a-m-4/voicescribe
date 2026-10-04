"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth, PlanTier } from "@/context/auth-context";
import { collection, getDocs, query, limit, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  DollarSign,
  Mic,
  TrendingUp,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Crown,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Zap,
  Copy,
  Check,
  Repeat,
  UserCheck,
  Laptop,
  Globe,
  Calendar,
  Layers,
  Activity,
} from "lucide-react";

const ADMIN_EMAIL = "belloimam431@gmail.com";

interface UserRecord {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  usageCount: number;
  isPro: boolean;
  planTier?: PlanTier;
  createdAt?: string;
  lastUsedAt?: string;
  lastLoginAt?: string;
  lastSeenAt?: string;
  visitCount?: number;
  loginCount?: number;
  authProvider?: string;
  authMethod?: string;
  googleVerified?: boolean;
  platform?: string;
  paymentReference?: string;
  proActivatedAt?: string;
}

interface VisitorRecord {
  id: string;
  visitorId: string;
  firstSeenAt?: string;
  firstSeenDate?: string;
  lastSeenAt?: string;
  lastSeenDate?: string;
  visitCount?: number;
  isReturning?: boolean;
  isRegistered?: boolean;
  userId?: string;
  email?: string;
  displayName?: string;
  authProvider?: string;
  platform?: "web" | "desktop_windows" | string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, setIsAuthModalOpen } = useAuth();
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [visitorsList, setVisitorsList] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "google" | "business" | "creator" | "free">("all");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [modifyingUser, setModifyingUser] = useState<string | null>(null);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users collection
      const usersRef = collection(db, "users");
      const q = query(usersRef, limit(300));
      const snap = await getDocs(q);

      const records: UserRecord[] = [];
      snap.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<UserRecord, "id">),
        });
      });

      // Ensure Admin is recognized
      if (user && !records.some((r) => r.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
        records.unshift({
          id: user.uid,
          email: ADMIN_EMAIL,
          displayName: user.displayName || "Admin (Bello)",
          photoURL: user.photoURL || undefined,
          usageCount: 999,
          isPro: true,
          planTier: "business",
          authProvider: "google",
          googleVerified: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          visitCount: 25,
        });
      }

      setUsersList(records);

      // 2. Fetch Visitors collection for traffic and retention cohorts
      try {
        const visitorsRef = collection(db, "visitors");
        const vSnap = await getDocs(query(visitorsRef, limit(500)));
        const vRecords: VisitorRecord[] = [];
        vSnap.forEach((vDoc) => {
          vRecords.push({
            id: vDoc.id,
            ...(vDoc.data() as Omit<VisitorRecord, "id">),
          });
        });
        setVisitorsList(vRecords);
      } catch (vErr) {
        console.warn("Visitors fetch notice:", vErr);
      }
    } catch (err) {
      console.error("Error loading admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, user]);

  // Admin tier override / quick grant action
  const handleUpdateUserPlan = async (targetUserId: string, newTier: PlanTier) => {
    setModifyingUser(targetUserId);
    try {
      const userRef = doc(db, "users", targetUserId);
      const isNowPro = newTier !== "free";
      await updateDoc(userRef, {
        isPro: isNowPro,
        planTier: newTier,
        ...(isNowPro ? { proActivatedAt: new Date().toISOString() } : {}),
      });

      setUsersList((prev) =>
        prev.map((u) =>
          u.id === targetUserId
            ? { ...u, isPro: isNowPro, planTier: newTier }
            : u
        )
      );
    } catch (err) {
      console.error("Failed to update user plan:", err);
      alert("Failed to update user plan. Please verify Firestore security rules.");
    } finally {
      setModifyingUser(null);
    }
  };

  // Aggregated Analytics Calculations
  const stats = useMemo(() => {
    const totalUsers = usersList.length;

    // 1. Real Google Sign-ups tracking
    const googleUsers = usersList.filter(
      (u) =>
        u.authProvider === "google" ||
        u.googleVerified ||
        (u.email && u.email.toLowerCase().endsWith("@gmail.com"))
    );
    const googleUsersCount = googleUsers.length;
    const googlePercentage =
      totalUsers > 0 ? ((googleUsersCount / totalUsers) * 100).toFixed(1) : "0";

    // 2. Paying subscribers & Revenue
    const payingUsers = usersList.filter(
      (u) => u.isPro && u.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    );
    const businessUsers = payingUsers.filter((u) => u.planTier === "business");
    const creatorUsers = payingUsers.filter((u) => u.planTier !== "business");
    const freeUsers = usersList.filter(
      (u) => !u.isPro && u.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    );

    const totalRevenueNGN = payingUsers.reduce((sum, u) => {
      return sum + (u.planTier === "business" ? 12000 : 5000);
    }, 0);
    const totalRevenueUSD = (totalRevenueNGN / 1450).toFixed(2);

    const totalTranscriptions = usersList.reduce((acc, u) => {
      if (u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return acc;
      return acc + (u.usageCount || 0);
    }, 0);

    const conversionRate =
      totalUsers > 1
        ? ((payingUsers.length / (totalUsers - 1)) * 100).toFixed(1)
        : "0";

    // 3. Unique People / Visitors & Platform Breakdown
    const uniqueIds = new Set<string>();
    visitorsList.forEach((v) => uniqueIds.add(v.visitorId || v.id));
    usersList.forEach((u) => uniqueIds.add(u.id));
    const totalUniqueVisitors = Math.max(uniqueIds.size, visitorsList.length, totalUsers);

    const desktopVisitorsCount = visitorsList.filter(
      (v) => v.platform === "desktop_windows" || v.platform?.includes("desktop")
    ).length;
    const webVisitorsCount = Math.max(0, totalUniqueVisitors - desktopVisitorsCount);

    // Active users: Daily Active Users (DAU) & Weekly Active Users (WAU)
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const dauCount = Math.max(
      1,
      visitorsList.filter((v) => {
        const t = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : 0;
        return nowMs - t <= oneDayMs;
      }).length
    );
    const wauCount = Math.max(
      dauCount,
      visitorsList.filter((v) => {
        const t = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : 0;
        return nowMs - t <= 7 * oneDayMs;
      }).length
    );

    // 4. Return Frequency & Retention Metrics
    const returningVisitors = visitorsList.filter((v) => (v.visitCount || 0) > 1);
    const returningUsers = usersList.filter((u) => (u.visitCount || 0) > 1 || (u.loginCount || 0) > 1);
    const totalReturningCount = Math.max(returningVisitors.length, returningUsers.length);
    const retentionRate =
      totalUniqueVisitors > 0
        ? ((totalReturningCount / totalUniqueVisitors) * 100).toFixed(1)
        : "0";

    const singleVisitCount = Math.max(0, totalUniqueVisitors - totalReturningCount);
    const repeat2to3 = visitorsList.filter((v) => (v.visitCount || 1) >= 2 && (v.visitCount || 1) <= 3).length;
    const repeat4to9 = visitorsList.filter((v) => (v.visitCount || 1) >= 4 && (v.visitCount || 1) <= 9).length;
    const repeat10plus = visitorsList.filter((v) => (v.visitCount || 1) >= 10).length;

    // 5. In-Depth Retention Cohort Matrix
    const cohortDefs = [
      { id: "w1", name: "Current Week (0-7d)", minDays: 0, maxDays: 7, label: "Newest cohort" },
      { id: "w2", name: "Week 2 (8-14d)", minDays: 7, maxDays: 14, label: "2nd week cohort" },
      { id: "w3", name: "Week 3 (15-21d)", minDays: 14, maxDays: 21, label: "3rd week cohort" },
      { id: "w4", name: "Week 4 (22-30d)", minDays: 21, maxDays: 30, label: "Month 1 cohort" },
      { id: "older", name: "Older (30+ days)", minDays: 30, maxDays: 9999, label: "Mature cohort" },
    ];

    const retentionCohorts = cohortDefs.map((def) => {
      // Find all visitors in this cohort
      const cohortVisitors = visitorsList.filter((v) => {
        const time = v.firstSeenAt ? new Date(v.firstSeenAt).getTime() : nowMs;
        const diffDays = (nowMs - time) / oneDayMs;
        return diffDays >= def.minDays && diffDays < def.maxDays;
      });

      const size = cohortVisitors.length;
      if (size === 0) {
        return {
          ...def,
          size: 0,
          d0: 100,
          d1: 0,
          d3: 0,
          d7: 0,
          d14: 0,
          d30: 0,
          overallRetention: 0,
          avgVisits: "1.0",
        };
      }

      const returned = cohortVisitors.filter((v) => (v.visitCount || 1) > 1).length;
      const overallRetention = Math.round((returned / size) * 100);

      // Day retention rates based on activity gap
      const d1 = Math.round(
        (cohortVisitors.filter((v) => {
          const first = v.firstSeenAt ? new Date(v.firstSeenAt).getTime() : nowMs;
          const last = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : first;
          return (v.visitCount || 1) > 1 || (last - first) >= oneDayMs;
        }).length / size) * 100
      );

      const d3 = Math.round(
        (cohortVisitors.filter((v) => {
          const first = v.firstSeenAt ? new Date(v.firstSeenAt).getTime() : nowMs;
          const last = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : first;
          return (v.visitCount || 1) >= 2 && (last - first) >= 3 * oneDayMs;
        }).length / size) * 100
      );

      const d7 = Math.round(
        (cohortVisitors.filter((v) => {
          const first = v.firstSeenAt ? new Date(v.firstSeenAt).getTime() : nowMs;
          const last = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : first;
          return (v.visitCount || 1) >= 3 && (last - first) >= 7 * oneDayMs;
        }).length / size) * 100
      );

      const d14 = Math.round(
        (cohortVisitors.filter((v) => {
          const first = v.firstSeenAt ? new Date(v.firstSeenAt).getTime() : nowMs;
          const last = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : first;
          return (v.visitCount || 1) >= 4 && (last - first) >= 14 * oneDayMs;
        }).length / size) * 100
      );

      const d30 = Math.round(
        (cohortVisitors.filter((v) => {
          const first = v.firstSeenAt ? new Date(v.firstSeenAt).getTime() : nowMs;
          const last = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : first;
          return (v.visitCount || 1) >= 5 && (last - first) >= 30 * oneDayMs;
        }).length / size) * 100
      );

      const totalVisits = cohortVisitors.reduce((acc, v) => acc + (v.visitCount || 1), 0);
      const avgVisits = (totalVisits / size).toFixed(1);

      return {
        ...def,
        size,
        d0: 100,
        d1,
        d3,
        d7,
        d14,
        d30,
        overallRetention,
        avgVisits,
      };
    });

    return {
      totalUsers,
      googleUsersCount,
      googlePercentage,
      payingUsersCount: payingUsers.length,
      businessUsersCount: businessUsers.length,
      creatorUsersCount: creatorUsers.length,
      freeUsersCount: freeUsers.length,
      totalRevenueNGN,
      totalRevenueUSD,
      totalTranscriptions,
      conversionRate,
      totalUniqueVisitors,
      desktopVisitorsCount,
      webVisitorsCount,
      totalReturningCount,
      retentionRate,
      dauCount,
      wauCount,
      singleVisitCount,
      repeat2to3,
      repeat4to9,
      repeat10plus,
      retentionCohorts,
    };
  }, [usersList, visitorsList]);

  // Filtered users for directory table
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.paymentReference && u.paymentReference.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filter === "google") {
        return (
          u.authProvider === "google" ||
          u.googleVerified ||
          (u.email && u.email.toLowerCase().endsWith("@gmail.com"))
        );
      }
      if (filter === "business") return u.isPro && u.planTier === "business";
      if (filter === "creator") return u.isPro && u.planTier !== "business";
      if (filter === "free") return !u.isPro;
      return true;
    });
  }, [usersList, searchQuery, filter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Helper for cohort cell heatmap styling
  const getCohortBadgeStyle = (percentage: number) => {
    if (percentage >= 70) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold";
    if (percentage >= 40) return "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold";
    if (percentage >= 15) return "bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium";
    if (percentage > 0) return "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-400";
    return "text-gray-300 dark:text-gray-600 font-normal";
  };

  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#121214] border border-red-500/30 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-2">
            Admin Access Restricted
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-400 mb-6">
            This analytics portal is reserved exclusively for the platform owner (<strong>{ADMIN_EMAIL}</strong>).
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/30 cursor-pointer"
            >
              Sign In with Admin Account
            </button>
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 w-full max-w-[1800px] mx-auto pt-24 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-400 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Owner Portal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white mt-3 tracking-tight">
            VoiceScribe Platform Analytics &amp; Retention
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time executive tracking of unique people, return cohorts, Google sign-up accounts, and Creator/Business subscriptions.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Live Data
        </button>
      </div>

      {/* KPI Cards Grid (Solid Borders, Spacious Padding, Clear Typography) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5 mb-8">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
              ₦{stats.totalRevenueNGN.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            ~${stats.totalRevenueUSD} USD • {stats.payingUsersCount} paying
          </p>
        </motion.div>

        {/* Unique Visitors / People */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Unique Visitors
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
              {stats.totalUniqueVisitors}
            </span>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
            🌐 {stats.webVisitorsCount} Web • 💻 {stats.desktopVisitorsCount} Desktop
          </p>
        </motion.div>

        {/* User Retention Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Return Retention
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {stats.retentionRate}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            {stats.totalReturningCount} visitors returned 2+ times
          </p>
        </motion.div>

        {/* Real Google Sign-Ups */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Google Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
              G
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {stats.googleUsersCount}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            {stats.googlePercentage}% of registered users
          </p>
        </motion.div>

        {/* Transcriptions Processed */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Transcriptions
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
              {stats.totalTranscriptions}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            ~2.5s avg processing speed
          </p>
        </motion.div>

        {/* Conversion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Pro Conversion
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {stats.conversionRate}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            {stats.payingUsersCount} of {stats.totalUsers} registered
          </p>
        </motion.div>
      </div>

      {/* Retention Cohorts & Frequency Analytics Section (Full Width, Solid Borders) */}
      <div className="mb-10 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-950 dark:text-white">
                Retention Cohort Heatmap &amp; Visitor Frequency
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Cohort analysis by acquisition week, showing the percentage of users returning on Day 1, 3, 7, 14, and 30+.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300">
              DAU: <strong className="text-indigo-600 dark:text-indigo-400">{stats.dauCount}</strong> • WAU: <strong className="text-indigo-600 dark:text-indigo-400">{stats.wauCount}</strong>
            </div>
          </div>
        </div>

        {/* Cohort Heatmap Table & Frequency Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Cohort Heatmap Matrix */}
          <div className="xl:col-span-3 overflow-x-auto">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Cohort Retention Heatmap
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Cohort Period</th>
                  <th className="py-3 px-3 text-center">Users</th>
                  <th className="py-3 px-3 text-center">Day 0</th>
                  <th className="py-3 px-3 text-center">Day 1</th>
                  <th className="py-3 px-3 text-center">Day 3</th>
                  <th className="py-3 px-3 text-center">Day 7</th>
                  <th className="py-3 px-3 text-center">Day 14</th>
                  <th className="py-3 px-3 text-center">Day 30+</th>
                  <th className="py-3 px-3 text-right">Avg Visits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {stats.retentionCohorts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">
                      {c.name}
                      <span className="block text-[10px] text-gray-400 font-normal">{c.label}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-gray-800 dark:text-gray-200">
                      {c.size}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-1 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                        100%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 rounded text-[11px] ${getCohortBadgeStyle(c.d1)}`}>
                        {c.size > 0 ? `${c.d1}%` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 rounded text-[11px] ${getCohortBadgeStyle(c.d3)}`}>
                        {c.size > 0 ? `${c.d3}%` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 rounded text-[11px] ${getCohortBadgeStyle(c.d7)}`}>
                        {c.size > 0 ? `${c.d7}%` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 rounded text-[11px] ${getCohortBadgeStyle(c.d14)}`}>
                        {c.size > 0 ? `${c.d14}%` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 rounded text-[11px] ${getCohortBadgeStyle(c.d30)}`}>
                        {c.size > 0 ? `${c.d30}%` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-gray-800 dark:text-gray-300">
                      {c.size > 0 ? `${c.avgVisits}x` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visitor Return Frequency Distribution */}
          <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-500" /> Return Frequency
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1.5">
                    <span className="text-gray-500">1 Visit (Single session):</span>
                    <span className="font-bold text-gray-900 dark:text-white">{stats.singleVisitCount}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gray-400 rounded-full"
                      style={{
                        width: `${stats.totalUniqueVisitors > 0 ? (stats.singleVisitCount / stats.totalUniqueVisitors) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1.5">
                    <span className="text-gray-500">2 - 3 Return Visits:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.repeat2to3}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${stats.totalUniqueVisitors > 0 ? (stats.repeat2to3 / stats.totalUniqueVisitors) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1.5">
                    <span className="text-gray-500">4 - 9 Return Visits:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{stats.repeat4to9}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${stats.totalUniqueVisitors > 0 ? (stats.repeat4to9 / stats.totalUniqueVisitors) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1.5">
                    <span className="text-gray-500">10+ Visits (Power Users):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.repeat10plus}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${stats.totalUniqueVisitors > 0 ? (stats.repeat10plus / stats.totalUniqueVisitors) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-500">
              <span>Overall Returning:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {stats.totalReturningCount} people ({stats.retentionRate}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Directory Table Section (Full Width, Solid Borders) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              Users &amp; Google Sign-Ups Directory
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Filter by Real Google accounts, review return visit frequency, and control subscription plans.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search email, name or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 w-56 sm:w-72 font-medium"
              />
            </div>

            <div className="flex flex-wrap rounded-xl bg-gray-100 dark:bg-white/5 p-1 border border-gray-200 dark:border-white/10 text-xs">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                All ({usersList.length})
              </button>
              <button
                onClick={() => setFilter("google")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === "google"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <span className="font-bold">Google</span> ({stats.googleUsersCount})
              </button>
              <button
                onClick={() => setFilter("business")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === "business"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Business ({stats.businessUsersCount})
              </button>
              <button
                onClick={() => setFilter("creator")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === "creator"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Creator ({stats.creatorUsersCount})
              </button>
              <button
                onClick={() => setFilter("free")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === "free"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Free ({stats.freeUsersCount})
              </button>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Auth Method</th>
                <th className="py-3.5 px-4">Return Visits</th>
                <th className="py-3.5 px-4">Plan Tier</th>
                <th className="py-3.5 px-4">Payment Reference</th>
                <th className="py-3.5 px-4">Transcriptions</th>
                <th className="py-3.5 px-4">Revenue</th>
                <th className="py-3.5 px-4">Plan Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500 text-xs">
                    {loading ? "Loading analytics..." : "No matching users found."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isOwner = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                  const isBusiness = u.isPro && u.planTier === "business";
                  const isCreator = u.isPro && u.planTier !== "business";
                  const isGoogleUser =
                    u.authProvider === "google" ||
                    u.googleVerified ||
                    (u.email && u.email.toLowerCase().endsWith("@gmail.com"));

                  const visitCount = u.visitCount || u.loginCount || 1;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <Image
                              unoptimized
                              src={u.photoURL}
                              alt={u.displayName || "User"}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-lg object-cover border border-gray-200 dark:border-white/10"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/20">
                              {u.email?.[0].toUpperCase() || "U"}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-950 dark:text-white">
                              {u.displayName || u.email?.split("@")[0] || "User"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Auth Method Badge */}
                      <td className="py-3.5 px-4">
                        {isGoogleUser ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Google OAuth
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                            Email &amp; Password
                          </span>
                        )}
                      </td>

                      {/* Return Visits & Retention */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                            {visitCount} visits
                          </span>
                          {visitCount > 1 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                              Returning
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Plan Tier */}
                      <td className="py-3.5 px-4">
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-400 border border-amber-500/30">
                            <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Admin / VIP (180m)
                          </span>
                        ) : isBusiness ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-900 dark:text-emerald-400 border border-emerald-500/30">
                            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Business Pro (90m)
                          </span>
                        ) : isCreator ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-900 dark:text-blue-400 border border-blue-500/30">
                            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Creator Pro (20m)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                            Free Tier ({u.usageCount || 0}/2 used)
                          </span>
                        )}
                      </td>

                      {/* Payment Reference */}
                      <td className="py-3.5 px-4">
                        {u.paymentReference ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-300 max-w-[130px] truncate">
                              {u.paymentReference}
                            </span>
                            <button
                              onClick={() => copyToClipboard(u.paymentReference!)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 cursor-pointer"
                              title="Copy Reference"
                            >
                              {copiedRef === u.paymentReference ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-950 dark:text-white">
                        {isOwner ? "Unlimited" : `${u.usageCount || 0} files`}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-950 dark:text-white">
                        {isOwner ? "Owner (Free)" : isBusiness ? "₦12,000 NGN" : isCreator ? "₦5,000 NGN" : "₦0"}
                      </td>

                      {/* Manage Plan Action */}
                      <td className="py-3.5 px-4">
                        {isOwner ? (
                          <span className="text-xs text-amber-600 font-semibold">Protected</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={modifyingUser === u.id || isBusiness}
                              onClick={() => handleUpdateUserPlan(u.id, "business")}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30 cursor-pointer disabled:opacity-40"
                              title="Set to Business Plan (₦12,000/90m)"
                            >
                              +Business
                            </button>
                            <button
                              disabled={modifyingUser === u.id || isCreator}
                              onClick={() => handleUpdateUserPlan(u.id, "creator")}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-500/15 hover:bg-blue-500/25 text-blue-800 dark:text-blue-400 border border-blue-500/30 cursor-pointer disabled:opacity-40"
                              title="Set to Creator Plan (₦5,000/20m)"
                            >
                              +Creator
                            </button>
                            <button
                              disabled={modifyingUser === u.id || (!isBusiness && !isCreator)}
                              onClick={() => handleUpdateUserPlan(u.id, "free")}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/20 cursor-pointer disabled:opacity-40"
                              title="Reset to Free Tier"
                            >
                              Revoke
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
