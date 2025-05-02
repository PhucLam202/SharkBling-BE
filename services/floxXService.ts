import {
  Coin,
  AggregatorQuoter, // Import AggregatorQuoter
  Route as SDKRoute,
  TradeBuilder,
  Commission,
  NETWORK,
} from "@flowx-finance/sdk";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import dotenv from "dotenv";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { FlowXSwapParams } from "../types/blockchain.ts";

dotenv.config();

interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage?: number;
  network?: string;
}

export class FlowXService {
  /**
   * Fetch routes using AggregatorQuoter
   * @param suiClient SuiClient instance
   * @param inputToken Input token address
   * @param outputToken Output token address
   * @param amountIn Input amount (in smallest unit)
   * @returns Array of routes
   */

  async getRoutes(
    inputToken: string,
    outputToken: string,
    amountIn: string
  ): Promise<SDKRoute<Coin, Coin>[]> {
    try {
      const network = "mainnet";
      const quoter = new AggregatorQuoter(network);
      const params = {
        tokenIn: inputToken,
        tokenOut: outputToken,
        amountIn: amountIn,
      };

      if (typeof amountIn !== "string" || !/^\d+$/.test(amountIn)) {
        console.warn(
          `⚠️ amountIn "${amountIn}" used invalid format. etc 1000000).`
        );
        throw new Error("amountIn format is invalid");
      }

      const routesResult = await quoter.getRoutes(params);
      if (
        !routesResult ||
        !routesResult.routes ||
        routesResult.routes.length === 0
      ) {
        throw new Error(`No routes found for ${inputToken} -> ${outputToken}`);
      }

      // Kiểm tra routes
      routesResult.routes.forEach((route, index) => {
        if (
          typeof route.amountIn !== "string" ||
          !/^\d+$/.test(route.amountIn)
        ) {
          throw new Error(
            `Invalid routes[${index}].amountIn: Must be a string of digits`
          );
        }
        if (
          typeof route.amountOut !== "string" ||
          !/^\d+$/.test(route.amountOut)
        ) {
          throw new Error(
            `Invalid routes[${index}].amountOut: Must be a string of digits`
          );
        }
        route.paths.forEach((path, pathIndex) => {
          if (
            typeof path.amountIn !== "string" ||
            !/^\d+$/.test(path.amountIn)
          ) {
            throw new Error(
              `Invalid routes[${index}].paths[${pathIndex}].amountIn: Must be a string of digits`
            );
          }
          if (
            typeof path.amountOut !== "string" ||
            !/^\d+$/.test(path.amountOut)
          ) {
            throw new Error(
              `Invalid routes[${index}].paths[${pathIndex}].amountOut: Must be a string of digits`
            );
          }
        });
      });

      console.log("Routes fetched successfully:", routesResult.routes);
      return routesResult.routes as SDKRoute<Coin, Coin>[];
    } catch (error) {
      console.error("Failed to fetch routes:", error);
      throw error;
    }
  }
  /**
   * Thực hiện swap token trên FlowX protocol
   * @param params Thông số swap (inputToken, outputToken, amountIn, slippage, network)
   * @returns Kết quả giao dịch
   */
  async FlowXSwap(params: SwapParams): Promise<any> {
    console.log("paramL", params);
    try {
      const { tokenIn, tokenOut, amountIn, slippage } = params;
      const network = "mainnet";
      // Initialize Sui client
      const client = new SuiClient({ url: getFullnodeUrl(network) });

      // Initialize wallet from mnemonic
      const mnemonic = process.env.SUI_MNEMONIC;
      if (!mnemonic) {
        throw new Error("SUI_MNEMONIC not found in environment variables");
      }
      const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
      const sender = keypair.toSuiAddress();

      // Kiểm tra sender
      if (!sender.match(/^0x[0-9a-fA-F]{64}$/)) {
        throw new Error("Invalid sender address");
      }
      console.log("Sender address:", sender);

      // Kiểm tra slippage
      if (typeof slippage !== "number" || isNaN(slippage) || slippage <= 0) {
        throw new Error("Invalid slippage: Must be a positive number");
      }
      const slippageValue = slippage * 1e6;
      if (!Number.isInteger(slippageValue)) {
        throw new Error(
          "Slippage value must result in an integer after scaling"
        );
      }

      // Fetch routes
      const router = await this.getRoutes(tokenIn, tokenOut, amountIn);
      console.log("Routes fetched:", router);

      // Kiểm tra router
      router.forEach((route, index) => {
        if (
          typeof route.amountIn !== "string" ||
          !/^\d+$/.test(route.amountIn)
        ) {
          throw new Error(
            `Invalid route[${index}].amountIn: Must be a string of digits`
          );
        }
        if (
          typeof route.amountOut !== "string" ||
          !/^\d+$/.test(route.amountOut)
        ) {
          throw new Error(
            `Invalid route[${index}].amountOut: Must be a string of digits`
          );
        }
        route.paths.forEach((path, pathIndex) => {
          if (
            typeof path.amountIn !== "string" ||
            !/^\d+$/.test(path.amountIn)
          ) {
            throw new Error(
              `Invalid route[${index}].paths[${pathIndex}].amountIn: Must be a string of digits`
            );
          }
          if (
            typeof path.amountOut !== "string" ||
            !/^\d+$/.test(path.amountOut)
          ) {
            throw new Error(
              `Invalid route[${index}].paths[${pathIndex}].amountOut: Must be a string of digits`
            );
          }
        });
      });

      // Lấy amountOut từ routes
      const amountOut = router[0]?.amountOut || "0";
      console.log("Amount out:", amountOut);

      // Kiểm tra amountIn và amountOut
      if (typeof amountIn !== "string" || !/^\d+$/.test(amountIn)) {
        throw new Error("Invalid amountIn: Must be a string of digits");
      }
      if (typeof amountOut !== "string" || !/^\d+$/.test(amountOut)) {
        throw new Error("Invalid amountOut: Must be a string of digits");
      }

      const tradeBuilder = new TradeBuilder(network, router);

      // Log input parameters
      console.log("Input parameters:", {
        sender,
        amountIn,
        amountOut,
        slippage: slippageValue,
        deadline: Date.now() + 3600 * 1000,
      });

      // Build trade
      const trade = tradeBuilder
        .sender(sender)
        .amountIn(amountIn)
        .slippage(slippageValue)
        .deadline(Date.now() + 3600 * 1000)
        .amountOut(amountOut)
        .build();

      console.log("Trade built:", trade);

      // Execute swap
      const txn = new Transaction();
      txn.setSender(sender);
      const coinOut = await trade.swap({
        tx: txn as any,
        client: client as any,
      });
      txn.setGasBudget(100000000);
      if (!coinOut) {
        throw new Error("Swap failed, no output returned");
      }
      txn.transferObjects([coinOut], sender);

      const response = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: txn,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
          showBalanceChanges: true,
          showInput: true,
        },
        requestType: "WaitForLocalExecution",
      });
      // Truy vấn chi tiết giao dịch
      const txDetails = await client.getTransactionBlock({
        digest: response.digest,
        options: {
          showEffects: true,
          showEvents: true,
          showBalanceChanges: true,
          showObjectChanges: true,
          showInput: true,
        },
      });

      const status = response?.effects?.status?.status;

      return {
        success: status === "success",
        digest: response?.digest,
        explorerUrl: `https://suiscan.xyz/mainnet/tx/${response?.digest}`,
        sender,
      };
    } catch (error) {
      console.error("FlowX swap failed:", error);
      throw new Error(
        `Failed to execute swap: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
