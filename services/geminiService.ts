import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getMotivationalQuote = async (completedTasks: number, focusMinutes: number): Promise<string> => {
  const client = getClient();
  if (!client) return "Keep pushing forward! You're doing great.";

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Give me a short, punchy, 1-sentence motivational quote for a developer/worker who has completed ${completedTasks} tasks and focused for ${focusMinutes} minutes today. Make it sound like a friendly AI companion. Do not use quotes.`,
    });
    return response.text || "Focus is the key to success. Keep going!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Great job staying consistent today!";
  }
};

export const getDailyInsight = async (tasks: string[]): Promise<string> => {
  const client = getClient();
  if (!client) return "Reviewing your tasks helps you stay organized.";

  try {
    const taskList = tasks.join(", ");
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Here are my tasks for today: ${taskList}. Give me one short, actionable piece of advice on how to prioritize or tackle this list efficiently. Max 20 words.`,
    });
    return response.text || "Tackle the hardest task first to gain momentum.";
  } catch (error) {
    return "Prioritize what matters most.";
  }
};
