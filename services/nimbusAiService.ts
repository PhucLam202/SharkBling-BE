// AIService.ts
import axios from "axios";

// Interface định nghĩa kết quả từ AI
export interface AIResponse {
  intent: string;
  params: Record<string, any>;
}

/**
 * Service xử lý các yêu cầu AI
 */
export class AIService {
  private openaiApiKey: string;

  /**
   * Khởi tạo service với OpenAI API Key
   * @param openaiApiKey API key cho OpenAI
   */
  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Gửi tin nhắn tới OpenAI và nhận phản hồi
   * @param message Tin nhắn từ người dùng
   * @returns Phản hồi từ OpenAI dưới dạng string
   */
  async getAIResponse(message: string): Promise<string> {
    // 1. Bắt greeting đơn giản
    const greetingRegex = /^(hi|hello|hey|chào)([\s!.,]?|$)/i;
    if (greetingRegex.test(message.trim())) {
      return "Hi I'm your AI assistant. How can I help you?";
    }

    const commandKeywords = [
      "balance", "transfer", "swap", "stake", "getStake", "unstake",
      "stakeSuilend", "withdrawSuilend", "lendingSuilend", "getVaults",
      "deployToken", "suggestBet", "trendingTokens"
    ];
    const hasCommand = commandKeywords.some(kw =>
      new RegExp(`\\b${kw}\\b`, "i").test(message)
    );

    if (!hasCommand) {
      const chatResp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a friendly blockchain assistant. Answer naturally." },
            { role: "user", content: message },
          ],
          max_tokens: 150,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      return chatResp.data.choices[0].message.content;
    }

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
You are an assistant for blockchain command analysis.
You must extract the user's intent and parameters in structured JSON format.

Available intents:
- "balance"
- "transfer"
- "swap"
- "stake"
- "getStake"
- "unstake"
- "stakeSuilend"
- "withdrawSuilend"
- "lendingSuilend"
- "getVaults"
- "deployToken"
- "suggestBet"
- "trendingTokens"

If user message doesn't match any intent, respond with:
{
  "intent": "unknown",
  "params": {}
}

Respond with EXACTLY this JSON object, no extra text.
`
            },
            { role: "user", content: message },
          ],
          max_tokens: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error(`Failed to get AI response: ${error}`);
      throw new Error("Failed to communicate with AI service");
    }
  }

  /**
   * Phân tích phản hồi từ AI thành đối tượng có cấu trúc
   * @param aiResponse Phản hồi dạng string từ AI
   * @returns Đối tượng AIResponse chứa intent và params
   */
  parseAIResponse(aiResponse: string): AIResponse {
    try {
      const parsed = JSON.parse(aiResponse);
      if (!parsed.intent || typeof parsed.intent !== "string") {
        console.warn(`Invalid AI response format: ${aiResponse}`);
        return { intent: "unknown", params: {} };
      }
      return { intent: parsed.intent, params: parsed.params || {} };
    } catch (e) {
      console.error(`Failed to parse AI response: ${aiResponse}, error: ${e}`);
      return { intent: "unknown", params: {} };
    }
  }

  /**
   * Xử lý tin nhắn với AI và trả về kết quả phân tích
   * @param message Tin nhắn từ người dùng
   * @returns Kết quả phân tích với intent và params
   */
  async processMessage(message: string): Promise<AIResponse> {
    const aiResponse = await this.getAIResponse(message);
    return this.parseAIResponse(aiResponse);
  }
}

export default AIService;
