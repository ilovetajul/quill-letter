import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Vercel-এর জন্য সবচেয়ে ফাস্ট এবং সিকিউর রানটাইম
export const runtime = "edge"; 

export async function POST(request) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.error("Vercel Error: GEMINI_API_KEY পাওয়া যাচ্ছে না।");
      return NextResponse.json({ error: "API key is missing." }, { status: 500 });
    }

    // ফ্রন্টএন্ড থেকে ইউজারের দেওয়া ডাটাগুলো রিসিভ করা
    const body = await request.json();
    const { applicationType, subject, applicantInfo, recipientInfo, keyPoints, language, tone } = body;

    // Google Gemini ইনিশিয়ালাইজ করা
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // এআই-এর জন্য প্রফেশনাল প্রম্পট তৈরি করা
    const prompt = `
    You are an expert Principal Letter Writer. Write a highly professional application letter based on the following details.
    
    Language: ${language || 'Bengali'}
    Tone: ${tone || 'Standard'}
    Application Type: ${applicationType || 'General Application'}
    Subject: ${subject || 'Not specified'}
    Applicant Info: ${applicantInfo || 'Not specified'}
    Recipient Info: ${recipientInfo || 'Not specified'}
    Key Points / Context: ${keyPoints || 'None'}
    
    Instructions:
    1. If 'Key Points / Context' is provided, seamlessly weave these specific details and problems into the main body of the application letter.
    2. Format the letter perfectly with proper greeting, body, and closing.
    3. Output ONLY the application letter. Do NOT include any conversational filler, markdown formatting blocks (like \`\`\`), or extra text.
    `;

    // এআই থেকে দরখাস্ত জেনারেট করা
    const result = await model.generateContent(prompt);
    const letter = result.response.text();

    return NextResponse.json({ letter });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Quill API] Full error:", msg);
    return NextResponse.json({ 
      error: msg 
    }, { status: 500 });
  }
}
