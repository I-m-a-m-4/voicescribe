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

    // 2. Check if Flutterwave transaction
    const isFlutterwave = reference.startsWith("flw_") || reference.startsWith("vs_flw_");
    if (isFlutterwave) {
      const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY;
      if (!flwSecret) {
        console.error("FLUTTERWAVE_SECRET_KEY is not configured in environment variables.");
        return NextResponse.json(
          { error: "Payment gateway configuration error: FLUTTERWAVE_SECRET_KEY missing." },
          { status: 500 }
        );
      }

      // If reference contains numeric ID or transaction reference
      const txId = reference.replace("vs_flw_", "").replace("flw_", "");
      const flwUrl = !isNaN(Number(txId))
        ? `https://api.flutterwave.com/v3/transactions/${txId}/verify`
        : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`;

      const response = await fetch(flwUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${flwSecret}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.status !== "success") {
        console.error("Flutterwave verification failure:", data);
        return NextResponse.json(
          { error: data.message || "Failed to verify payment with Flutterwave." },
          { status: 400 }
        );
      }

      const transaction = data.data;
      if (transaction.status !== "successful") {
        return NextResponse.json(
          { error: `Payment not completed. Status: ${transaction.status}` },
          { status: 400 }
        );
      }

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

    // 3. Paystack verification
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured in environment variables.");
      return NextResponse.json(
        { error: "Payment gateway configuration error: PAYSTACK_SECRET_KEY missing." },
        { status: 500 }
      );
    }

    // Verify transaction with Paystack API
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("Paystack verification failure:", data);
      return NextResponse.json(
        { error: data.message || "Failed to verify payment with Paystack." },
        { status: 400 }
      );
    }

    const transaction = data.data;

    // Verify that the transaction actually succeeded
    if (transaction.status !== "success") {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${transaction.status}` },
        { status: 400 }
      );
    }

    // Determine plan from metadata or amount (>= ₦10,000 or >= $10 is Business)
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
  } catch (error: any) {
    console.error("Error verifying Paystack transaction:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during payment verification." },
      { status: 500 }
    );
  }
}
