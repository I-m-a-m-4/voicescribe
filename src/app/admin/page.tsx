"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
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
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const ADMIN_EMAIL = "belloimam431@gmail.com";
const PRICE_PER_PRO_NGN = 1000;

interface UserRecord {
  id: string;
  email: string;
  displayName?: string;
  usageCount: number;
  isPro: boolean;
  createdAt?: string;
  lastUsedAt?: string;
  paymentReference?: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, setIsAuthModalOpen } = useAuth();
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pro" | "free">("all");

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

  // Aggregated Analytics Calculations
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    // Paying users (exclude admin)
    const payingUsers = usersList.filter(
      (u) => u.isPro && u.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    );
    const totalRevenueNGN = payingUsers.length * PRICE_PER_PRO_NGN;
    const totalRevenueUSD = (totalRevenueNGN / 1450).toFixed(2); // estimated exchange rate

    const totalTranscriptions = usersList.reduce((acc, u) => {
      if (u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return acc;
      return acc + (u.usageCount || 0);
    }, 0);

    const conversionRate = totalUsers > 1 
      ? ((payingUsers.length / (totalUsers - 1)) * 100).toFixed(1)
      : "0";

    return {
      totalUsers,
      payingUsersCount: payingUsers.length,
      totalRevenueNGN,
      totalRevenueUSD,
      totalTranscriptions,
      conversionRate,
    };
  }, [usersList]);

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filter === "pro") return u.isPro;
      if (filter === "free") return !u.isPro;
      return true;
    });
  }, [usersList, searchQuery, filter]);

  // If not admin or not logged in
  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#121214] border border-red-500/20 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
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
              className="w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
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
              className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-400 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5" />
              Owner Portal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white mt-2 tracking-tight">
            VoiceScribe Platform Analytics
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
            Real-time tracking of site traffic, paying customers, and revenue generated via Paystack.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-orange-500/20 shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Total Revenue Made
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {stats.payingUsersCount} successful Paystack payments
          </p>
        </motion.div>

        {/* Registered Visitors / Users */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Total Users / Visitors
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-950 dark:text-white">
              {stats.totalUsers}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium ml-2">
              accounts created
            </span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-400 font-medium mt-2">
            Google, Apple &amp; Email members
          </p>
        </motion.div>

        {/* Total Transcriptions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Transcriptions Run
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-950 dark:text-white">
              {stats.totalTranscriptions}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium ml-2">
              files processed
            </span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-400 font-medium mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ~2.5s avg Whisper speed
          </p>
        </motion.div>

        {/* Conversion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Pro Conversion Rate
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-950 dark:text-white">
              {stats.conversionRate}%
            </span>
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mt-2">
            Free users upgrading to Unlimited
          </p>
        </motion.div>
      </div>

      {/* User Directory Table Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              Users &amp; Customers Directory
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
              List of people who have accessed VoiceScribe and their subscription state.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 w-48 sm:w-60 font-medium"
              />
            </div>

            <div className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-1 border border-gray-200 dark:border-white/10">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                All ({usersList.length})
              </button>
              <button
                onClick={() => setFilter("pro")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === "pro"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                Paid Pro ({usersList.filter((u) => u.isPro).length})
              </button>
              <button
                onClick={() => setFilter("free")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === "free"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                Free ({usersList.filter((u) => !u.isPro).length})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Plan Status</th>
                <th className="py-3 px-4">Transcriptions</th>
                <th className="py-3 px-4">Revenue Contributed</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">
                    {loading ? "Loading analytics..." : "No matching users found."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isOwner = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-400 border border-amber-500/30">
                            <Crown className="w-3 h-3" /> Admin / VIP
                          </span>
                        ) : u.isPro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-900 dark:text-emerald-400 border border-emerald-500/30">
                            <Sparkles className="w-3 h-3" /> Pro Member
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-300">
                            Free Tier ({u.usageCount || 0}/2 used)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-950 dark:text-white">
                        {isOwner ? "Unlimited" : `${u.usageCount || 0} files`}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-950 dark:text-white">
                        {isOwner ? "—" : u.isPro ? "₦1,000 NGN" : "₦0"}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}
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
