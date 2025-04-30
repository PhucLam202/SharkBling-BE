// Define output structure interfaces
export interface AnalysisResult {
    isReputable: boolean;
    confidence: number;
    reasoning: string;
    keyFactors: string[];
    recommendation: string;
    // Additional fields for trending tokens analysis
    detailed_analysis?: string;
    summary?: string;
    trending_tokens?: Array<{
      name: string;
      symbol: string;
    }>;
    tokens?: Array<{
      name: string;
      symbol: string;
      mentions?: number;
      relevance?: string;
      sentiment?: string;
      reasoning?: string;
    }>;
  }

  /**
 * Theme definition for reputability evaluation of X/Twitter posts.
 * Defines prompt templates and structured output format.
 */
export interface ReputabilityTheme {
  /** Prefix to introduce the analysis task */
  analyzePrefix: string;
  /** JSON schema prompt for structured output */
  structuredOutputPrompt: string;
}

