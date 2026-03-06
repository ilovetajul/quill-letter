import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// 1. Switch to Edge runtime. It is faster, has no cold starts, 
// and is the recommended runtime for AI APIs on Vercel.
export const runtime = "edge"; 

export async function POST(request: NextRequest) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.error("Server Error: GEMINI_API_KEY is missing in Vercel Environment Variables.");
      return NextResponse.json({ error: "API key is not configured." }, { status: 500 });
    }

    // 2. Safely parse the body. If the frontend doesn't send a body, it won't crash.
    let body = {};
    try {
      body = await request.json();
    } catch (parseError) {
      console.warn("Warning: No valid JSON body received from frontend.");
    }

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.72, maxOutputTokens: 2048 },
    });

    // You can dynamically pass prompts from your frontend body like this:
    // const prompt = body.prompt || "Write a test letter";
    const prompt = "Write a test letter"; 

    // 4. Generate Content
    const result = await model.generateContent(prompt);
    const letter = result.response.text();

    return NextResponse.json({ letter });

  } catch (error: any) {
    // 5. THIS IS THE MOST IMPORTANT PART FOR VERCEL
    // This will log the actual error (e.g., Quota Exceeded, Invalid Key, Network Error) to your Vercel Runtime Logs.
    console.error("Gemini API Error Details:", error.message || error);
    
    return NextResponse.json(
      { 
        error: "Failed to generate letter", 
        details: error.message || "Unknown error occurred" 
      }, 
      { status: 500 }
    );
  }
    }
