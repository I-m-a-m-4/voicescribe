import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "belloimam431@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const email = (formData.get("email") as string | null) || "";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Ensure the file is not too large (limit to 25MB as per Groq/Whisper limits)
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 25MB size limit." },
        { status: 400 }
      );
    }

    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (isAdmin) {
      console.log(`[Admin Access] Unlimited transcription granted for: ${email}`);
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.warn("No GROQ_API_KEY provided. Using mock transcription.");
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      return NextResponse.json({
        text: "This is a mock transcription because no GROQ_API_KEY was found in the environment variables. VoiceScribe is ready to transcribe real audio once your key is configured."
      });
    }

    // Call Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append("file", file);
    groqFormData.append("model", "whisper-large-v3-turbo");
    groqFormData.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error:", errorText);
      return NextResponse.json(
        { error: "Transcription failed. Please try again later." },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("Error transcribing file:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during processing." },
      { status: 500 }
    );
  }
}
