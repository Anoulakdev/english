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
      : `Recent history:\n${JSON.stringify(messages.slice(-4))}\n\nRespond to user's latest statement: "${lastUserMessage}"`;

    const systemPrompt = `You are an expert, encouraging English conversation tutor roleplaying in an interactive practice scenario.
Scenario: "${scenarioTitle || scenarioId}".
Your Character Role: "${speakerName}".
User English Level: "${userLevel}".

Guidelines:
1. Stay in character as "${speakerName}" naturally and engagingly.
2. Reply in concise, realistic, conversational English (1-2 sentences max for fast, natural chat flow).
3. Do NOT lecture. Keep the dialogue moving forward by asking a natural follow-up question or responding directly.
4. Translate your English reply into natural, polite Lao (ພາສາລາວ).
5. Provide a short constructive 1-sentence learning feedback/tip (in Lao or bilingual) on the user's latest sentence.
6. Provide 3 short, natural suggested responses the user could say next (with English and Lao translation).

You MUST respond strictly in valid JSON matching this exact structure:
{"reply":"string","meaning_lao":"string","speakerName":"string","feedback":"string","suggestions":[{"text":"string","meaning_lao":"string"}]}`;

    const contents = [
      {
        role: "user",
        parts: [{ text: promptText }],
      },
    ];

    // Ultra-low-latency conversational models ordered by benchmarked response speed
    const candidateModels: Array<{
      name: string;
      thinkingConfig?: { thinkingBudget?: number; thinkingLevel?: string };
      timeoutMs: number;
    }> = [
      {
        name: "gemini-3-flash-preview",
        thinkingConfig: { thinkingBudget: 0 },
        timeoutMs: 4200,
      },
      {
        name: "gemini-3.1-flash-lite",
        thinkingConfig: { thinkingBudget: 0 },
        timeoutMs: 4200,
      },
      {
        name: "gemini-3.5-flash",
        thinkingConfig: { thinkingBudget: 0 },
        timeoutMs: 4500,
      },
      {
        name: "gemini-3.7-flash",
        timeoutMs: 4500,
      },
      {
        name: "gemini-3.8-flash",
        timeoutMs: 4500,
      },
    ];

    for (const modelCfg of candidateModels) {
      const modelName = modelCfg.name;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

        const geminiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(modelCfg.timeoutMs),
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
              responseMimeType: "application/json",
              ...(modelCfg.thinkingConfig
                ? { thinkingConfig: modelCfg.thinkingConfig }
                : {}),
              temperature: 0.5,
              maxOutputTokens: 350,
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
