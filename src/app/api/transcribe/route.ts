import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Ensure the file is not too large (e.g., limit to 25MB as per Groq/Whisper limits)
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 25MB size limit." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      // Mock transcription for testing purposes when no API key is provided.
      console.warn("No GROQ_API_KEY provided. Using mock transcription.");
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return NextResponse.json({
        text: "This is a mock transcription because no GROQ_API_KEY was found in the environment variables. To get real transcriptions, please add your Groq API key to the .env file.\n\nVoiceScribe is an intelligent audio-to-text tool built for accessibility and affordability."
      });
    }

    // Call Groq API
    // Groq's Whisper API endpoint is standard OpenAI compatible:
    // https://api.groq.com/openai/v1/audio/transcriptions
    
    // Create a new FormData instance to send to Groq
    const groqFormData = new FormData();
    groqFormData.append("file", file);
    groqFormData.append("model", "whisper-large-v3-turbo");
    groqFormData.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
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
