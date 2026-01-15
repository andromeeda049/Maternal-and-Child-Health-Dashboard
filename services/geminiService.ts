import { GoogleGenAI } from "@google/genai";
import { DashboardMetrics } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDashboardData = async (metrics: DashboardMetrics): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';

    // Summarize data for the AI
    const dataSummary = JSON.stringify({
      totalCases: metrics.totalCases,
      topAgencies: metrics.casesByAgency.slice(0, 5),
      topIndicators: metrics.casesByIndicator.slice(0, 5),
      recentTrend: metrics.monthlyTrend.slice(-3)
    }, null, 2);

    const prompt = `
      You are a Public Health Data Analyst for a hospital network in Thailand. Analyze the following KPI data.
      
      Data Summary (JSON):
      ${dataSummary}

      Please provide a response in Markdown format (You can write in English or Thai, but English is preferred for professional reports unless specific local context is strong):
      1. **Situation Overview**: A summary of the current volume of cases/reports.
      2. **Key Observations**: Which hospitals/units are reporting the most cases? Which indicators are highest?
      3. **Trends**: Is the trend increasing or decreasing in the last 3 months?
      4. **Recommendations**: Suggestions for resource allocation or further investigation based on the data.
      
      Tone: Professional, clinical, and data-driven.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "## Analysis Unavailable\n\nUnable to connect to the AI service. Please check your network or API settings.";
  }
};
