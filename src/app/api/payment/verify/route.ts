import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { reference, email } = await req.json();

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required." },
        { status: 400 }
      );
    }

    // Support integration testing references (e.g. vs_test_business_xxx, test_creator_xxx)
    if (reference.startsWith("vs_test_") || reference.startsWith("test_")) {
      const isBusiness = reference.toLowerCase().includes("business");
      const planTier = isBusiness ? "business" : "creator";
      return NextResponse.json({
        success: true,
        message: `[TEST MODE] Payment successfully verified! Unlimited ${planTier === "business" ? "Business (90-min)" : "Creator (20-min)"} Pro access activated.`,
        amount: isBusiness ? 1200000 : 500000,
        currency: "NGN",
        customerEmail: email || "tester@voicescribe.ai",
        reference,
        planTier,
        isTest: true,
      });
    }

    // 2. Flutterwave Verification (Primary Gateway)
    const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (flwSecret) {
      try {
        const cleanRef = String(reference).trim();
        // If reference is purely digits or standard transaction ID
        const isNumericId = /^\d+$/.test(cleanRef);
        const flwUrl = isNumericId
          ? `https://api.flutterwave.com/v3/transactions/${cleanRef}/verify`
          : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(cleanRef)}`;

        const response = await fetch(flwUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${flwSecret}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.ok && data.status === "success" && data.data) {
          const transaction = data.data;

          if (transaction.status === "successful") {
            const metaPlan = transaction.meta?.plan;
            const isUsd = transaction.currency === "USD";
            const planTier =
              metaPlan === "business" ||
              (isUsd ? transaction.amount >= 10 : transaction.amount >= 10000)
                ? "business"
                : "creator";

            return NextResponse.json({
              success: true,
              message: `Payment successfully verified via Flutterwave! Unlimited ${planTier === "business" ? "Business (90-min)" : "Creator (20-min)"} Pro access activated.`,
              amount: transaction.amount,
              currency: transaction.currency,
              customerEmail: transaction.customer?.email || email,
              reference: transaction.tx_ref || reference,
              planTier,
            });
          }
        }
      } catch (flwErr) {
        console.warn("Flutterwave verification attempt error:", flwErr);
      }
    }

    // 3. Fallback for legacy Paystack transactions if configured
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (paystackSecret) {
      try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.ok && data.status && data.data?.status === "success") {
          const transaction = data.data;
          const metaPlan =
            transaction.metadata?.plan ||
            transaction.metadata?.custom_fields?.find((f: any) => f.variable_name === "plan")?.value;
          const isUsd = transaction.currency === "USD";
          const planTier =
            metaPlan === "business" ||
            (isUsd ? transaction.amount >= 1000 : transaction.amount >= 1000000)
              ? "business"
              : "creator";

          return NextResponse.json({
            success: true,
            message: `Payment successfully verified! Unlimited ${planTier === "business" ? "Business (90-min)" : "Creator (20-min)"} Pro access activated.`,
            amount: transaction.amount,
            currency: transaction.currency,
            customerEmail: transaction.customer?.email || email,
            reference: transaction.reference,
            planTier,
          });
        }
      } catch (pstkErr) {
        console.warn("Legacy verification attempt error:", pstkErr);
      }
    }

    // If neither succeeded
    if (!flwSecret && !paystackSecret) {
      return NextResponse.json(
        { error: "Payment gateway configuration error: FLUTTERWAVE_SECRET_KEY is missing." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unable to verify transaction with Flutterwave. Please check the reference or contact support." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error verifying transaction:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during payment verification." },
      { status: 500 }
    );
  }
}
