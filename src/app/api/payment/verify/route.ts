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

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured in environment variables.");
      return NextResponse.json(
        { error: "Payment gateway configuration error." },
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

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified! Unlimited Pro access activated.",
      amount: transaction.amount,
      currency: transaction.currency,
      customerEmail: transaction.customer?.email || email,
      reference: transaction.reference,
    });
  } catch (error: any) {
    console.error("Error verifying Paystack transaction:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during payment verification." },
      { status: 500 }
    );
  }
}
