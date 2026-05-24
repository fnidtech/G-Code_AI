import { GoogleGenerativeAI } from "@google/generative-ai";
import { UIMessage } from "@/lib/types";
import { getSystemPrompt } from "@/lib/prompt";
import { Language } from "@/lib/types";

export const maxDuration = 120; // increased from 60 seconds to allow Gemini to finish longer responses

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }

    const { messages, language = "id" }: { messages: UIMessage[]; language?: Language } =
      await req.json();

    // Get the system prompt
    const systemPrompt = getSystemPrompt(language);

    // Convert UIMessage format to Gemini format
    const conversationHistory = messages
      .map((msg) => {
        const text = msg.parts
          ?.filter((p) => p.type === "text")
          .map((p) => (p as { type: "text"; text: string }).text)
          .join("") || "";

        return {
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text }],
        };
      });

    // Get the model - Using Gemini 2.5 Flash for better performance
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Get the last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === "user");
    const userContent = lastUserMessage?.parts
      ?.filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("") || "";

    // Prepare chat history with system prompt prepended to first message
    const history = conversationHistory.slice(0, -1); // Exclude last message
    
    // Add system prompt to the first user message if this is the start of conversation
    let finalHistory = history;
    if (history.length === 0 || (history.length === 1 && history[0].role === "user")) {
      const firstMessage = history.length > 0 ? history[0] : { role: "user", parts: [{ text: "" }] };
      if (firstMessage.role === "user") {
        firstMessage.parts[0] = { 
          text: `${systemPrompt}\n\n${firstMessage.parts[0].text}` 
        };
      }
      finalHistory = [firstMessage];
    }

    // Start chat session with history
    const chat = model.startChat({
      history: finalHistory,
      generationConfig: {
        maxOutputTokens: 8192, // Increased to 8192 to ensure long educational content is never cut off
        temperature: 0.7,
      },
    });

    // Send message and get streaming response
    const result = await chat.sendMessageStream(userContent);

    // Create SSE stream from Gemini stream
const encoder = new TextEncoder();

const readableStream = new ReadableStream({
  async start(controller) {
    // Send message start
    const messageStart = {
      type: "message-start",
      message: {
        role: "assistant",
        content: [],
      },
    };
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify(messageStart)}\n\n`)
    );

    // Stream each chunk as it arrives, with error handling and finalization
    try {
      for await (const chunk of result.stream) {
        if (chunk.candidates?.[0]?.content?.parts?.[0]) {
          const text = (chunk.candidates[0].content.parts[0] as { text: string }).text || "";
          
          // Log raw chunk to server terminal
          console.log(`[GEMINI RAW CHUNK] ${text}`);
          
          const delta = {
            type: "text-delta",
            delta: text,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(delta)}\n\n`)
          );
        }
      }
    } catch (e) {
      console.error("Streaming error:", e);
    } finally {
      // Send message stop regardless of success/failure
      const messageStop = {
        type: "message-stop",
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(messageStop)}\n\n`)
      );
      controller.close();
    }
  },
});

return new Response(readableStream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  },
});
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process chat request";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
