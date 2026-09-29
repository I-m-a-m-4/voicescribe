import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Check edge platform headers (Vercel, Cloudflare, etc.)
    const vercelCountry = req.headers.get("x-vercel-ip-country");
    const cfCountry = req.headers.get("cf-ipcountry");
    const genericCountry = req.headers.get("x-country-code");

    let countryCode = (vercelCountry || cfCountry || genericCountry || "").toUpperCase();

    // 2. If running locally or on localhost (no edge headers)
    if (!countryCode || countryCode === "UNKNOWN") {
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip");

      // Only attempt IP lookup if not localhost / internal loopback
      if (clientIp && !clientIp.startsWith("127.") && clientIp !== "::1" && !clientIp.startsWith("192.168.")) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const geoRes = await fetch(`https://ipwho.is/${clientIp}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData?.country_code) {
              countryCode = geoData.country_code.toUpperCase();
            }
          }
        } catch {
          // Ignore external lookup failure and fall back
        }
      }
    }

    const finalCountry = countryCode || "NG";
    const isNigeria = finalCountry === "NG";

    return NextResponse.json({
      country: finalCountry,
      isNigeria,
      currency: isNigeria ? "NGN" : "USD",
      currencySymbol: isNigeria ? "₦" : "$",
    });
  } catch (error: any) {
    return NextResponse.json({
      country: "NG",
      isNigeria: true,
      currency: "NGN",
      currencySymbol: "₦",
    });
  }
}
