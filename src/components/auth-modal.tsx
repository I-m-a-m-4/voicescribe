"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    lastAuthProvider,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveLastProvider =
    lastAuthProvider ||
    (typeof window !== "undefined"
      ? localStorage.getItem("voicescribe_last_auth_provider")
      : null);

  if (!isAuthModalOpen) return null;

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithApple();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Apple");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("An account already exists with this email.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sign in to save your transcripts and unlock free usage
            </p>
          </div>

          {/* Social Sign-In Buttons */}
          <div className="space-y-3 mb-6">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-colors disabled:opacity-50 cursor-pointer ${
                effectiveLastProvider === "google"
                  ? "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/15 text-gray-900 dark:text-white"
                  : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-white"
              } font-medium text-sm`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </div>
              {effectiveLastProvider === "google" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  Last used
                </span>
              )}
            </button>

            {/* Apple */}
            <button
              onClick={handleApple}
              disabled={loading}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-colors disabled:opacity-50 cursor-pointer ${
                effectiveLastProvider === "apple"
                  ? "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/15 text-gray-900 dark:text-white"
                  : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-white"
              } font-medium text-sm`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.42-6.42-9.78-11.41-20.9-14.97-33.34-3.55-12.44-5.33-24.18-5.33-35.21 0-14.28 3.52-26.23 10.56-35.85 7.04-9.62 16.03-14.54 26.97-14.75 5.43 0 11.13 1.41 17.11 4.23 5.98 2.82 10.02 4.29 12.13 4.41 1.74 0 6.09-1.59 13.06-4.76 6.96-3.17 12.82-4.58 17.57-4.23 13.04.87 23.47 5.75 31.29 14.65-11.74 7.06-17.49 16.94-17.27 29.65.22 10 4.13 18.34 11.74 25.03 7.6 6.68 16.73 10.53 27.38 11.55-2.17 6.74-4.89 13.68-8.15 20.82zM119.22 33.56c0-7.39 2.61-14.34 7.82-20.86 5.22-6.52 11.74-10.76 19.56-12.7-1.3 6.96-4.02 13.48-8.15 19.56-4.13 6.09-9.56 10.65-16.3 13.69-.76-.01-1.74-.23-2.93-.69z" />
                </svg>
                <span>Continue with Apple</span>
              </div>
              {effectiveLastProvider === "apple" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  Last used
                </span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-full border-t border-gray-200 dark:border-white/10" />
            <span className="absolute px-3 bg-white dark:bg-[#121214] text-xs text-gray-400 flex items-center gap-1.5">
              <span>Or with email</span>
              {effectiveLastProvider === "email" && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  Last used
                </span>
              )}
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition-all shadow-md shadow-orange-600/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Toggle between Sign In / Sign Up */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  className="text-orange-500 hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  className="text-orange-500 hover:underline font-medium"
                >
                  Sign up free
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
