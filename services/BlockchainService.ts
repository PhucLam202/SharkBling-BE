// BlockchainService.ts
import { SuiAgentKit } from "@getnimbus/sui-agent-kit";
import {
  getTokenAddress,
  isValidToken,
} from "../middlewares/token/TokenMapping.ts";
import {
  ICreateTokenForm,
  IGetVaultsParams,
  ILendingParams,
  IUnstakingParams,
  StakingParams,
  SwapParams,
} from "../types/blockchain.js";

/**
 * Service xử lý các thao tác blockchain
 */
export class BlockchainService {
  private suiAgent: SuiAgentKit;

  /**
   * Khởi tạo service với SuiAgentKit
   * @param suiAgent Instance của SuiAgentKit
   */
  constructor(suiAgent: SuiAgentKit) {
    this.suiAgent = suiAgent;
  }

  /**
   * Lấy thông tin số dư ví
   * @returns Thông tin số dư dạng string
   */
  async getBalance(): Promise<string> {
    try {
      const holdings = await this.suiAgent.getHoldings();
      return `Your wallet balance: ${JSON.stringify(holdings)}`;
    } catch (error) {
      throw new Error(`Failed to get balance: ${(error as Error).message}`);
    }
  }

  /**
   * Chuyển token tới một địa chỉ
   * @param params Các tham số chuyển token
   * @returns Kết quả giao dịch dạng string
   */
  async transferToken(params: Record<string, any>): Promise<string> {
    const { token, recipient, amount } = params;

    if (!token || !recipient || !amount) {
      throw new Error("Missing parameters: token, recipient, amount");
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      throw new Error("Invalid amount. Please provide a number.");
    }

    try {
      const result = await this.suiAgent.transferToken(
        token,
        recipient,
        amountNum
      );
      return `Transfer successful: ${JSON.stringify(result)}`;
    } catch (error) {
      throw new Error(`Transfer failed: ${(error as Error).message}`);
    }
  }

  /**
   * Thực hiện swap token
   * @param params Các tham số swap
   * @returns Kết quả swap dạng string
   */
  async swapTokens(params: Record<string, any>): Promise<string> {
    const { fromToken, toToken, amount } = params;

    if (!fromToken || !toToken || amount === undefined) {
      throw new Error(
        "Missing required parameters for swap: fromToken, toToken, amount"
      );
    }

    if (!isValidToken(fromToken)) {
      throw new Error(
        `Invalid fromToken: ${fromToken}. Please use a valid token symbol.`
      );
    }

    if (!isValidToken(toToken)) {
      throw new Error(
        `Invalid toToken: ${toToken}. Please use a valid token symbol.`
      );
    }

    const fromTokenAddress = getTokenAddress(fromToken);
    const toTokenAddress = getTokenAddress(toToken);

    if (!fromTokenAddress) {
      throw new Error(`Token address not found for: ${fromToken}`);
    }

    if (!toTokenAddress) {
      throw new Error(`Token address not found for: ${toToken}`);
    }

    const swapParams: SwapParams = {
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      inputAmount: parseFloat(amount),
      slippage: 0.5, // Mặc định slippage 0.5%
    };

    try {
      const result = await this.suiAgent.swap(swapParams);
      return `Swap successful: ${JSON.stringify(result)}`;
    } catch (error) {
      throw new Error(`Failed to swap tokens: ${(error as Error).message}`);
    }
  }

  /**
   * Thực hiện stake token
   * @param params Các tham số stake
   * @returns Kết quả stake dạng string
   */
  async stakeTokens(params: Record<string, any>): Promise<string> {
    const { amount, poolId } = params;

    if (!amount || !poolId) {
      throw new Error("Missing parameters: amount, poolId");
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      throw new Error("Invalid amount. Please provide a number.");
    }

    try {
      const result = await this.suiAgent.stake(amountNum, poolId);
      return `Stake successful: ${JSON.stringify(result)}`;
    } catch (error) {
      throw new Error(`Stake failed: ${(error as Error).message}`);
    }
  }

