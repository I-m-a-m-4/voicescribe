import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "belloimam431@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const email = (formData.get("email") as string | null) || "";

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Ensure the file is within 25MB Groq Whisper limit
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 25MB size limit." },
        { status: 400, headers: corsHeaders }
      );
    }

    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (isAdmin) {
      console.log(`[Admin Access] Unlimited transcription granted for: ${email}`);
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.warn("No GROQ_API_KEY provided in environment. Using mock transcription.");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return NextResponse.json(
        { text: "This is a mock transcription because GROQ_API_KEY is not configured. Please add your Groq API key to your environment variables." },
        { headers: corsHeaders }
      );
    }

    // Convert file to buffer/blob with filename for Groq API
    const fileBytes = await file.arrayBuffer();
    const fileBlob = new Blob([fileBytes], { type: file.type || "audio/mpeg" });

    const translate = formData.get("translate") === "true";

    const groqFormData = new FormData();
    groqFormData.append("file", fileBlob, file.name || "recording.mp3");
    
    // whisper-large-v3-turbo does not support translation, so we fall back to whisper-large-v3
    const model = translate ? "whisper-large-v3" : "whisper-large-v3-turbo";
    groqFormData.append("model", model);
    groqFormData.append("response_format", "json");

    const endpoint = translate
      ? "https://api.groq.com/openai/v1/audio/translations"
      : "https://api.groq.com/openai/v1/audio/transcriptions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq Whisper API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `Transcription service error (${response.status}): ${errorText}` },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Error transcribing file:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during processing." },
      { status: 500, headers: corsHeaders }
    );
  }
}
