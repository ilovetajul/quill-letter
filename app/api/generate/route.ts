import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function buildPrompt(data: any): string {
  const { applicationType, subject, applicantInfo, recipientInfo, language, tone, additionalContext } = data;
  const toneMap: Record<string, string> = {
    "Highly Formal": "exceptionally formal and authoritative. Use sophisticated vocabulary. Avoid all contractions.",
    "Standard": "professional yet approachable. Clear and respectful.",
    "Urgent": "formal but time-sensitive. Convey urgency without being rude.",
  };
  const langInstruction = language === "Bengali"
    ? "Write the ENTIRE letter in standard Bengali (বাংলা) script. Use formal register. Use honorifics like জনাব, মহোদয়।"
    : "Write the ENTIRE letter in formal English. Ensure grammatical perfection.";

  return `You are a world-class professional letter writer with 25+ years of experience.

TASK: Write a complete ${applicationType} in ${language}.

DETAILS:
- Type: ${applicationType}
- Language: ${language}
- Tone: ${tone} — ${toneMap[tone] || "professional"}
- Subject: ${subject}

APPLICANT INFO:
${applicantInfo}

RECIPIENT INFO:
${recipientInfo}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}\n` : ""}
LANGUAGE RULE: ${langInstruction}

REQUIRED STRUCTURE:
1. Sender name and contact (top)
2. Date (formal format)
3. Recipient name, designation, organization, address
4. Subject line: "Subject: ..."
5. Salutation
6. Opening paragraph
7. Body paragraphs (2-3)
8. Closing paragraph
9. Complimentary close
10. Signature

STRICT RULES:
- Output ONLY the letter. Nothing before or after.
- NO preamble like "Here is your letter"
- NO markdown (no **, no ##)
- NO explanations after the letter
- Write the COMPLETE letter

Write the letter now:`;
}

export async function POST(request: NextRequest) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });

  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const { subject, applicantInfo, recipientInfo, language, tone, applicationType } = body;
  if (!applicationType) return NextResponse.json({ error: "Application type is required." }, { status: 422 });
  if (!subject?.trim()) return NextResponse.json({ error: "Subject is required." }, { status: 422 });
  if (!applicantInfo?.trim()) return NextResponse.json({ error: "Applicant info is required." }, { status: 422 });
  if (!recipientInfo?.trim()) return NextResponse.json({ error: "Recipient info is required." }, { status: 422 });
  if (!["English","Bengali"].includes(language)) return NextResponse.json({ error: "Invalid language." }, { status: 422 });
  if (!["Highly Formal","Standard","Urgent"].includes(tone)) return NextResponse.json({ error: "Invalid tone." }, { status: 422 });

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.72, topK: 40, topP: 0.92, maxOutputTokens: 2048 },
    });

    const result = await model.generateContent(buildPrompt(body));
    let letterText = result.response.text();
    if (!letterText?.trim()) return NextResponse.json({ error: "AI could not generate a letter. Please try again." }, { status: 422 });

    letterText = letterText.trim()
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^#{1,6}\s+/gm, "");

    return NextResponse.json({ letter: letterText, tokensUsed: result.response.usageMetadata?.totalTokenCount }, { status: 200, headers: { "Cache-Control": "no-store" } });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) return NextResponse.json({ error: "API quota exceeded. Try again later." }, { status: 429 });
    return NextResponse.json({ error: "Failed to generate letter. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST." }, { status: 405 });
}
