import { Request, Response, NextFunction } from "express";
import { SuiAgentKit } from "@getnimbus/sui-agent-kit";
import { CustomExpress } from "../middlewares/app/customResponse.ts";
import { AppError } from "../middlewares/e/AppError.ts";
import { ErrorCode } from "../middlewares/e/ErrorCode.ts";
import axios from "axios";

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

  // Existing method: Get wallet balance
  async getBalance(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const holdings = await this.suiAgent.getHoldings();
      appExpress.response200({ holdings });
    } catch (e) {
      next(
        AppError.newError500(
          ErrorCode.SUI_AGENT_ERROR,
          `SUI_AGENT_ERROR: ${(e as Error).message}`
        )
      );
    }
  }

  // Existing method: Transfer tokens
  async transferTokens(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const { token, recipient, amount } = req.body;
      if (!token || !recipient || !amount) {
        return res.status(400).json({
          success: false,
          message: "Token, recipient and amount are required",
        });
      }
      const result = await this.suiAgent.transferToken(
        token,
        recipient,
        parseFloat(amount)
      );
      appExpress.response200({ transaction: result });
    } catch (e) {
      next(
        AppError.newError500(
          ErrorCode.SUI_AGENT_ERROR,
          `SUI_AGENT_ERROR: ${(e as Error).message}`
        )
      );
    }
  }

  // Existing method: Swap tokens
  async swapTokens(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const { params } = req.body;
      if (!params) {
        return res.status(400).json({
          success: false,
          message: "Swap parameters are required",
        });
      }
      const result = await this.suiAgent.swap(params);
      appExpress.response200({ transaction: result });
    } catch (e) {
      next(
        AppError.newError500(
          ErrorCode.SUI_AGENT_ERROR,
          `SUI_AGENT_ERROR: ${(e as Error).message}`
        )
      );
    }
  }

  // Method: Handle chat messages
  async handleChatMessage(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const message = req.body.message;
      if (!message || typeof message !== "string") {
        return res.status(400).json({
          success: false,
          message: "A valid message is required",
        });
      }
      const response = await this.processMessageWithAI(message);
      appExpress.response200({ response });
    } catch (e) {
      next(
        AppError.newError500(
          ErrorCode.SUI_AGENT_ERROR,
          `SUI_AGENT_ERROR: ${(e as Error).message}`
        )
      );
    }
  }

  // New method: Process message with AI
  private async processMessageWithAI(message: string): Promise<string> {
    try {
      const aiResponse = await this.getAIResponse(message);
      const { intent, params } = this.parseAIResponse(aiResponse);

      switch (intent) {
        case "balance":
          const holdings = await this.suiAgent.getHoldings();
          return `Your wallet balance: ${JSON.stringify(holdings)}`;
        case "transfer":
          const { token, recipient, amount } = params;
          if (!token || !recipient || !amount) {
            return "Missing parameters for transfer. Required: token, recipient, amount";
          }
          const amountNum = parseFloat(amount);
          if (isNaN(amountNum)) {
            return "Invalid amount. Please provide a number.";
          }
          const transferResult = await this.suiAgent.transferToken(token, recipient, amountNum);
          return `Transfer successful: ${JSON.stringify(transferResult)}`;
        case "swap":
          if (!params || typeof params !== "object") {
            return "Invalid swap parameters. Please provide a JSON object.";
          }
          const swapResult = await this.suiAgent.swap(params);
          return `Swap successful: ${JSON.stringify(swapResult)}`;
        default:
          return "I'm sorry, I didn't understand that. Available commands: balance, transfer, swap";
      }
    } catch (error) {
      return `Error processing your request: ${(error as Error).message}`;
    }
  }

  // New method: Call OpenAI API
  private async getAIResponse(userMessage: string): Promise<string> {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that understands blockchain commands. Identify the intent (balance, transfer, swap) and extract parameters from the user's message. Respond in a structured format: 'intent: <intent>, params: {<key>: <value>, ...}'",
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  }

  // New method: Parse AI response
  private parseAIResponse(aiResponse: string): { intent: string; params: any } {
    let intent = "";
    let params: any = {};

    const intentMatch = aiResponse.match(/intent:\s*(\w+)/);
    if (intentMatch) {
      intent = intentMatch[1];
    }

    const paramsMatch = aiResponse.match(/params:\s*({.*})/);
    if (paramsMatch) {
      try {
        params = JSON.parse(paramsMatch[1]);
      } catch (e) {
        console.error("Failed to parse params:", e);
      }
    }

    return { intent, params };
  }

  // Existing method (not used in chatbot but included for completeness)
  async checkBalances(agent: SuiAgentKit) {
    const myWalletBalance = await agent.getHoldings();
    console.log("My wallet balance:", myWalletBalance);
  }
}

export default SuiAgentController;