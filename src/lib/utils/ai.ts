/**
 * Utility to robustly parse JSON from AI responses.
 * Handles markdown code blocks and conversational filler.
 */
export function parseAIJson<T>(text: string): T {
  const cleanText = text.trim();

  // 1. Try direct parsing
  try {
    return JSON.parse(cleanText) as T;
  } catch (err) {
    // 2. Try extracting JSON object or array using regex
    const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch (innerErr) {
        console.error("Failed to parse extracted JSON:", jsonMatch[0]);
      }
    }
  }

  throw new Error("Could not extract valid JSON from AI response.");
}
