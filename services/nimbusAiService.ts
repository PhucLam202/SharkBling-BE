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

- "trendingTokens": user wants to list or analyze trending tokens on the Sui network (e.g., "show me hot tokens", "top Sui tokens today").
- "suggestBet": user wants help creating a fun betting topic, description or idea — especially if it involves trending tokens, influencers, or speculative ideas.
- Other intents: "balance", "transfer", "swap", "stake", "getStake", "unstake", "stakeSuilend", "withdrawSuilend", "lendingSuilend", "getVaults", "deployToken".

If the user combines multiple ideas, return the one that is the *main action* (e.g., if the user wants trending tokens AND a bet idea based on them, choose "suggestBet").

Respond with:
{
  "intent": "<intent>",
  "params": { <key>: <value> }
}

DO NOT include explanations, preambles, or additional text.
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
        return { intent: "", params: {} };
      }
      return { intent: parsed.intent, params: parsed.params || {} };
    } catch (e) {
      console.error(`Failed to parse AI response: ${aiResponse}, error: ${e}`);
      return { intent: "", params: {} };
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