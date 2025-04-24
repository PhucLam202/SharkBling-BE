import { Request, Response, NextFunction } from "express";
import { SuiAgentKit } from "@getnimbus/sui-agent-kit";
import { CustomExpress } from "../middlewares/app/customResponse.ts";
import { AppError } from "../middlewares/e/AppError.ts";
import { ErrorCode } from "../middlewares/e/ErrorCode.ts";
import axios from "axios";
import { getTokenAddress, isValidToken } from "../middlewares/token/TokenMapping.ts";

class SuiAgentController {
  private suiAgent: SuiAgentKit;
  private openaiApiKey: string;

  constructor() {
    this.suiAgent = new SuiAgentKit(
      process.env.SUI_PRIVATE_KEY || "",
      process.env.SUI_NETWORK === "mainnet"
        ? "https://fullnode.mainnet.sui.io:443"
        : "https://fullnode.testnet.sui.io:443",
      process.env.OPENAI_API_KEY || ""
    );
    this.openaiApiKey = process.env.OPENAI_API_KEY || "";
  }
  // Method: Handle chat messages
  async handleChatMessage(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ success: false, message: "A valid message is required" });
      }
      const response = await this.processMessageWithAI(message);
      appExpress.response200({ response });
    } catch (e) {
      next(AppError.newError500(ErrorCode.SUI_AGENT_ERROR, `SUI_AGENT_ERROR: ${(e as Error).message}`));
    }
  }

  private async processMessageWithAI(message: string): Promise<string> {
    try {
      const aiResponse = await this.getAIResponse(message);
      const { intent, params } = this.parseAIResponse(aiResponse);
      return await this.executeIntent(intent, params);
    } catch (error) {
      return `Error processing your request: ${(error as Error).message}`;
    }
  }

  private async getAIResponse(message: string): Promise<string> {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that understands blockchain commands. Identify the intent (balance, transfer, swap, stake, getStake, unstake, stakeSuilend, withdrawSuilend, lendingSuilend, getVaults, deployToken) and extract parameters from the user's message. Respond with valid JSON in this exact format: {\"intent\": \"<intent>\", \"params\": {<key>: <value>, ...}}. Do not include any explanations or additional text.",
            },
            { role: "user", content: message },
          ],
          max_tokens: 100,
        },
        { headers: { Authorization: `Bearer ${this.openaiApiKey}`, "Content-Type": "application/json" } }
      );
      const aiContent = response.data.choices[0].message.content;
      console.log(`AI response: ${aiContent}`);
      return aiContent;
    } catch (error) {
      console.error(`Failed to get AI response: ${error}`);
      throw new Error("Failed to communicate with AI service");
    }
  }

  private parseAIResponse(aiResponse: string): { intent: string; params: any } {
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

  private async executeIntent(intent: string, params: any): Promise<string> {
    switch (intent) {
      case "balance":
        return `Your wallet balance: ${JSON.stringify(await this.suiAgent.getHoldings())}`;

      case "transfer": {
        const { token, recipient, amount } = params;
        if (!token || !recipient || !amount) return "Missing parameters: token, recipient, amount";
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) return "Invalid amount. Please provide a number.";
        return `Transfer successful: ${JSON.stringify(await this.suiAgent.transferToken(token, recipient, amountNum))}`;
      }

      case "swap": {
        if (!params || typeof params !== "object") return "Invalid swap parameters.";
        
        try {
          // Lấy thông tin từ params
          const { fromToken, toToken, amount } = params;
          
          if (!fromToken || !toToken || amount === undefined) {
            return "Missing required parameters for swap: fromToken, toToken, amount";
          }
          
          // Kiểm tra token có hợp lệ không
          if (!isValidToken(fromToken)) {
            return `Invalid fromToken: ${fromToken}. Please use a valid token symbol.`;
          }
          
          if (!isValidToken(toToken)) {
            return `Invalid toToken: ${toToken}. Please use a valid token symbol.`;
          }
          
          // Lấy địa chỉ đầy đủ của token
          const fromTokenAddress = getTokenAddress(fromToken);
          const toTokenAddress = getTokenAddress(toToken);
          
          // Check if token addresses were found
          if (!fromTokenAddress) {
            return `Token address not found for: ${fromToken}`;
          }
          
          if (!toTokenAddress) {
            return `Token address not found for: ${toToken}`;
          }
          
          // Tạo đối tượng ISwapParams đúng định dạng
          const swapParams = {
            fromToken: fromTokenAddress,
            toToken: toTokenAddress,
            inputAmount: parseFloat(amount),
            slippage: 0.5 // Mặc định slippage 0.5%
          };
          
          console.log("Formatted swap params:", swapParams);
          
          // Thực hiện swap với tham số đã được định dạng
          const result = await this.suiAgent.swap(swapParams);
          return `Swap successful: ${JSON.stringify(result)}`;
        } catch (error) {
          console.error("Error during swap:", error);
          return `Failed to swap tokens: ${(error as Error).message}`;
        }
      }
      case "stake": {
        const { amount, poolId } = params;
        if (!amount || !poolId) return "Missing parameters: amount, poolId";
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) return "Invalid amount. Please provide a number.";
        return `Stake successful: ${JSON.stringify(await this.suiAgent.stake(amountNum, poolId))}`;
      }

      case "getStake":
        return `Your stake information: ${JSON.stringify(await this.suiAgent.getStake())}`;

      case "unstake": {
        const { stakedSuiId } = params;
        if (!stakedSuiId) return "Missing parameter: stakedSuiId";
        return `Unstake successful: ${JSON.stringify(await this.suiAgent.unstake(stakedSuiId))}`;
      }

      case "stakeSuilend":
        if (!params || typeof params !== "object") return "Invalid stakeSuilend parameters.";
        return `Stake on Suilend: ${JSON.stringify(await this.suiAgent.stakeSuilend(params))}`;

      case "withdrawSuilend":
        if (!params || typeof params !== "object") return "Invalid withdrawSuilend parameters.";
        return `Withdraw from Suilend: ${JSON.stringify(await this.suiAgent.withdrawSuilend(params))}`;

      case "lendingSuilend":
        if (!params || typeof params !== "object") return "Invalid lendingSuilend parameters.";
        return `Lending on Suilend: ${JSON.stringify(await this.suiAgent.lendingSuilend(params))}`;

      case "getVaults":
        if (!params || typeof params !== "object") return "Invalid getVaults parameters.";
        return `Vaults info: ${JSON.stringify(await this.suiAgent.getVaults(params))}`;

      case "deployToken":
        if (!params || typeof params !== "object") return "Invalid deployToken parameters.";
        return `Token deployed: ${JSON.stringify(await this.suiAgent.deployToken(params))}`;

      default:
        return "Unknown command. Available: balance, transfer, swap, stake, getStake, unstake, createPool, registerSns, getSns, stakeSuilend, withdrawSuilend, lendingSuilend, getVaults, deployToken";
    }
  }
}

export default SuiAgentController;
