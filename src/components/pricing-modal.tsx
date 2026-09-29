"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap, Sparkles, Shield, Loader2, Clock, CheckCircle2, Globe } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLocationCurrency } from "@/hooks/use-location-currency";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: any) => {
        openIframe: () => void;
      };
    };
    FlutterwaveCheckout?: (options: any) => void;
  }
}

type SelectedPlan = "creator" | "business";

export default function PricingModal() {
  const {
    isPricingModalOpen,
    setIsPricingModalOpen,
    pricingModalNotice,
    setPricingModalNotice,
    user,
    setIsAuthModalOpen,
    refreshUserData,
    activateProPlan,
  } = useAuth();

  const { currency, currencySymbol, setCurrency, isNigeria } = useLocationCurrency();

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>("business");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If opened with a notice about long video (e.g. > 20 mins), auto-select Business
    if (pricingModalNotice && (pricingModalNotice.includes("90") || pricingModalNotice.includes("long"))) {
      setSelectedPlan("business");
    }
  }, [pricingModalNotice]);

  if (!isPricingModalOpen) return null;

  const planDetails = {
    creator: {
      name: "Creator",
      priceNGN: 5000,
      priceUSD: 5,
      kobo: 500000,
      usdCents: 500,
      badge: "Voice & Shorts",
      maxMinutes: "20 minutes",
      features: [
        "Transcribe files up to 20 minutes long",
        "Unlimited audio & video transcriptions",
        "Auto 3-minute chunking & audio compression",
        "Powered by VoiceScribe High-Precision AI",
        "English & 98+ Languages translation",
        "One-click copy & text export",
      ],
    },
    business: {
      name: "Business & Long-Form",
      priceNGN: 12000,
      priceUSD: 12,
      kobo: 1200000,
      usdCents: 1200,
      badge: "Most Popular",
      maxMinutes: "90 minutes",
      features: [
        "Transcribe long files up to 90 minutes long (57+ min videos)",
        "Unlimited audio & video transcriptions",
        "Lightning-fast parallel segment chunking",
        "High-definition video-to-audio extraction",
        "Full WhatsApp Web Extension integration",
        "Priority AI processing & queue skip",
      ],
    },
  };

  const currentPlan = planDetails[selectedPlan];
  const displayPrice = currency === "NGN"
    ? `₦${currentPlan.priceNGN.toLocaleString()}`
    : `$${currentPlan.priceUSD}`;

  // Handle Flutterwave Checkout for USD / International
  const handleFlutterwaveCheckout = (flwPublicKey: string) => {
    if (typeof window === "undefined" || !window.FlutterwaveCheckout) {
      setError("Flutterwave gateway is loading. Please try again in a moment.");
      setLoading(false);
      return;
    }

    const txRef = `vs_flw_${selectedPlan}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    window.FlutterwaveCheckout({
      public_key: flwPublicKey,
      tx_ref: txRef,
      amount: currentPlan.priceUSD,
      currency: "USD",
      payment_options: "card,banktransfer,mobilemoney",
      customer: {
        email: user?.email || "customer@voicescribe.ai",
        name: user?.displayName || "VoiceScribe User",
      },
      customizations: {
        title: `VoiceScribe ${currentPlan.name} Plan`,
        description: `Upgrade to VoiceScribe ${currentPlan.name} (${currentPlan.maxMinutes})`,
        logo: "https://usevoicescribe.vercel.app/icon.png",
      },
      callback: async (response: any) => {
        const reference = response.transaction_id || response.tx_ref || txRef;

        // 1. Instant synchronous state upgrade
        await activateProPlan(selectedPlan, String(reference));
        setSuccess(true);
        setLoading(false);

        // 2. Background verification
        try {
          const isTauri =
            (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined) ||
            window.location.protocol === "tauri:";
          const verifyUrl = isTauri
            ? "https://usevoicescribe.vercel.app/api/payment/verify"
            : "/api/payment/verify";

          const res = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: String(reference),
              email: user?.email,
              uid: user?.uid,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            const activePlan = data.planTier || selectedPlan;
            await activateProPlan(activePlan, String(reference));
            await refreshUserData();
          }
        } catch (e) {
          console.warn("Verification note:", e);
        } finally {
          setTimeout(() => {
            setIsPricingModalOpen(false);
            setPricingModalNotice(null);
            setSuccess(false);
          }, 2000);
        }
      },
      onclose: () => {
        setLoading(false);
      },
    });
  };

  // Handle Paystack Checkout for NGN / Direct
  const handlePaystackCheckout = (paystackPublicKey: string) => {
    if (typeof window === "undefined" || !window.PaystackPop) {
      setError("Payment gateway is initializing. Please try again in a moment.");
      setLoading(false);
      return;
    }

    const isUsd = currency === "USD";
    const amountToCharge = isUsd ? currentPlan.usdCents : currentPlan.kobo;
    const currencyToCharge = isUsd ? "USD" : "NGN";

    const handler = window.PaystackPop.setup({
      key: paystackPublicKey,
      email: user?.email || "customer@voicescribe.ai",
      amount: amountToCharge,
      currency: currencyToCharge,
      ref: `vs_${selectedPlan}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      metadata: {
        plan: selectedPlan,
        currency: currencyToCharge,
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "uid",
            value: user?.uid,
          },
          {
            display_name: "Plan Tier",
            variable_name: "plan",
            value: selectedPlan,
          },
          {
            display_name: "Max Minutes",
            variable_name: "max_minutes",
            value: currentPlan.maxMinutes,
          },
        ],
      },
      callback: async (response: { reference: string }) => {
        // 1. Immediately upgrade client state & UI badge with zero latency
        await activateProPlan(selectedPlan, response.reference);
        setSuccess(true);
        setLoading(false);

        try {
          // 2. Verify with server endpoint and synchronize server records
          const isTauri =
            (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined) ||
            window.location.protocol === "tauri:";
          const verifyUrl = isTauri
            ? "https://usevoicescribe.vercel.app/api/payment/verify"
            : "/api/payment/verify";

          const res = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: response.reference,
              email: user?.email,
              uid: user?.uid,
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            const activePlan = data.planTier || selectedPlan;
            await activateProPlan(activePlan, response.reference);
            await refreshUserData();
          }
        } catch (err: any) {
          console.warn("Background verification network note:", err);
        } finally {
          setTimeout(() => {
            setIsPricingModalOpen(false);
            setPricingModalNotice(null);
            setSuccess(false);
          }, 2000);
        }
      },
      onClose: () => {
        setLoading(false);
      },
    });

    handler.openIframe();
  };

  // Main Checkout Trigger
  const handleCheckout = () => {
    setError(null);

    // If user is not logged in, prompt sign in first
    if (!user) {
      setIsPricingModalOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    setLoading(true);

    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    const flutterwavePublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

    // For USD currency: Prefer Flutterwave if configured, otherwise Paystack
    if (currency === "USD") {
      if (flutterwavePublicKey) {
        handleFlutterwaveCheckout(flutterwavePublicKey);
        return;
      }
      if (paystackPublicKey) {
        handlePaystackCheckout(paystackPublicKey);
        return;
      }
    } else {
      // For NGN currency: Use Paystack
      if (paystackPublicKey) {
        handlePaystackCheckout(paystackPublicKey);
        return;
      }
      if (flutterwavePublicKey) {
        handleFlutterwaveCheckout(flutterwavePublicKey);
        return;
      }
    }

    // If no keys configured in environment
    setError("Payment gateway is being configured. Please try again shortly.");
    setLoading(false);
  };

  const closeModal = () => {
    if (loading) return;
    setIsPricingModalOpen(false);
    setPricingModalNotice(null);
    setError(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#121214] border border-dashed border-gray-300 dark:border-white/15 rounded-xl shadow-2xl p-6 sm:p-8 z-10 max-h-[92vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {success ? (
            <div className="py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-emerald-500/30"
              >
                <Check className="w-8 h-8" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 Welcome to VoiceScribe {currentPlan.name}!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-6">
                Your account has been instantly upgraded to the {currentPlan.name} plan (up to {currentPlan.maxMinutes}).
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-xs font-bold border border-dashed border-emerald-500/30">
                <Sparkles className="w-4 h-4" />
                Active Pro Tier: {currentPlan.name} ({currentPlan.maxMinutes})
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/10 border border-dashed border-orange-500/30 text-orange-500 text-xs font-semibold uppercase tracking-wider mb-2.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  VoiceScribe Subscription Plans
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                  Choose Your Transcription Plan
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                  Powered by VoiceScribe Neural Speech Engine with automatic audio chunking &amp; zero file-size bottlenecks.
                </p>

                {/* Country & Currency Switcher */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mr-1">
                    <Globe className="w-3 h-3" /> Currency:
                  </span>
                  <button
                    onClick={() => setCurrency("NGN")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      currency === "NGN"
                        ? "bg-orange-600 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    🇳🇬 NGN (₦)
                  </button>
                  <button
                    onClick={() => setCurrency("USD")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      currency === "USD"
                        ? "bg-orange-600 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    🌐 USD ($)
                  </button>
                </div>
              </div>

              {/* Dynamic Notice if user exceeded file length or usage */}
              {pricingModalNotice && (
                <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-dashed border-amber-500/35 flex items-start gap-3 text-left">
                  <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-semibold">{pricingModalNotice}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">Select a plan below to immediately process this file.</p>
                  </div>
                </div>
              )}

              {/* Tier Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
                {/* Creator Tier */}
                <div
                  onClick={() => setSelectedPlan("creator")}
                  className={`relative p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPlan === "creator"
                      ? "border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/10"
                      : "border-gray-300 dark:border-white/15 hover:border-orange-500/40 bg-gray-50 dark:bg-white/[0.02]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                        {planDetails.creator.badge}
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPlan === "creator" ? "border-orange-500 bg-orange-500 text-white" : "border-gray-300 dark:border-white/20"}`}>
                        {selectedPlan === "creator" && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Creator Plan
                    </h3>
                    <div className="mt-2 mb-3">
                      <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
                        {currency === "NGN" ? "₦5,000" : "$5"}
                      </span>
                      <span className="text-xs text-gray-500 ml-1 font-medium">/ month</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-dashed border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      Up to 20 Mins / File
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Perfect for voice notes, podcasts, YouTube shorts, and brief interviews.
                  </p>
                </div>

                {/* Business Tier */}
                <div
                  onClick={() => setSelectedPlan("business")}
                  className={`relative p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPlan === "business"
                      ? "border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/10"
                      : "border-gray-300 dark:border-white/15 hover:border-orange-500/40 bg-gray-50 dark:bg-white/[0.02]"
                  }`}
                >
                  <span className="absolute -top-2.5 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-600 text-white shadow-sm">
                    {planDetails.business.badge}
                  </span>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                        Long-Form &amp; Pro
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPlan === "business" ? "border-orange-500 bg-orange-500 text-white" : "border-gray-300 dark:border-white/20"}`}>
                        {selectedPlan === "business" && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Business Plan
                    </h3>
                    <div className="mt-2 mb-3">
                      <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
                        {currency === "NGN" ? "₦12,000" : "$12"}
                      </span>
                      <span className="text-xs text-gray-500 ml-1 font-medium">/ month</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-dashed border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      Up to 90 Mins / File
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Transcribe 57-min videos, 1-hour lectures, webinars, and long meetings without limits.
                  </p>
                </div>
              </div>

              {/* Selected Plan Feature List */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-dashed border-gray-300 dark:border-white/15 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" />
                  What&apos;s Included in {currentPlan.name}:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  {currentPlan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="mb-4 p-3 text-xs rounded-lg bg-red-500/10 border border-dashed border-red-500/30 text-red-500 text-center font-medium">
                  {error}
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting to Payment Gateway...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    {user
                      ? `Subscribe to ${currentPlan.name} (${displayPrice} / mo)`
                      : "Sign In & Upgrade"}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-gray-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Secured by 256-bit bank-grade SSL encryption. Cancel anytime.</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
