import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function generateAIResponse(userMessage: string, model: string = 'gpt-4o-mini') {
  try {
    console.log("Sending message to OpenAI..." + userMessage);
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: "You are a surgeon's assistant. You are helping the surgeon with keeping track of all its tools and recapping where he left them. Keep your responses to 50 words or less. Your name is Sargi." },
        { role: 'user', content: userMessage }
      ],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}