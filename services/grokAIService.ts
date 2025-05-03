import OpenAI from "openai";
import { AppError } from "../middlewares/e/AppError.ts";
import { ErrorCode } from "../middlewares/e/ErrorCode.ts";
import { AnalysisResult } from "../types/grokAI.ts";
import { ReputabilityTheme } from "../types/grokAI.ts";

// Theme instance tailored for evaluating X/Twitter post reliability
const xPostReputabilityTheme: ReputabilityTheme = {
  analyzePrefix:
    "Please analyze this X/Twitter post and evaluate its reputability: ",
  structuredOutputPrompt: `
Please respond in JSON format strictly matching this schema:
{
  "isReputable": boolean,
  "confidence": number,        // confidence score 0-100
  "reasoning": string,         // detailed explanation supporting your judgment
  "keyFactors": string[],      // list of main factors considered
  "recommendation": string     // suggested action based on analysis
}
`,
};

// Theme for analyzing trending Sui tokens
export const trendingTokensTheme: ReputabilityTheme = {
  analyzePrefix:
    "Please analyze the most mentioned Sui ecosystem tokens on X in the past 24 hours: ",
  structuredOutputPrompt: `
Please respond in JSON format strictly matching this schema:
{
  "tokens": [
    {
      "name": string,          // Token name
      "symbol": string,        // Token symbol
      "mentions": number,      // Number of mentions
      "relevance": string,     // Relevance to Sui ecosystem
      "sentiment": string,     // "positive", "negative", or "neutral"
      "reasoning": string      // Brief explanation for the sentiment
    }
  ]
}
`,
};

/**
 * Service to interact with Grok-like AI model for structured analysis.
 */
class GrokAIService {
  private client: OpenAI;
  private readonly theme: ReputabilityTheme;

  constructor(theme: ReputabilityTheme = xPostReputabilityTheme) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error("XAI_API_KEY environment variable is not defined");
    }

    this.client = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
    this.theme = theme;
  }

  /**
   * Generates a chat completion with optional structured output.
   * @param content The main content to analyze (e.g., tweet text).
   * @param structured Whether to append the JSON schema prompt.
   */
  public async generateCompletion(
    content: string,
    useAnalysisPrefix = true,
    structured = true
  ): Promise<string | AnalysisResult> {
    try {
      let prompt = useAnalysisPrefix
        ? `${this.theme.analyzePrefix}${content}`
        : content;
      if (structured) prompt += this.theme.structuredOutputPrompt;

      const completion = await this.client.chat.completions.create({
        model: "grok-3-mini-beta",
        messages: [{ role: "user", content: prompt }],
      });
      const raw = completion.choices[0].message.content || "";
      if (structured) {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            return parsed.tokens ? parsed : (parsed as AnalysisResult);
          } catch {
            console.warn("JSON parse error");
          }
        }
      }
      return raw;
    } catch (error) {
      console.error("Error in generateCompletion:", error);
      throw new Error(
        `Failed to generate completion: ${(error as Error).message}`
      );
    }
  }
  public async generateInfluencer(screenname: string): Promise<string> {
    const prompt = `analyze crypto trends`;
    const res = await this.client.chat.completions.create({
      model: "grok-3-mini-beta",
      messages: [
        {
          role: "system",
          content:
            `Analyze user with ${screenname} and provide EXACTLY 2 bold predictions in {title, description} format.
            Each title must be catchy, provocative and description must be concise and intriguing.
            Focus on high-risk, high-reward scenarios that would make exciting betting opportunities.
            Return only 2 {title, description} pairs in JSON format, with no additional explanations.
            Do NOT mention any specific influencer names in the predictions.
            Example prediction: "SUI price might skyrocket to $10 within weeks, creating millionaires overnight.","With next project will addapt Sui to the next level."`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 1,
    });
    
    let content = res.choices[0].message.content?.trim() || "";
    
    // Handle response object conversion to JSON
    if (typeof content === 'object') {
      return JSON.stringify(content, null, 2);
    }
    
    // Existing code for handling string content
    try {
      // Tìm và trích xuất phần JSON từ phản hồi
      const jsonMatch = content.match(/(\[\s*{[\s\S]*?}\s*\])|({[\s\S]*?title[\s\S]*?})/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      
      // Nếu phản hồi là JSON hợp lệ, phân tích nó
      const parsed = JSON.parse(content);
      
      // Nếu là mảng, lấy tối đa 2 phần tử đầu tiên
      return Array.isArray(parsed)
      ? JSON.stringify(parsed.slice(0, 2), null, 2)
      : JSON.stringify([parsed], null, 2);

    } catch (e) {
      return content;
    }
  }

  /**
   * Public method to evaluate the reputability of an X/Twitter post.
   * @param postContent The text content of the post to analyze.
   */
  async evaluatePostReputability(postContent: string): Promise<AnalysisResult> {
    const result = await this.generateCompletion(postContent, true);
    if (typeof result === "string") {
      throw AppError.newError500(
        ErrorCode.GROK_API_ERROR,
        "Unexpected non-JSON response from reputability evaluation"
      );
    }
    return result;
  }
}

export default GrokAIService;

// Sử dụng GrokAIService với trendingTokensTheme
const grokService = new GrokAIService(trendingTokensTheme);
