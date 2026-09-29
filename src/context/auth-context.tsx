"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { auth, db, googleProvider, appleProvider } from "@/lib/firebase";

const ADMIN_EMAIL = "belloimam431@gmail.com";
const FREE_TIER_LIMIT = 2;

export type PlanTier = "free" | "creator" | "business";

export interface TranscriptionItem {
  id: string;
  fileName: string;
  fileSize: string;
  text: string;
  createdAt: string;
  wordCount: number;
}

interface UserProfile {
  usageCount: number;
  isPro: boolean;
  planTier?: PlanTier;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPro: boolean;
  isInfinite: boolean;
  planTier: PlanTier;
  maxDurationMinutes: number;
  usageCount: number;
  remainingFreeUses: number;
  canTranscribe: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isPricingModalOpen: boolean;
  setIsPricingModalOpen: (open: boolean) => void;
  pricingModalNotice: string | null;
  setPricingModalNotice: (notice: string | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  recordTranscriptionSuccess: (transcriptionData?: { fileName: string; fileSize: string; text: string }) => Promise<void>;
  refreshUserData: () => Promise<void>;
  activateProPlan: (plan: PlanTier, ref?: string) => Promise<void>;
  lastAuthProvider: string | null;
  transcriptionHistory: TranscriptionItem[];
  deleteTranscriptionItem: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [planTier, setPlanTier] = useState<PlanTier>("free");
  const [usageCount, setUsageCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingModalNotice, setPricingModalNotice] = useState<string | null>(null);
  const [lastAuthProvider, setLastAuthProvider] = useState<string | null>(null);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionItem[]>([]);

  // Check if current user is the VIP admin
  const isInfinite = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Max duration allowed in minutes based on tier
  const maxDurationMinutes = isInfinite
    ? 180
    : planTier === "business"
      ? 90
      : planTier === "creator"
        ? 20
        : 5;

  // Load history from localStorage
  const loadHistory = useCallback((userId?: string) => {
    const key = userId ? `voicescribe_history_${userId}` : "voicescribe_history_guest";
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setTranscriptionHistory(JSON.parse(saved));
      } else {
        setTranscriptionHistory([]);
      }
    } catch (e) {
      console.warn("Failed to load history from storage", e);
    }
  }, []);

  // Fetch or initialize Firestore user document with graceful offline/local fallback
  const fetchUserData = useCallback(async (firebaseUser: User) => {
    const isBello = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // Guarantee admin infinite status immediately
    if (isBello) {
      setIsPro(true);
      setPlanTier("business");
    }

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const initialData = {
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          usageCount: 0,
          isPro: isBello,
          planTier: isBello ? "business" : "free",
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, initialData);
        setUsageCount(0);
        setIsPro(isBello);
        setPlanTier(isBello ? "business" : "free");
      } else {
        const data = userSnap.data() as UserProfile;
        const userPro = Boolean(data.isPro || isBello);
        const resolvedTier: PlanTier = isBello
          ? "business"
          : (data.planTier || (userPro ? "creator" : "free"));

        setUsageCount(data.usageCount || 0);
        setIsPro(userPro);
        setPlanTier(resolvedTier);
      }
    } catch (err: any) {
      // Graceful fallback for permission-denied or network errors
      console.warn("Firestore notice: using local state fallback for user profile.");
      const localProfileKey = `voicescribe_profile_${firebaseUser.uid}`;
      const saved = localStorage.getItem(localProfileKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const parsedPro = Boolean(parsed.isPro || isBello);
          setUsageCount(parsed.usageCount || 0);
          setIsPro(parsedPro);
          setPlanTier(isBello ? "business" : parsed.planTier || (parsedPro ? "creator" : "free"));
        } catch {
          setIsPro(isBello);
          setPlanTier(isBello ? "business" : "free");
        }
      } else {
        setIsPro(isBello);
        setPlanTier(isBello ? "business" : "free");
      }
    }
  }, []);

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    // Load last auth provider
    const savedProvider = localStorage.getItem("voicescribe_last_auth_provider");
    if (savedProvider) setLastAuthProvider(savedProvider);

    // Handle Auth Redirect result if popup was blocked
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const providerId = (result.providerId && result.providerId.includes("google")) ? "google" : "apple";
          localStorage.setItem("voicescribe_last_auth_provider", providerId);
          setLastAuthProvider(providerId);
          await fetchUserData(result.user);
          loadHistory(result.user.uid);
          setIsAuthModalOpen(false);
        }
      })
      .catch((err) => {
        console.warn("Auth redirect result error:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        loadHistory(firebaseUser.uid);
        await fetchUserData(firebaseUser);
        setIsAuthModalOpen(false);
      } else {
        loadHistory();
        const guestUsage = parseInt(localStorage.getItem("voicescribe_guest_usage") || "0", 10);
        setUsageCount(guestUsage);
        setIsPro(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData, loadHistory]);

  // Calculations for limits
  const remainingFreeUses = (isInfinite || isPro)
    ? 999999
    : Math.max(0, FREE_TIER_LIMIT - usageCount);

  const canTranscribe = isInfinite || isPro || remainingFreeUses > 0;

  // Record usage & save to history when a transcription succeeds
  const recordTranscriptionSuccess = async (transcriptionData?: { fileName: string; fileSize: string; text: string }) => {
    // 1. Save to History for User Dashboard
    if (transcriptionData && transcriptionData.text) {
      const newItem: TranscriptionItem = {
        id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fileName: transcriptionData.fileName || "audio-recording.mp3",
        fileSize: transcriptionData.fileSize || "1.0 MB",
        text: transcriptionData.text,
        createdAt: new Date().toISOString(),
        wordCount: transcriptionData.text.trim().split(/\s+/).length,
      };

      const key = user ? `voicescribe_history_${user.uid}` : "voicescribe_history_guest";
      const updated = [newItem, ...transcriptionHistory];
      setTranscriptionHistory(updated);
      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist transcription history", e);
      }
    }

    if (isInfinite) {
      return; // Never block or increment admin limits
    }

    if (user) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);

      // Save to local cache
      const localProfileKey = `voicescribe_profile_${user.uid}`;
      localStorage.setItem(localProfileKey, JSON.stringify({ usageCount: newCount, isPro }));

      // Try updating Firestore
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          usageCount: increment(1),
          lastUsedAt: new Date().toISOString(),
        });
      } catch (err) {
        // Fallback already saved in localStorage
      }
    } else {
      // Guest usage
      const newGuestUsage = usageCount + 1;
      setUsageCount(newGuestUsage);
      localStorage.setItem("voicescribe_guest_usage", newGuestUsage.toString());

      // Popup after 2nd generation (user requirement: "should be the second time")
      if (newGuestUsage >= 2) {
        setTimeout(() => {
          setIsAuthModalOpen(true);
        }, 1200);
      }
    }
  };

  const deleteTranscriptionItem = (id: string) => {
    const updated = transcriptionHistory.filter((item) => item.id !== id);
    setTranscriptionHistory(updated);
    const key = user ? `voicescribe_history_${user.uid}` : "voicescribe_history_guest";
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to delete history item", e);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        localStorage.setItem("voicescribe_last_auth_provider", "google");
        setLastAuthProvider("google");
        await fetchUserData(result.user);
        loadHistory(result.user.uid);
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request"
      ) {
        // User closed or cancelled popup window, no action needed
        return;
      }
      if (err?.code === "auth/popup-blocked") {
        console.warn("Google auth popup blocked by browser, attempting redirect...");
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  };

  const signInWithApple = async () => {
    try {
      const result = await signInWithPopup(auth, appleProvider);
      if (result.user) {
        localStorage.setItem("voicescribe_last_auth_provider", "apple");
        setLastAuthProvider("apple");
        await fetchUserData(result.user);
        loadHistory(result.user.uid);
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      if (err?.code === "auth/popup-blocked") {
        console.warn("Apple auth popup blocked by browser, attempting redirect...");
        await signInWithRedirect(auth, appleProvider);
        return;
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      localStorage.setItem("voicescribe_last_auth_provider", "email");
      setLastAuthProvider("email");
      await fetchUserData(res.user);
      loadHistory(res.user.uid);
      setIsAuthModalOpen(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      localStorage.setItem("voicescribe_last_auth_provider", "email");
      setLastAuthProvider("email");
      await fetchUserData(res.user);
      loadHistory(res.user.uid);
      setIsAuthModalOpen(false);
    }
  };


  const activateProPlan = async (tier: PlanTier, ref?: string) => {
    // 1. Instant synchronous state upgrade
    setIsPro(true);
    setPlanTier(tier);

    // 2. Synchronous local cache persistence
    if (user) {
      const localProfileKey = `voicescribe_profile_${user.uid}`;
      try {
        localStorage.setItem(
          localProfileKey,
          JSON.stringify({ usageCount: 0, isPro: true, planTier: tier, paymentReference: ref })
        );
      } catch (e) {
        console.warn("Local storage cache warning", e);
      }

      // 3. Firestore persistence
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(
          userRef,
          {
            isPro: true,
            planTier: tier,
            proActivatedAt: new Date().toISOString(),
            paymentReference: ref || "",
            usageCount: 0,
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn("Firestore update error during plan activation:", fsErr);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsPro(false);
    loadHistory();
    const guestUsage = parseInt(localStorage.getItem("voicescribe_guest_usage") || "0", 10);
    setUsageCount(guestUsage);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPro,
        isInfinite,
        planTier,
        maxDurationMinutes,
        usageCount,
        remainingFreeUses,
        canTranscribe,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isPricingModalOpen,
        setIsPricingModalOpen,
        pricingModalNotice,
        setPricingModalNotice,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        logout,
        recordTranscriptionSuccess,
        refreshUserData,
        activateProPlan,
        lastAuthProvider,
        transcriptionHistory,
        deleteTranscriptionItem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
