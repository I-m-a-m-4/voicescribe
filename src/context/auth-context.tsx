"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { auth, db, googleProvider, appleProvider } from "@/lib/firebase";

const ADMIN_EMAIL = "belloimam431@gmail.com";
const FREE_TIER_LIMIT = 2;

interface UserProfile {
  usageCount: number;
  isPro: boolean;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPro: boolean;
  isInfinite: boolean;
  usageCount: number;
  remainingFreeUses: number;
  canTranscribe: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isPricingModalOpen: boolean;
  setIsPricingModalOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  recordTranscriptionSuccess: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Check if current user is the VIP admin
  const isInfinite = (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  // Fetch or initialize Firestore user document
  const fetchUserData = useCallback(async (firebaseUser: User) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      const isBello = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (!userSnap.exists()) {
        const initialData = {
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          usageCount: 0,
          isPro: isBello,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, initialData);
        setUsageCount(0);
        setIsPro(isBello);
      } else {
        const data = userSnap.data() as UserProfile;
        setUsageCount(data.usageCount || 0);
        setIsPro(Boolean(data.isPro || isBello));
      }
    } catch (err) {
      console.error("Error fetching user data from Firestore:", err);
      // Fallback: if user is admin, guarantee infinite
      if (firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsPro(true);
      }
    }
  }, []);

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        // Load guest usage from localStorage
        const guestUsage = parseInt(localStorage.getItem("voicescribe_guest_usage") || "0", 10);
        setUsageCount(guestUsage);
        setIsPro(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  // Calculations for limits
  const remainingFreeUses = (isInfinite || isPro)
    ? 999999
    : Math.max(0, FREE_TIER_LIMIT - usageCount);

  const canTranscribe = isInfinite || isPro || remainingFreeUses > 0;

  // Record usage when a transcription succeeds
  const recordTranscriptionSuccess = async () => {
    if (isInfinite) {
      return; // Never increment or limit admin
    }

    if (user) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          usageCount: increment(1),
          lastUsedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error incrementing usage count:", err);
      }
    } else {
      // Guest usage
      const newGuestUsage = usageCount + 1;
      setUsageCount(newGuestUsage);
      localStorage.setItem("voicescribe_guest_usage", newGuestUsage.toString());
      
      // User request: "AFTER LIEK 1 EGENRATIONG SHOW THE POPUP FPRM THE SSIGNGIGN UP"
      if (newGuestUsage >= 1) {
        setTimeout(() => {
          setIsAuthModalOpen(true);
        }, 1200);
      }
    }
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await fetchUserData(result.user);
      setIsAuthModalOpen(false);
    }
  };

  const signInWithApple = async () => {
    const result = await signInWithPopup(auth, appleProvider);
    if (result.user) {
      await fetchUserData(result.user);
      setIsAuthModalOpen(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await fetchUserData(res.user);
      setIsAuthModalOpen(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await fetchUserData(res.user);
      setIsAuthModalOpen(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsPro(false);
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
        usageCount,
        remainingFreeUses,
        canTranscribe,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isPricingModalOpen,
        setIsPricingModalOpen,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        logout,
        recordTranscriptionSuccess,
        refreshUserData,
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
