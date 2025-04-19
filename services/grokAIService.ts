import OpenAI from "openai";
import { AppError } from "../middlewares/e/AppError.ts";
import { ErrorCode } from "../middlewares/e/ErrorCode.ts";
import { AnalysisResult } from "../types/grokAI.ts";

/**
 * Theme definition for reputability evaluation of X/Twitter posts.
 * Defines prompt templates and structured output format.
 */
interface ReputabilityTheme {
  /** Prefix to introduce the analysis task */
  analyzePrefix: string;
  /** JSON schema prompt for structured output */
  structuredOutputPrompt: string;
}

// Theme instance tailored for evaluating X/Twitter post reliability
const xPostReputabilityTheme: ReputabilityTheme = {
  analyzePrefix: "Please analyze this X/Twitter post and evaluate its reputability: ",
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
    useAnalysisPrefix: boolean = true,
    structured: boolean = true
  ): Promise<string | AnalysisResult> {
    try {
      // Build the prompt using the theme
      let prompt = useAnalysisPrefix ? `${this.theme.analyzePrefix}${content}` : content;
      if (structured) {
        prompt += this.theme.structuredOutputPrompt;
      }

      const completion = await this.client.chat.completions.create({
        model: "grok-3-mini-beta",
        messages: [
          { role: "user", content: prompt }
        ]
      });

      const raw = completion.choices[0].message.content || "";

      if (structured) {
        // Extract JSON block
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            return JSON.parse(match[0]) as AnalysisResult;
          } catch (err) {
            console.warn("JSON parse error:", err);
          }
        }
      }
      return raw;
    } catch (error: any) {
      throw AppError.newError500(
        ErrorCode.GROK_API_ERROR,
        `GROK_API_ERROR: ${(error as Error).message}`
      );
    }
  }

  /**
   * Public method to evaluate the reputability of an X/Twitter post.
   * @param postContent The text content of the post to analyze.
   */
  async evaluatePostReputability(
    postContent: string
  ): Promise<AnalysisResult> {
    const result = await this.generateCompletion(postContent, true);
    if (typeof result === 'string') {
      throw AppError.newError500(
        ErrorCode.GROK_API_ERROR,
        'Unexpected non-JSON response from reputability evaluation'
      );
    }
    return result;
  }
}

export default GrokAIService;
