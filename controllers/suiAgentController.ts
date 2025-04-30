// SuiAgentController.ts
import { Request, Response, NextFunction } from "express";
import { IGetVaultsParams, SuiAgentKit } from "@getnimbus/sui-agent-kit";
import { CustomExpress } from "../middlewares/app/customResponse.ts";
import { AppError } from "../middlewares/e/AppError.ts";
import { ErrorCode } from "../middlewares/e/ErrorCode.ts";
import AIService from "../services/nimbusAiService.ts";
import BlockchainService from "../services/BlockchainService.ts";
import MarketAnalysisService from "../services/MarketAnalysisService.ts";
import GrokAIService from "../services/grokAIService.ts";
import generateInfluencer from "../services/grokAIService.ts";
import {
  StakingParams,
  IUnstakingParams,
  ILendingParams,
  ICreateTokenForm,
} from "../types/blockchain.ts";
import { suiInfluencers } from "../types/data/influencer.ts";
import { getUserInfo } from "../services/x/xService.ts";

/**
 * Controller điều phối các yêu cầu từ người dùng tới các services
 */
class SuiAgentController {
  private aiService: AIService;
  private blockchainService: BlockchainService;
  private marketAnalysisService: MarketAnalysisService;

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
  }

  /**
   * Xử lý tin nhắn chat từ người dùng
   * @param req Request object
   * @param res Response object
   * @param next NextFunction
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

  /**
   * Xử lý tin nhắn với AI và thực thi lệnh tương ứng
   * @param message Tin nhắn từ người dùng
   * @returns Kết quả xử lý dạng string
   */
  private async processMessageWithAI(message: string): Promise<string> {
    console.log(message);
    try {
      // Lấy phản hồi từ AI và phân tích intent
      const { intent, params } = await this.aiService.processMessage(message);
      console.log(intent, params);
      // Thực thi intent tương ứng
      return await this.executeIntent(intent, params);
    } catch (error) {
      return `Error processing your request: ${(error as Error).message}`;
    }
  }
  private async suggestBetFromInfluencers(): Promise<string> {
    const grokService = new GrokAIService();
    let results: string[] = [];
    let counter = 1;

    for (const influencer of suiInfluencers) {
      const screenname = influencer.screenname;
      console.log("screenname", screenname);
      try {
        const tweets = await grokService.generateInfluencer(screenname);
        
        if (tweets && tweets.trim() !== "") {
          // Thêm số thứ tự cho mỗi influencer
          results.push(`${counter}.\n${tweets}`);
          counter++;
        }
      } catch (err) {
        console.warn(
          `⚠️ Failed to process tweets for ${influencer.name}: ${err}`
        );
        continue;
      }
    }

    return results.length > 0 ? results.join("\n\n") : "No predictions available from influencers.";
  }
  /**
   * Thực thi intent được phân tích từ tin nhắn người dùng
   * @param intent Intent được xác định
   * @param params Các tham số cho intent
   * @returns Kết quả thực thi dạng string
   */
  private async executeIntent(
    intent: string,
    params: Record<string, any>
  ): Promise<string> {
    console.log("intent",intent)
    console.log("params",params)
    try {
      switch (intent) {
        case "balance":
          return await this.blockchainService.getBalance();

        case "transfer":
          return await this.blockchainService.transferToken(params);

        case "swap":
          return await this.blockchainService.swapTokens(params);

        case "stake":
          return await this.blockchainService.stakeTokens(params);

        case "getStake":
          return await this.blockchainService.getStakeInfo();

        case "unstake":
          return await this.blockchainService.unstakeTokens(params);

        case "stakeSuilend":
          // Chuyển đổi params thành StakingParams
          const stakingParams: StakingParams = {
            type: "STAKING",
            amount: Number(params.amount),
            symbol: params.symbol,
          };
          return await this.blockchainService.stakeSuilend(stakingParams);

        case "withdrawSuilend":
          // Chuyển đổi params thành IUnstakingParams
          const unstakingParams: IUnstakingParams = {
            type: "UNSTAKING",
            amount: Number(params.amount),
            symbol: params.symbol,
            positionId: params.positionId,
          };
          return await this.blockchainService.withdrawSuilend(unstakingParams);

        case "lendingSuilend":
          // Chuyển đổi params thành ILendingParams
          const lendingParams: ILendingParams = {
            type: "LENDING",
            amount: Number(params.amount),
            symbol: params.symbol,
          };
          return await this.blockchainService.lendingSuilend(lendingParams);

        case "getVaults":
          // Chuyển đổi params thành IGetVaultsParams
          const vaultParams: IGetVaultsParams = {
            address: params.address || "",
            order: params.order || "desc",
            protocol: params.protocol || "",
            tvl: params.tvl || "ALL",
            apr: params.apr || "ALL",
            tags: params.tags || [],
          };
          return await this.blockchainService.getVaults(vaultParams);

        case "deployToken":
          // Chuyển đổi params thành ICreateTokenForm
          const tokenParams: ICreateTokenForm = {
            name: params.name,
            symbol: params.symbol,
            totalSupply: params.totalSupply,
            decimals: params.decimals,
            imageUrl: params.imageUrl,
            description: params.description || "",
            fixedSupply: params.fixedSupply === false ? false : true,
          };
          return await this.blockchainService.deployToken(tokenParams);

        case "suggestBet":
          return await this.suggestBetFromInfluencers();
          case "trendingTokens":
            const result = await this.marketAnalysisService.analyzeTrendingTokens();
            return JSON.stringify(result);

        default:
          return "Unknown command. Available: balance, transfer, swap, stake, getStake, unstake, stakeSuilend, withdrawSuilend, lendingSuilend, getVaults, deployToken, topcoin, trendingTokens";
      }
    } catch (error) {
      return `Command execution failed: ${(error as Error).message}`;
    }
  }
}

export default SuiAgentController;
