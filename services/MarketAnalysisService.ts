// MarketAnalysisService.ts
import dayjs from "dayjs";
import GrokAIService, {
  trendingTokensTheme,
} from "../services/grokAIService.ts";
import {
  TokenInfo,
  TrendingTokensResult,
} from "../types/blockchain.ts";

/**
 * Service phân tích thị trường crypto
 */
export class MarketAnalysisService {
  async analyzeTrendingTokens(): Promise<TrendingTokensResult> {
    const currentTime = dayjs();
    const timestamp = currentTime.format();
    try {
      // Explicitly use the trending tokens theme
      const grokService = new GrokAIService(trendingTokensTheme);

      const aiResult = await grokService.generateCompletion(
        "ignore this parameter, theme defines prompt"
      );
      console.log("result AI GROK get trending tokens", aiResult);
      // Try to extract a valid JSON object with tokens
      let tokens: TokenInfo[];
      if (typeof aiResult === 'string') {
        throw new Error("Unexpected non-JSON response from AI");
      } else if (Array.isArray((aiResult as any).tokens)) {
        tokens = (aiResult as any).tokens.map((item: any) => ({
          name: item.name,
          symbol: item.symbol,
          mentions: item.mentions,
          relevance: item.relevance,
          sentiment: item.sentiment,
          reasoning: item.reasoning,
        }));
      } else {
        throw new Error("AI response does not contain tokens array");
      }
    
      return {
        network: "sui",
        timestamp,
        tokens,
      };

    } catch (error) {
      console.error("Error in analyzeTrendingTokens:", error);
      throw new Error(
        `Failed to analyze trending tokens: ${(error as Error).message}`
      );
    }
  }

  /**
   * Trích xuất thông tin token từ JSON
   * @param jsonString Chuỗi JSON chứa thông tin token
   * @returns Mảng các đối tượng TokenInfo
   */
  private extractTrendingTokensWithDetails(jsonString: string): TokenInfo[] {
    try {
      // Try to parse the JSON string
      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (error) {
        throw new Error("Invalid JSON format");
      }

      // Check if data is an array directly or if it's in a nested structure
      let tokensArray;

      if (Array.isArray(data)) {
        tokensArray = data;
      } else if (data && typeof data === "object") {
        // Check for common response structures
        if (Array.isArray(data.tokens)) {
          tokensArray = data.tokens;
        } else {
          // Try to find any array property in the object
          const arrayProps = Object.keys(data).filter((key) =>
            Array.isArray(data[key])
          );
          if (arrayProps.length > 0) {
            tokensArray = data[arrayProps[0]];
          } else {
            throw new Error("Expected an array of tokens");
          }
        }
      } else {
        throw new Error("Expected an array of tokens");
      }

      if (!Array.isArray(tokensArray) || tokensArray.length === 0) {
        throw new Error("No valid tokens found in response");
      }

      return tokensArray
        .filter((item: any) => this.validateTokenInfo(item))
        .map((item: any) => ({
          name: item.name,
          symbol: item.symbol,
          mentionPercentage: item.mentionPercentage || item.mentions || 0,
          sentiment: item.sentiment as "positive" | "neutral" | "negative",
        }));
    } catch (error) {
      throw new Error(
        `Failed to parse token data: ${(error as Error).message}`
      );
    }
  }

  /**
   * Kiểm tra tính hợp lệ của thông tin token
   * @param token Đối tượng token từ JSON
   * @returns True nếu token hợp lệ, false nếu không
   */
  private validateTokenInfo(token: any): boolean {
    return (
      typeof token.name === "string" &&
      typeof token.symbol === "string" &&
      (typeof token.mentionPercentage === "number" ||
        token.mentionPercentage === undefined) &&
      ["positive", "neutral", "negative"].includes(token.sentiment)
    );
  }

  /**
   * Phân tích top coins
   * @param params Tham số phân tích
   * @returns Kết quả phân tích dạng string JSON
   */
}

export default MarketAnalysisService;
