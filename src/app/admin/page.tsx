"use client";

import { useEffect, useState, useMemo } from "react";
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
  CreditCard,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const ADMIN_EMAIL = "belloimam431@gmail.com";

interface UserRecord {
  id: string;
  email: string;
  displayName?: string;
  usageCount: number;
  isPro: boolean;
  planTier?: PlanTier;
  createdAt?: string;
  lastUsedAt?: string;
  paymentReference?: string;
  proActivatedAt?: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, setIsAuthModalOpen } = useAuth();
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "business" | "creator" | "free">("all");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [modifyingUser, setModifyingUser] = useState<string | null>(null);

  // Integrated Testing & Verification state
  const [testReference, setTestReference] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, limit(100));
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
          displayName: user.displayName || "Admin",
          usageCount: 999,
          isPro: true,
          planTier: "business",
          createdAt: new Date().toISOString(),
        });
      }

      setUsersList(records);
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

      // Update local state
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

  // Run Integrated Payment Verification Test
  const handleRunIntegratedTest = async () => {
    if (!testReference.trim()) {
      alert("Please enter a payment reference to test.");
      return;
    }

    setTestingEndpoint(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: testReference.trim(),
          email: testEmail.trim() || user?.email,
          uid: user?.uid,
        }),
      });

      const data = await res.json();
      setTestResult({
        httpStatus: res.status,
        ok: res.ok,
        data,
      });

      if (res.ok && data.success) {
        // Refresh list to show newly verified tier
        fetchAnalytics();
      }
    } catch (err: any) {
      setTestResult({
        httpStatus: 500,
        ok: false,
        error: err.message || "Network exception during test",
      });
    } finally {
      setTestingEndpoint(false);
    }
  };

  // Aggregated Analytics Calculations
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    // Paying users (exclude admin)
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
    const totalRevenueUSD = (totalRevenueNGN / 1450).toFixed(2); // estimated exchange rate

    const totalTranscriptions = usersList.reduce((acc, u) => {
      if (u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return acc;
      return acc + (u.usageCount || 0);
    }, 0);

    const remainingFreeQuota = freeUsers.reduce(
      (acc, u) => acc + Math.max(0, 2 - (u.usageCount || 0)),
      0
    );

    const conversionRate =
      totalUsers > 1
        ? ((payingUsers.length / (totalUsers - 1)) * 100).toFixed(1)
        : "0";

    return {
      totalUsers,
      payingUsersCount: payingUsers.length,
      businessUsersCount: businessUsers.length,
      creatorUsersCount: creatorUsers.length,
      freeUsersCount: freeUsers.length,
      remainingFreeQuota,
      totalRevenueNGN,
      totalRevenueUSD,
      totalTranscriptions,
      conversionRate,
    };
  }, [usersList]);

  // Filtered users for directory table
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.paymentReference && u.paymentReference.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

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

  // If not admin or not logged in
  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-xl bg-white dark:bg-[#121214] border border-dashed border-red-500/30 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-dashed border-red-500/30">
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
              className="w-full py-3 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/30 cursor-pointer"
            >
              Sign In with Admin Account
            </button>
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-lg border border-dashed border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
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
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto pt-24 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-white dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-400 border border-dashed border-amber-500/40">
              <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Owner Portal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white mt-2 tracking-tight">
            VoiceScribe Platform Analytics &amp; Billing
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
            Real-time tracking of subscribers, Creator (₦5k / $5) vs Business (₦12k / $12) revenue, and Flutterwave payment references.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-dashed border-orange-500/30 shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
              Total Revenue Made
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-dashed border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-950 dark:text-white">
              ₦{stats.totalRevenueNGN.toLocaleString()}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium ml-2">
              (~${stats.totalRevenueUSD} USD)
            </span>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {stats.businessUsersCount} Business (₦12k) • {stats.creatorUsersCount} Creator (₦5k)
          </p>
        </motion.div>

        {/* Registered Visitors / Users */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-dashed border-gray-300 dark:border-white/15 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
              Total Users / Accounts
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-dashed border-blue-500/30">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-950 dark:text-white">
              {stats.totalUsers}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium ml-2">
              registered
            </span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-400 font-medium mt-2">
            {stats.payingUsersCount} paying subscribers
          </p>
        </motion.div>

        {/* Free Quotas Remaining */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-dashed border-gray-300 dark:border-white/15 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
              Free Quota Left
            </span>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-dashed border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-950 dark:text-white">
              {stats.remainingFreeQuota}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium ml-2">
              slots left
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold mt-2">
            {stats.freeUsersCount} free users (2 slots each)
          </p>
        </motion.div>

        {/* Total Transcriptions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-dashed border-gray-300 dark:border-white/15 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
              Transcriptions Run
            </span>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-dashed border-orange-500/30">
              <Mic className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-950 dark:text-white">
              {stats.totalTranscriptions}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium ml-2">
              processed
            </span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-400 font-medium mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ~2.5s avg VoiceScribe AI speed
          </p>
        </motion.div>

        {/* Conversion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-dashed border-gray-300 dark:border-white/15 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
              Pro Conversion
            </span>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-dashed border-purple-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-950 dark:text-white">
              {stats.conversionRate}%
            </span>
          </div>
          <p className="text-xs text-purple-800 dark:text-purple-400 font-semibold mt-2">
            Creator ₦5k / Business ₦12k
          </p>
        </motion.div>
      </div>

      {/* Integrated Testing & Verification Panel */}
      <div className="mb-8 p-6 rounded-xl bg-white dark:bg-[#121214] border border-dashed border-orange-500/35 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-dashed border-orange-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-950 dark:text-white">
                Integrated Flutterwave Payment Verification &amp; Tier Sandbox
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Validate live Flutterwave transactions or test tier resolution directly against the API endpoint.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Flutterwave Reference / TxID
            </label>
            <input
              type="text"
              placeholder="e.g. vs_business_1720000000_12345"
              value={testReference}
              onChange={(e) => setTestReference(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/15 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
              User Email (Optional)
            </label>
            <input
              type="email"
              placeholder={user?.email || "customer@example.com"}
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/15 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRunIntegratedTest}
              disabled={testingEndpoint}
              className="w-full py-2 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testingEndpoint ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Test Flutterwave Verification
                </>
              )}
            </button>
          </div>
        </div>

        {testResult && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-black/40 border border-dashed border-gray-300 dark:border-white/15 text-xs">
            <div className="flex items-center justify-between mb-1.5 font-bold">
              <span className={testResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                Status: {testResult.httpStatus} {testResult.ok ? "SUCCESS" : "FAILED"}
              </span>
              <span className="text-gray-500 font-mono text-[11px]">
                Plan: {testResult.data?.planTier || "N/A"}
              </span>
            </div>
            <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* User Directory Table Section */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-dashed border-gray-300 dark:border-white/15 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              Users &amp; Subscribers Directory
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
              Real-time billing status, Flutterwave transaction reference codes, and plan tier controls.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search email or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg text-xs bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/15 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 w-52 sm:w-64 font-medium"
              />
            </div>

            <div className="flex flex-wrap rounded-lg bg-gray-100 dark:bg-white/5 p-1 border border-dashed border-gray-300 dark:border-white/15 text-xs">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                All ({usersList.length})
              </button>
              <button
                onClick={() => setFilter("business")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  filter === "business"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                Business ({stats.businessUsersCount})
              </button>
              <button
                onClick={() => setFilter("creator")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  filter === "creator"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                Creator ({stats.creatorUsersCount})
              </button>
              <button
                onClick={() => setFilter("free")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  filter === "free"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                Free ({stats.freeUsersCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dashed border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Payment Reference</th>
                <th className="py-3 px-4">Transcriptions</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Manage Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-gray-100 dark:divide-white/5 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                    {loading ? "Loading analytics..." : "No matching users found."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isOwner = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                  const isBusiness = u.isPro && u.planTier === "business";
                  const isCreator = u.isPro && u.planTier !== "business";
                  const remainingQuota = Math.max(0, 2 - (u.usageCount || 0));

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs border border-dashed border-orange-500/30">
                            {u.email?.[0].toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-950 dark:text-white">
                              {u.displayName || u.email?.split("@")[0] || "User"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-400 border border-dashed border-amber-500/40">
                            <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Admin / VIP (180m)
                          </span>
                        ) : isBusiness ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-900 dark:text-emerald-400 border border-dashed border-emerald-500/40">
                            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Business Pro (90m)
                          </span>
                        ) : isCreator ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-900 dark:text-blue-400 border border-dashed border-blue-500/40">
                            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Creator Pro (20m)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-300 border border-dashed border-gray-300 dark:border-white/15">
                            Free Tier ({u.usageCount || 0}/2 used)
                          </span>
                        )}
                      </td>

                      {/* Payment Reference */}
                      <td className="py-3.5 px-4">
                        {u.paymentReference ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-dashed border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-300 max-w-[130px] truncate">
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

                      {/* Manage Plan / Action */}
                      <td className="py-3.5 px-4">
                        {isOwner ? (
                          <span className="text-xs text-amber-600 font-semibold">Protected</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={modifyingUser === u.id || isBusiness}
                              onClick={() => handleUpdateUserPlan(u.id, "business")}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 border border-dashed border-emerald-500/40 cursor-pointer disabled:opacity-40"
                              title="Set to Business Plan (₦12,000/90m)"
                            >
                              +Business
                            </button>
                            <button
                              disabled={modifyingUser === u.id || isCreator}
                              onClick={() => handleUpdateUserPlan(u.id, "creator")}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-blue-500/15 hover:bg-blue-500/25 text-blue-800 dark:text-blue-400 border border-dashed border-blue-500/40 cursor-pointer disabled:opacity-40"
                              title="Set to Creator Plan (₦5,000/20m)"
                            >
                              +Creator
                            </button>
                            <button
                              disabled={modifyingUser === u.id || (!isBusiness && !isCreator)}
                              onClick={() => handleUpdateUserPlan(u.id, "free")}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-dashed border-red-500/30 cursor-pointer disabled:opacity-40"
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
