"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Laptop,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

function DesktopAuthContent() {
  const searchParams = useSearchParams();
  const initialSession = searchParams.get("session") || "";
  const initialCode = searchParams.get("code") || "";

  const [session, setSession] = useState(initialSession);
  const [code, setCode] = useState(initialCode);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportedToken, setExportedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Resolve session if user manually entered a 6-digit code
  const resolveSessionFromCode = async (userCode: string): Promise<string | null> => {
    try {
      const codeRef = doc(db, "desktop_auth_codes", userCode.trim());
      const codeSnap = await getDoc(codeRef);
      if (codeSnap.exists()) {
        const data = codeSnap.data();
        return data.sessionId || null;
      }
      return null;
    } catch (err) {
      console.warn("Could not resolve code", err);
      return null;
    }
  };

  const handleAuthorizeWithGoogle = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    let activeSession = session.trim();

    // If session is empty but code is given, resolve it
    if (!activeSession && code.trim()) {
      const resolved = await resolveSessionFromCode(code.trim());
      if (resolved) {
        activeSession = resolved;
        setSession(resolved);
      } else {
        setErrorMessage("Invalid or expired 6-digit code. Please check your desktop app.");
        setSubmitting(false);
        return;
      }
    }

    if (!activeSession) {
      setErrorMessage("No desktop session identified. Please enter the 6-digit code from your desktop app.");
      setSubmitting(false);
      return;
    }

    try {
      // Execute standard web popup sign-in
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken;
      const accessToken = credential?.accessToken;

      if (!idToken) {
        throw new Error("Could not retrieve Google authentication credentials. Please try again.");
      }

      setExportedToken(idToken);

      // Write completion to Firestore so the desktop app's listener immediately catches it
      const sessionRef = doc(db, "desktop_auth", activeSession);
      await updateDoc(sessionRef, {
        status: "completed",
        idToken: idToken,
        accessToken: accessToken || null,
        email: result.user.email || "",
        displayName: result.user.displayName || "",
        photoURL: result.user.photoURL || "",
        completedAt: Date.now(),
      });

      setStatus("success");
    } catch (err: any) {
      console.error("Desktop auth failed:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMessage("Sign-in popup was closed before completion. Please try again.");
      } else {
        setErrorMessage(err.message || "Failed to authorize desktop app.");
      }
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (!exportedToken) return;
    navigator.clipboard.writeText(exportedToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 selection:bg-orange-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-orange-600/20 via-amber-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-orange-500/40 shadow-lg shadow-orange-500/10">
            <Image src="/icon.svg" alt="VoiceScribe Logo" fill className="object-cover" priority />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">VoiceScribe</span>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl bg-[#121215] border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
        >
          {status === "success" ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Desktop App Connected!
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  Your desktop application has received your credentials and is now signed in.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure Handshake Completed</span>
                </div>
                <p className="text-xs text-gray-400">
                  You can now return to the VoiceScribe Desktop window. This browser tab can be safely closed.
                </p>
              </div>

              {/* Fallback Token Copy */}
              {exportedToken && (
                <div className="pt-2 text-left">
                  <p className="text-[11px] text-gray-500 mb-1.5 font-medium">
                    If your desktop window did not update automatically:
                  </p>
                  <button
                    onClick={copyTokenToClipboard}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Auth Token Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-gray-400" />
                        <span>Copy Auth Token to Paste in Desktop</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/"
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  Return to VoiceScribe Web <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-3">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Desktop Authorization</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Sign in to VoiceScribe Desktop
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Authenticate securely with Google to unlock full access on your desktop application.
                </p>
              </div>

              {/* Code or Session Info */}
              {code ? (
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-dashed border-orange-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-gray-300 font-medium">Device Pairing Code:</span>
                  </div>
                  <span className="font-mono text-base font-bold tracking-widest text-orange-400">
                    {code}
                  </span>
                </div>
              ) : !session ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">
                    Enter the 6-Digit Code from Desktop App:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 849201"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              ) : null}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Current user context notice if already logged in on web */}
              {currentUser && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <Image
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold">
                      {currentUser.email?.[0].toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser.displayName || "Signed in"}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{currentUser.email}</p>
                  </div>
                </div>
              )}

              {/* Google Button */}
              <button
                onClick={handleAuthorizeWithGoogle}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting with Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    <span>Authorize Desktop with Google</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-gray-500">
                  This connects your VoiceScribe Pro tier and usage limits with the desktop app.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function DesktopAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-400">Loading VoiceScribe Authorization...</span>
          </div>
        </div>
      }
    >
      <DesktopAuthContent />
    </Suspense>
  );
}
