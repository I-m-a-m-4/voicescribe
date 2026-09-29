"use client";

import { useState, useEffect } from "react";

export type CurrencyType = "NGN" | "USD";

export interface LocationCurrencyInfo {
  currency: CurrencyType;
  currencySymbol: string;
  isNigeria: boolean;
  country: string;
  setCurrency: (c: CurrencyType) => void;
  loading: boolean;
}

export function useLocationCurrency(): LocationCurrencyInfo {
  const [currency, setCurrencyState] = useState<CurrencyType>("NGN");
  const [isNigeria, setIsNigeria] = useState<boolean>(true);
  const [country, setCountry] = useState<string>("NG");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Initial quick timezone heuristic to prevent flash
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const isLocalNigeria = tz.toLowerCase().includes("lagos");
      const savedCurrency = localStorage.getItem("voicescribe_user_currency") as CurrencyType | null;

      if (savedCurrency === "NGN" || savedCurrency === "USD") {
        setCurrencyState(savedCurrency);
        setIsNigeria(savedCurrency === "NGN");
      } else if (!isLocalNigeria) {
        // Outside Nigeria defaults to USD
        setCurrencyState("USD");
        setIsNigeria(false);
      } else {
        setCurrencyState("NGN");
        setIsNigeria(true);
      }
    } catch {}

    // 2. Fetch authoritative location from server-side Geo API
    const detectLocation = async () => {
      try {
        const isTauri =
          (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined) ||
          (typeof window !== "undefined" && window.location.protocol === "tauri:");
        const geoUrl = isTauri
          ? "https://usevoicescribe.vercel.app/api/geo"
          : "/api/geo";

        const res = await fetch(geoUrl);
        if (res.ok) {
          const data = await res.json();
          const detectedIsNigeria = Boolean(data.isNigeria);
          setCountry(data.country || (detectedIsNigeria ? "NG" : "US"));
          setIsNigeria(detectedIsNigeria);

          // Respect user manual override if previously saved in localStorage
          const saved = localStorage.getItem("voicescribe_user_currency");
          if (!saved) {
            setCurrencyState(detectedIsNigeria ? "NGN" : "USD");
          }
        }
      } catch (e) {
        console.warn("Location detection note:", e);
      } finally {
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  const setCurrency = (newCurrency: CurrencyType) => {
    setCurrencyState(newCurrency);
    setIsNigeria(newCurrency === "NGN");
    try {
      localStorage.setItem("voicescribe_user_currency", newCurrency);
    } catch {}
  };

  const currencySymbol = currency === "NGN" ? "₦" : "$";

  return {
    currency,
    currencySymbol,
    isNigeria,
    country,
    setCurrency,
    loading,
  };
}