  /**
   * Lấy thông tin stake
   * @returns Thông tin stake dạng string
   */
  async getStakeInfo(): Promise<string> {
    try {
      const stake = await this.suiAgent.getStake();
      return `Your stake information: ${JSON.stringify(stake)}`;
    } catch (error) {
      throw new Error(`Failed to get stake info: ${(error as Error).message}`);
    }
  }

  /**
   * Thực hiện unstake token
   * @param params Các tham số unstake
   * @returns Kết quả unstake dạng string
   */
  async unstakeTokens(params: Record<string, any>): Promise<string> {
    const { stakedSuiId } = params;

    if (!stakedSuiId) {
      throw new Error("Missing parameter: stakedSuiId");
    }

    try {
      const result = await this.suiAgent.unstake(stakedSuiId);
      return `Unstake successful: ${JSON.stringify(result)}`;
    } catch (error) {
      throw new Error(`Unstake failed: ${(error as Error).message}`);
    }
  }

  /**
   * Thực hiện stake trên Suilend
   * @param params Các tham số stake Suilend
   * @returns Kết quả stake Suilend dạng string
   */
  async stakeSuilend(params: StakingParams): Promise<string> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid stakeSuilend parameters");
    }

    if (params.type !== "STAKING" || !params.amount || !params.symbol) {
      throw new Error("Missing required parameters: type, amount, symbol");
    }

    try {
      const result = await this.suiAgent.stakeSuilend(params);
      return `Stake on Suilend: ${JSON.stringify(result)}`;
    } catch (error) {
      throw new Error(`Suilend stake failed: ${(error as Error).message}`);
    }
  }

  /**
   * Thực hiện rút token từ Suilend
   * @param params Các tham số rút token
   * @returns Kết quả rút token dạng string
   */
  async withdrawSuilend(params: IUnstakingParams): Promise<string> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid withdrawSuilend parameters");
    }

    if (params.type !== "UNSTAKING" || !params.amount || !params.symbol) {
      throw new Error("Missing required parameters: type, amount, symbol");
    }

    try {
      const result = await this.suiAgent.withdrawSuilend(params);
      return `Withdraw from Suilend: ${JSON.stringify(result)}`;
    } catch (error) {
      throw new Error(`Suilend withdraw failed: ${(error as Error).message}`);
    }
  }

  /**
   * Thực hiện cho vay trên Suilend
   * @param params Các tham số cho vay
   * @returns Kết quả cho vay dạng string
   */
  async lendingSuilend(params: ILendingParams): Promise<string> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid lendingSuilend parameters");
    }

    if (params.type !== "LENDING" || !params.amount || !params.symbol) {
      throw new Error("Missing required parameters: type, amount, symbol");
    }

    try {
      const result = await this.suiAgent.lendingSuilend(params);
      return `Lending on Suilend: ${JSON.stringify(result)}`;
    } catch (error) {
      throw new Error(`Suilend lending failed: ${(error as Error).message}`);
    }
  }
  /**
   * Lấy thông tin kho Suilend
   * @param params Các tham số truy vấn kho
   * @returns Thông tin kho dạng string
   */
  async getVaults(params: Record<string, any>): Promise<string> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid getVaults parameters");
    }

    try {
      // Chuyển đổi params thành IGetVaultsParams
      const vaultParams: IGetVaultsParams = {
        address: params.address,
        order: params.order,
        protocol: params.protocol,
        tvl: params.tvl,
        apr: params.apr,
        tags: params.tags || [],
      };

      const result = await this.suiAgent.getVaults(vaultParams);
      return `Vaults info: ${JSON.stringify(result)}`;
    } catch (error) {
      throw new Error(`Failed to get vaults: ${(error as Error).message}`);
    }
  }

  /**
   * Triển khai token mới
   * @param params Các tham số triển khai token
   * @returns Kết quả triển khai dạng string
   */
  async deployToken(params: ICreateTokenForm): Promise<string> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid deployToken parameters");
    }

    try {
      const result = await this.suiAgent.deployToken(params);
      return `Token deployed: ${JSON.stringify(result)}`;
    } catch (error) {
      throw new Error(`Token deployment failed: ${(error as Error).message}`);
    }
  }
}

export default BlockchainService;
