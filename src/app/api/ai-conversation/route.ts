import { NextRequest, NextResponse } from "next/server";

interface Message {
  speaker: "AI" | "User";
  text: string;
}

interface RequestBody {
  scenarioId: string;
  scenarioTitle?: string;
  speakerName?: string;
  messages: Message[];
  apiKey?: string;
  userLevel?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const {
      scenarioId,
      scenarioTitle,
      speakerName = "AI Partner",
      messages = [],
      apiKey: clientApiKey,
      userLevel = "Intermediate",
    } = body;

    const apiKey =
      (clientApiKey && clientApiKey.trim()) ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || apiKey.trim().length < 5) {
      return NextResponse.json(
        { error: "Gemini API Key is missing or invalid." },
        { status: 400 },
      );
    }

    const userMessages = messages.filter((m) => m.speaker === "User");
    const isFirstTurn = userMessages.length === 0;

    const lastUserMessage = isFirstTurn
      ? `Start the scenario as ${speakerName}`
      : userMessages.slice(-1)[0]?.text || "Hello";

    const promptText = isFirstTurn
      ? `Start the interactive roleplay for scenario: "${scenarioTitle || scenarioId}". Welcome the learner as your character "${speakerName}" in 1-2 natural sentences fitting for level ${userLevel}, and ask an engaging opening question to start.`
      : `Conversation history:\n${JSON.stringify(messages.slice(-6))}\n\nRespond to user's latest statement: "${lastUserMessage}"`;

    const systemPrompt = `You are an expert, encouraging English conversation tutor roleplaying in an interactive practice scenario.
Scenario: "${scenarioTitle || scenarioId}".
Your Character Role: "${speakerName}".
User English Level: "${userLevel}".

Guidelines:
1. Stay in character as "${speakerName}" naturally and engagingly.
2. Reply in concise, realistic, conversational English (1-3 sentences max).
3. Do NOT lecture. Keep the dialogue moving forward by asking a natural follow-up question or responding directly.
4. Translate your English reply into natural, polite Lao (ພາສາລາວ).
5. Provide a short constructive 1-sentence learning feedback/tip (in Lao or bilingual) on the user's latest sentence (grammar, pronunciation tip, or more natural native phrasing).
6. Provide 3 suggested natural responses the user could say next (with English and Lao translation) to help them keep the conversation flowing.

You MUST respond strictly in valid JSON format matching the schema.`;

    const contents = [
      {
        role: "user",
        parts: [{ text: promptText }],
      },
    ];

    // Low-latency conversational models in order of speed & capability
    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
    ];

    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

        const geminiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  reply: { type: "STRING" },
                  meaning_lao: { type: "STRING" },
                  speakerName: { type: "STRING" },
                  feedback: { type: "STRING" },
                  suggestions: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        text: { type: "STRING" },
                        meaning_lao: { type: "STRING" },
                      },
                      required: ["text", "meaning_lao"],
                    },
                  },
                },
                required: [
                  "reply",
                  "meaning_lao",
                  "speakerName",
                  "feedback",
                  "suggestions",
                ],
              },
              temperature: 0.6,
              maxOutputTokens: 800,
            },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candidate = geminiData.candidates?.[0];
          const partWithText =
            candidate?.content?.parts?.find(
              (p: { text?: string; thought?: boolean }) => p.text && !p.thought,
            ) || candidate?.content?.parts?.[0];

          const rawText = partWithText?.text;
          if (rawText) {
            let cleanJson = rawText.trim();
            if (cleanJson.startsWith("```")) {
              cleanJson = cleanJson
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();
            }

            interface GeminiParsedOutput {
              reply?: string;
              meaning_lao?: string;
              speakerName?: string;
              feedback?: string;
              suggestions?: { text: string; meaning_lao: string }[];
            }

            let parsed: GeminiParsedOutput;
            try {
              parsed = JSON.parse(cleanJson) as GeminiParsedOutput;
            } catch {
              const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const sanitized = jsonMatch[0]
                  .replace(/,\s*([\}\]])/g, "$1")
                  .replace(/[\r\n\t]/g, " ");
                parsed = JSON.parse(sanitized) as GeminiParsedOutput;
              } else {
                throw new Error("Unable to extract valid JSON from response");
              }
            }

            return NextResponse.json({
              reply: parsed.reply || "That's great! Tell me more.",
              meaning_lao:
                parsed.meaning_lao || "ດີຫຼາຍ! ເລົ່າໃຫ້ຂ້ອຍຟັງເພີ່ມເຕີມແດ່.",
              speakerName: parsed.speakerName || speakerName,
              feedback: parsed.feedback || "💡 ປະໂຫຍກຂອງເຈົ້າສື່ສານໄດ້ດີຫຼາຍ!",
              suggestions: Array.isArray(parsed.suggestions)
                ? parsed.suggestions
                : [],
            });
          }
        } else {
          const errorText = await geminiRes.text();
          console.warn(
            `Gemini API [${modelName}] returned ${geminiRes.status}:`,
            errorText,
          );
        }
      } catch (modelErr) {
        console.warn(`Error attempting model ${modelName}:`, modelErr);
      }
    }

    throw new Error("All Gemini AI models failed to respond.");
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate AI response";
    console.error("API Error in /api/ai-conversation:", error);
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
