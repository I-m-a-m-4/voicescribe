"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap, Sparkles, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: any) => {
        openIframe: () => void;
      };
    };
  }
}

export default function PricingModal() {
  const {
    isPricingModalOpen,
    setIsPricingModalOpen,
    user,
    setIsAuthModalOpen,
    refreshUserData,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isPricingModalOpen) return null;

  const handlePaystackCheckout = () => {
    setError(null);

    // If user is not logged in, prompt sign in first so Pro status is tied to their email
    if (!user) {
      setIsPricingModalOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    if (typeof window === "undefined" || !window.PaystackPop) {
      setError("Payment gateway is initializing. Please try again in a moment.");
      return;
    }

    setLoading(true);

    const publicKey =
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
      "pk_live_30dcb1ca43e502c92a8ce8b7246f1bd6f5ce15c3";

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: user.email || "customer@voicescribe.ai",
      amount: 200000, // ₦2,000 NGN in Kobo
      currency: "NGN",
      ref: `vs_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      metadata: {
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "uid",
            value: user.uid,
          },
          {
            display_name: "Plan",
            variable_name: "plan",
            value: "monthly_pro_2000",
          },
        ],
      },
      callback: async (response: { reference: string }) => {
        try {
          // Verify with server endpoint
          const res = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: response.reference,
              email: user.email,
              uid: user.uid,
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            // Update user in Firestore
            try {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                isPro: true,
                proActivatedAt: new Date().toISOString(),
                paymentReference: response.reference,
              });
            } catch (fsErr) {
              console.warn("Firestore client update error:", fsErr);
            }

            await refreshUserData();
            setSuccess(true);
            setTimeout(() => {
              setIsPricingModalOpen(false);
              setSuccess(false);
            }, 2500);
          } else {
            setError(data.error || "Payment verification failed.");
          }
        } catch (err: any) {
          console.error(err);
          setError("Network error while verifying payment. Please contact support.");
        } finally {
          setLoading(false);
        }
      },
      onClose: () => {
        setLoading(false);
      },
    });

    handler.openIframe();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121214] border border-orange-500/20 shadow-2xl shadow-orange-500/10 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={() => setIsPricingModalOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success State */}
          {success ? (
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Payment Successful!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-2 max-w-xs">
                Unlimited Pro Access has been activated for your account. Enjoy unlimited transcriptions!
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-semibold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade to VoiceScribe Pro
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Transcribe Without Limits
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  You&apos;ve reached your free transcription limit. Unlock permanent, unrestricted access today.
                </p>
              </div>

              {/* Pricing Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 via-transparent to-orange-500/5 border border-orange-500/30 mb-6 relative overflow-hidden">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                      ₦2,000
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 font-medium">
                      NGN / Month
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-600 text-white shadow-sm">
                    Monthly Pro
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span><strong>Unlimited</strong> audio &amp; video transcriptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span>Powered by Groq <strong>Whisper Large-v3-Turbo</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span>Files up to <strong>25 MB</strong> supported</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span>Cancel anytime — no long-term contracts</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="mb-4 p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-center">
                  {error}
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={handlePaystackCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    {user ? "Pay ₦2,000 / month with Paystack" : "Sign In & Upgrade"}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-gray-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Secured by Paystack 256-bit SSL encryption</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
