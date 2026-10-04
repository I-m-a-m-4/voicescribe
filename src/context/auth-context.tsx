"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, increment } from "firebase/firestore";
import { auth, db, googleProvider, appleProvider } from "@/lib/firebase";

export const isTauriDesktop = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    (window as any).__TAURI_INTERNALS__ !== undefined ||
    (window as any).__TAURI__ !== undefined ||
    window.location.protocol === "tauri:" ||
    window.location.origin.includes("tauri.localhost")
  );
};

const ADMIN_EMAIL = "belloimam431@gmail.com";
const FREE_TIER_LIMIT = 2;

export type PlanTier = "free" | "creator" | "business";

export interface VoiceScribeUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isDesktopUser?: boolean;
  authProvider?: string;
  lastLoginAt?: string;
  visitCount?: number;
}

export type AuthUser = User | VoiceScribeUser;

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
  user: AuthUser | null;
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
  desktopAuthSession: { sessionId: string; url: string; code: string } | null;
  cancelDesktopAuth: () => void;
  signInWithDesktopToken: (token: string) => Promise<void>;
  isDesktop: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [planTier, setPlanTier] = useState<PlanTier>("free");
  const [usageCount, setUsageCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingModalNotice, setPricingModalNotice] = useState<string | null>(null);
  const [lastAuthProvider, setLastAuthProvider] = useState<string | null>(null);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionItem[]>([]);
  const [desktopAuthSession, setDesktopAuthSession] = useState<{
    sessionId: string;
    url: string;
    code: string;
  } | null>(null);
  const [desktopAuthUnsub, setDesktopAuthUnsub] = useState<(() => void) | null>(null);

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
  const fetchUserData = useCallback(async (firebaseUser: AuthUser) => {
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
    // 1. Immediately restore saved desktop user session on app launch
    const savedDesktopUser = typeof window !== "undefined" ? localStorage.getItem("voicescribe_desktop_auth_user") : null;
    if (savedDesktopUser) {
      try {
        const parsed = JSON.parse(savedDesktopUser);
        if (parsed && parsed.uid) {
          setUser(parsed);
          const isBello = parsed.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          setIsPro(Boolean(parsed.isPro || isBello));
          setPlanTier(isBello ? "business" : (parsed.planTier || "free"));
          setUsageCount(parsed.usageCount || 0);
          loadHistory(parsed.uid);
          fetchUserData(parsed);
        }
      } catch (err) {
        console.warn("Could not parse saved desktop user", err);
      }
    }

    // 2. Load last auth provider
    const savedProvider = typeof window !== "undefined" ? localStorage.getItem("voicescribe_last_auth_provider") : null;
    if (savedProvider) setLastAuthProvider(savedProvider);

    // 3. Handle Auth Redirect result if popup was blocked
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

    // 4. Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        loadHistory(firebaseUser.uid);
        await fetchUserData(firebaseUser);
        setIsAuthModalOpen(false);
      } else {
        // If Firebase Auth returns null (standard in desktop Tauri WebView), check for active desktop session
        const activeDesktop = typeof window !== "undefined" ? localStorage.getItem("voicescribe_desktop_auth_user") : null;
        if (activeDesktop) {
          try {
            const parsed = JSON.parse(activeDesktop);
            if (parsed && parsed.uid) {
              setUser(parsed);
              loadHistory(parsed.uid);
              setLoading(false);
              return;
            }
          } catch {}
        }

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

  const cancelDesktopAuth = useCallback(() => {
    if (desktopAuthUnsub) {
      desktopAuthUnsub();
      setDesktopAuthUnsub(null);
    }
    setDesktopAuthSession(null);
  }, [desktopAuthUnsub]);

  const signInWithDesktopToken = async (tokenInput: string) => {
    const trimmed = tokenInput.trim();
    if (!trimmed) return;

    try {
      // 1. Try decoding as base64 JSON payload from desktop-auth
      try {
        const jsonString = decodeURIComponent(escape(atob(trimmed)));
        const data = JSON.parse(jsonString);
        if (data && (data.uid || data.email)) {
          const isBello = data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          const authenticatedUser: VoiceScribeUser = {
            uid: data.uid || `user_${Date.now()}`,
            email: data.email || null,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            isDesktopUser: true,
            authProvider: data.authProvider || "google",
          };

          localStorage.setItem("voicescribe_desktop_auth_user", JSON.stringify(authenticatedUser));
          localStorage.setItem("voicescribe_last_auth_provider", "google");
          setLastAuthProvider("google");
          setUser(authenticatedUser);

          const userPro = Boolean(data.isPro || isBello);
          const resolvedTier: PlanTier = isBello
            ? "business"
            : (data.planTier || (userPro ? "creator" : "free"));
          setIsPro(userPro);
          setPlanTier(resolvedTier);
          setUsageCount(data.usageCount || 0);

          loadHistory(authenticatedUser.uid);
          cancelDesktopAuth();
          setIsAuthModalOpen(false);
          return;
        }
      } catch {
        // Not a base64 payload, proceed to standard Google credential check
      }

      // 2. Standard Google Auth Credential
      const googleCredential = GoogleAuthProvider.credential(trimmed);
      const res = await signInWithCredential(auth, googleCredential);
      if (res.user) {
        localStorage.setItem("voicescribe_last_auth_provider", "google");
        setLastAuthProvider("google");
        await fetchUserData(res.user);
        loadHistory(res.user.uid);
        cancelDesktopAuth();
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      console.error("Manual token sign-in error:", err);
      throw new Error(err.message || "Invalid authentication token.");
    }
  };

  const startDesktopGoogleAuth = async () => {
    cancelDesktopAuth();

    // 1. Generate unique session ID and 6-digit code
    const sessionId = "dauth_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const authUrl = `https://usevoicescribe.vercel.app/desktop-auth?session=${sessionId}&code=${code}`;

    // 2. Register handshake in Firestore
    try {
      await setDoc(doc(db, "desktop_auth", sessionId), {
        status: "pending",
        code,
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      await setDoc(doc(db, "desktop_auth_codes", code), {
        sessionId,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn("Could not write desktop auth session to Firestore", err);
    }

    setDesktopAuthSession({ sessionId, url: authUrl, code });

    // 3. Try to open the URL in the system browser
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(authUrl);
    } catch (e) {
      console.warn("Could not automatically launch browser with tauri shell plugin, falling back to window.open", e);
      try {
        window.open(authUrl, "_blank");
      } catch (innerE) {
        console.warn("Could not automatically launch browser", innerE);
      }
    }

    // 4. Listen for real-time completion
    const sessionRef = doc(db, "desktop_auth", sessionId);
    const unsub = onSnapshot(sessionRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === "completed" && (data.uid || data.email)) {
          const isBello = data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

          const authenticatedUser: VoiceScribeUser = {
            uid: data.uid || `user_${Date.now()}`,
            email: data.email || null,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            isDesktopUser: true,
            authProvider: data.authProvider || "google",
          };

          // Immediately persist session in localStorage so it survives app restarts
          localStorage.setItem("voicescribe_desktop_auth_user", JSON.stringify(authenticatedUser));
          localStorage.setItem("voicescribe_last_auth_provider", "google");
          setLastAuthProvider("google");

          // Update context state
          setUser(authenticatedUser);

          const userPro = Boolean(data.isPro || isBello);
          const resolvedTier: PlanTier = isBello
            ? "business"
            : (data.planTier || (userPro ? "creator" : "free"));

          setIsPro(userPro);
          setPlanTier(resolvedTier);
          setUsageCount(data.usageCount || 0);

          loadHistory(authenticatedUser.uid);
          setIsAuthModalOpen(false);

          // Try native WebView credential exchange as best-effort bonus
          if (data.idToken) {
            try {
              const googleCredential = GoogleAuthProvider.credential(
                data.idToken,
                data.accessToken || undefined
              );
              await signInWithCredential(auth, googleCredential);
            } catch (credErr) {
              console.log("Native WebView credential exchange notice (desktop session active):", credErr);
            }
          }

          unsub();
          try {
            await deleteDoc(doc(db, "desktop_auth", sessionId));
            await deleteDoc(doc(db, "desktop_auth_codes", code));
          } catch {}
          setDesktopAuthSession(null);
          setDesktopAuthUnsub(null);
        }
      }
    });

    setDesktopAuthUnsub(() => unsub);
  };

  const signInWithGoogle = async () => {
    // If running in Tauri desktop application, use browser handshake to prevent WebView popup failure
    if (isTauriDesktop()) {
      await startDesktopGoogleAuth();
      return;
    }

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
    cancelDesktopAuth();
    if (typeof window !== "undefined") {
      localStorage.removeItem("voicescribe_desktop_auth_user");
    }
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setIsPro(false);
    setPlanTier("free");
    loadHistory();
    const guestUsage = typeof window !== "undefined" ? parseInt(localStorage.getItem("voicescribe_guest_usage") || "0", 10) : 0;
    setUsageCount(guestUsage);
  };

  // Track Unique People (Visitors), Frequency, and Retention Cohorts in Firestore
  useEffect(() => {
    if (typeof window === "undefined") return;

    const trackUniqueVisitor = async () => {
      try {
        const now = new Date();
        const todayIso = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
        let visitorId = localStorage.getItem("voicescribe_visitor_id");
        let isFirstVisit = false;

        if (!visitorId) {
          visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem("voicescribe_visitor_id", visitorId);
          localStorage.setItem("voicescribe_first_seen", now.toISOString());
          isFirstVisit = true;
        }

        const firstSeen = localStorage.getItem("voicescribe_first_seen") || now.toISOString();
        const firstSeenDate = firstSeen.split("T")[0];

        // Track session frequency per browser / app launch
        const hasSession = sessionStorage.getItem("voicescribe_session_logged");
        let visitCount = parseInt(localStorage.getItem("voicescribe_visit_count") || "1", 10);
        if (!hasSession) {
          sessionStorage.setItem("voicescribe_session_logged", "true");
          if (!isFirstVisit) {
            visitCount += 1;
            localStorage.setItem("voicescribe_visit_count", visitCount.toString());
          }
        }

        const platform = isTauriDesktop() ? "desktop_windows" : "web";
        const visitorDocRef = doc(db, "visitors", visitorId);

        await setDoc(
          visitorDocRef,
          {
            visitorId,
            firstSeenAt: firstSeen,
            firstSeenDate,
            lastSeenAt: now.toISOString(),
            lastSeenDate: todayIso,
            visitCount,
            isReturning: visitCount > 1,
            isRegistered: Boolean(user),
            userId: user?.uid || null,
            email: user?.email || null,
            displayName: user?.displayName || null,
            authProvider: user?.email ? (lastAuthProvider || (user as any).authProvider || "google") : "guest",
            platform,
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        // If registered user, update their retention and activity in users collection
        if (user?.uid) {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(
            userDocRef,
            {
              lastSeenAt: now.toISOString(),
              lastSeenDate: todayIso,
              visitCount: increment(1),
              platform,
              visitorId,
            },
            { merge: true }
          );
        }
      } catch (err) {
        console.warn("Visitor analytics tracking notice:", err);
      }
    };

    // Run visitor tracking once mounted
    trackUniqueVisitor();
  }, [user, lastAuthProvider]);

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
        desktopAuthSession,
        cancelDesktopAuth,
        signInWithDesktopToken,
        isDesktop: isTauriDesktop(),
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
