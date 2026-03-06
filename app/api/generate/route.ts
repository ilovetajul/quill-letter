import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json({ error: "API key is missing." }, { status: 500 });
    }

    const body = await request.json();
    const { applicationType, subject, applicantInfo, recipientInfo, additionalContext, language, tone } = body;

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an expert Principal Letter Writer. Write a highly professional application letter based on the following details.

Language: ${language || 'English'}
Tone: ${tone || 'Standard'}
Application Type: ${applicationType || 'General Application'}
Subject: ${subject || 'Not specified'}
Applicant Info: ${applicantInfo || 'Not specified'}
Recipient Info: ${recipientInfo || 'Not specified'}
Key Points / Context: ${additionalContext || 'None'}

Instructions:
1. Format the letter perfectly with proper greeting, body, and closing.
2. Output ONLY the letter. No extra text or markdown.
    `;

    const result = await model.generateContent(prompt);
    const letter = result.response.text();

    return NextResponse.json({ letter });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST." }, { status: 405 });
}
