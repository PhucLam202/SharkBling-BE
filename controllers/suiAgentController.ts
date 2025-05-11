import { Request, Response, NextFunction } from "express";
import { IGetVaultsParams, SuiAgentKit } from "@getnimbus/sui-agent-kit";
import { CustomExpress } from "../middlewares/app/customResponse.ts";
import { AppError } from "../middlewares/e/AppError.ts";
import { ErrorCode } from "../middlewares/e/ErrorCode.ts";
import { FlowXService } from "../services/floxXService.ts";
import AIService from "../services/nimbusAiService.ts";
import BlockchainService from "../services/BlockchainService.ts";
import MarketAnalysisService from "../services/MarketAnalysisService.ts";
import GrokAIService from "../services/grokAIService.ts";
import {
  StakingParams,
  IUnstakingParams,
  ILendingParams,
  ICreateTokenForm,
  FlowXSwapParams,
} from "../types/blockchain.ts";
import { suiInfluencers } from "../types/data/influencer.ts";
import { getTokenAddress } from "../middlewares/token/TokenMapping.ts";

/**
 * Controller điều phối các yêu cầu từ người dùng tới các services
 */
class SuiAgentController {
  private aiService: AIService;
  private blockchainService: BlockchainService;
  private marketAnalysisService: MarketAnalysisService;
  private flowXService: FlowXService;

  /**
   * Khởi tạo controller với các services cần thiết
   */
  constructor() {
    const openaiApiKey = process.env.OPENAI_API_KEY || "";
    const suiNetwork =
      process.env.SUI_NETWORK === "mainnet"
        ? "https://fullnode.mainnet.sui.io:443"
        : "https://fullnode.testnet.sui.io:443";
    const suiPrivateKey = process.env.SUI_PRIVATE_KEY || "";

    // Khởi tạo SuiAgentKit
    const suiAgent = new SuiAgentKit(suiPrivateKey, suiNetwork, openaiApiKey);

    // Khởi tạo các services
    this.aiService = new AIService(openaiApiKey);
    this.blockchainService = new BlockchainService(suiAgent);
    this.marketAnalysisService = new MarketAnalysisService();
    this.flowXService = new FlowXService();
  }

  /**
   * Xử lý tin nhắn chat từ người dùng
   */
  async handleChatMessage(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({
          success: false,
          message: "A valid message is required",
        });
      }
      const response = await this.processMessageWithAI(message);
      appExpress.response200({ response });
    } catch (error) {
      next(
        AppError.newError500(
          ErrorCode.SUI_AGENT_ERROR,
          `SUI_AGENT_ERROR: ${(error as Error).message}`
        )
      );
    }
  }


 private async processMessageWithAI(message: string): Promise<string> {
  console.log("User message:", message);

  const aiRaw = await this.aiService.getAIResponse(message);

  if (aiRaw.trim().startsWith("{")) {
    const { intent, params } = this.aiService.parseAIResponse(aiRaw);

    if (intent && intent !== "unknown") {
      return await this.executeIntent(intent, params);
    }
    return await this.executeIntent(intent, params);
  }
  return aiRaw;
}

  private async suggestBetFromInfluencers(): Promise<string> {
    const grokService = new GrokAIService();
    const results: string[] = [];
    let counter = 1;

    for (const influencer of suiInfluencers) {
      try {
        const tweets = await grokService.generateInfluencer(influencer.screenname);
        if (tweets?.trim()) {
          results.push(`${counter}. ${tweets}`);
          counter++;
        }
      } catch (err) {
        console.warn(`Failed for ${influencer.screenname}: ${err}`);
      }
    }

    return results.length > 0
      ? results.join("\n\n")
      : "No predictions available from influencers.";
  }

  private convertDecimalToInteger(
    decimalValue: string,
    decimals: number = 9
  ): string {
    if (!decimalValue || isNaN(Number(decimalValue))) {
      throw new Error("Invalid decimal value");
    }
    const integerValue = Math.round(
      Number(decimalValue) * Math.pow(10, decimals)
    );
    return integerValue.toString();
  }

  /**
   * Thực thi intent được phân tích từ tin nhắn người dùng
   */
  private async executeIntent(
    intent: string,
    params: Record<string, any>
  ): Promise<string> {
    console.log("Executing intent:", intent);
    // Map intent -> handler function
    const handlers: Record<
      string,
      (p: Record<string, any>) => Promise<string>
    > = {
      balance: async () => this.blockchainService.getBalance(),

      transfer: async (p) => this.blockchainService.transferToken(p),

      swap: async (p) => {
        const tokenIn = getTokenAddress(p.fromToken || p.tokenIn);
        const tokenOut = getTokenAddress(p.toToken || p.tokenOut);
        if (!tokenIn || !tokenOut) {
          return `Error: Missing address for ${p.fromToken || p.tokenIn} or ${p.toToken || p.tokenOut}`;
        }
        const flowParams: FlowXSwapParams = {
          tokenIn,
          tokenOut,
          amountIn: p.amount
            ? this.convertDecimalToInteger(p.amount.toString())
            : p.inputAmount?.toString() || p.amountIn?.toString(),
          slippage: 1,
        };
        return this.flowXService.FlowXSwap(flowParams);
      },

      stake: async (p) => this.blockchainService.stakeTokens(p),

      getStake: async () => this.blockchainService.getStakeInfo(),

      unstake: async (p) => this.blockchainService.unstakeTokens(p),

      stakeSuilend: async (p) => {
        const sParams: StakingParams = { type: "STAKING", amount: Number(p.amount), symbol: p.symbol };
        return this.blockchainService.stakeSuilend(sParams);
      },

      withdrawSuilend: async (p) => {
        const uParams: IUnstakingParams = { type: "UNSTAKING", amount: Number(p.amount), symbol: p.symbol, positionId: p.positionId };
        return this.blockchainService.withdrawSuilend(uParams);
      },

      lendingSuilend: async (p) => {
        const lParams: ILendingParams = { type: "LENDING", amount: Number(p.amount), symbol: p.symbol };
        return this.blockchainService.lendingSuilend(lParams);
      },

      getVaults: async (p) => {
        const vParams: IGetVaultsParams = {
          address: p.address || "",
          order: p.order || "desc",
          protocol: p.protocol || "",
          tvl: p.tvl || "ALL",
          apr: p.apr || "ALL",
          tags: p.tags || [],
        };
        return this.blockchainService.getVaults(vParams);
      },

      deployToken: async (p) => {
        const tParams: ICreateTokenForm = {
          name: p.name,
          symbol: p.symbol,
          totalSupply: p.totalSupply,
          decimals: p.decimals,
          imageUrl: p.imageUrl,
          description: p.description || "",
          fixedSupply: p.fixedSupply !== false,
        };
        return this.blockchainService.deployToken(tParams);
      },

      suggestBet: async () => this.suggestBetFromInfluencers(),

      trendingTokens: async () => {
        const res = await this.marketAnalysisService.analyzeTrendingTokens();
        return JSON.stringify(res);
      },
    };

    if (!handlers[intent]) {
      const list = Object.keys(handlers).join(", ");
      return `Unknown command. Available: ${list}`;
    }

    // Thực thi chung trong try/catch
    try {
      return await handlers[intent](params);
    } catch (err) {
      return `Command execution failed: ${(err as Error).message}`;
    }
  }
}

export default SuiAgentController;
