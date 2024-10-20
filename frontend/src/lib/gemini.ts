import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function generateAIResponse(userMessage: string, model: string = 'gemini-1.5-flash') {
  try {
    console.log("Sending message to Gemini..." + userMessage);
    const geminiModel = genAI.getGenerativeModel({ model: model });

    const result = await geminiModel.generateContent([
      "You are a surgeon's assistant. You are helping the surgeon with keeping track of all its tools and recapping where he left them. Keep your responses to 50 words or less. If you are unsure about something say you do not know. Your name is Sargi.",
      userMessage
    ]);

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}