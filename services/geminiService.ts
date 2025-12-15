import { GoogleGenAI } from "@google/genai";
import { SchoolStatus, StatusResponse, GeminiGroundingChunk } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const checkSchoolStatus = async (): Promise<StatusResponse> => {
  const model = 'gemini-2.5-flash';
  const now = new Date();
  
  // LOGIC: If it is after 3:00 PM (15:00), check for the NEXT day.
  // This handles the "night before" check for delays.
  let targetDate = new Date(now);
  if (now.getHours() >= 15) {
    targetDate.setDate(now.getDate() + 1);
  }
  
  // Date formats for search and verification
  const fullDate = targetDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const shortDate = targetDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }); // e.g. "12/15"
  const dateWithYear = targetDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }); // e.g. "12/15/25"
  
  const prompt = `
    I need to determine the EXACT operating status for **Delaware City Schools** in **Delaware, Ohio** for **${fullDate}**.

    **Context:**
    Current System Time: ${now.toLocaleTimeString()}
    Target Date for Status: **${fullDate}** (Look for mentions of "${shortDate}" or "${dateWithYear}")

    **Task:**
    Perform a targeted Google Search to find if schools are **CLOSED** or **DELAYED**.
    Specifically check for the phrase "2 hour delay" associated with the target date.

    **Search Queries:**
    - "Delaware City Schools 2 hour delay ${dateWithYear}"
    - "Delaware City Schools status ${shortDate}"
    - "site:dcs.k12.oh.us"
    - "site:10tv.com Delaware City Schools closings"
    - "site:nbc4i.com Delaware City Schools closings"
    - "Delaware City Schools Facebook"

    **Analysis Rules (Strict):**
    1. **DETECT DELAYS:** Look for "2 Hour Delay", "Two Hour Delay", "Delay", "Closed".
    2. **MATCH DATE:** The alert must apply to **${shortDate}** or **${dateWithYear}** or "Tomorrow" (if the article is from today).
    3. **SPECIFIC PHRASE:** If you see a snippet containing "2 hour delay ${dateWithYear}" or similar, immediately report status as **DELAYED**.
    4. **SOURCE CHECK:** Check snippets from dcs.k12.oh.us, 10tv.com, nbc4i.com, abc6onyourside.com.
    5. **DEFAULT:** Only if ALL sources explicitly show NO alerts for this date, assume OPEN.

    **Response Format:**
    STATUS: [OPEN or CLOSED or DELAYED]
    SUMMARY: [Explain the finding. E.g., "The district website reports a 2-hour delay for ${shortDate}."]
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    // Parse the status
    let status = SchoolStatus.UNKNOWN;
    if (text.includes("STATUS: OPEN")) status = SchoolStatus.OPEN;
    else if (text.includes("STATUS: CLOSED")) status = SchoolStatus.CLOSED;
    else if (text.includes("STATUS: DELAYED")) status = SchoolStatus.DELAYED;

    // Parse the summary
    const summaryMatch = text.split("SUMMARY:");
    const summary = summaryMatch.length > 1 ? summaryMatch[1].trim() : "Unable to retrieve specific details.";

    // Extract sources from grounding metadata
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GeminiGroundingChunk[] | undefined;
    
    const sources = rawChunks
      ?.filter(chunk => chunk.web?.uri && chunk.web?.title)
      .map(chunk => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri || "#"
      })) || [];

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

    return {
      status,
      summary,
      sources: uniqueSources,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkedDate: fullDate,
    };

  } catch (error) {
    console.error("Error checking school status:", error);
    return {
      status: SchoolStatus.UNKNOWN,
      summary: "An error occurred while cross-referencing news sources.",
      sources: [],
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkedDate: fullDate,
    };
  }
};