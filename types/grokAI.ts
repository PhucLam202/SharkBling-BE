// Define output structure interfaces
export interface AnalysisResult {
    isReputable: boolean;
    confidence: number;
    reasoning: string;
    keyFactors: string[];
    recommendation: string;
  }