import { VaultAPR, VaultTVL, VaultTags } from "@getnimbus/sui-agent-kit";

export type FARMING_TYPE =
  | "LENDING"
  | "BORROW"
  | "REPAY"
  | "ADD_LP"
  | "REMOVE_LP"
  | "STAKING"
  | "UNSTAKING"
  | "LENDING_WITHDRAW";

export interface IBaseTransactionParams {
  type: FARMING_TYPE;
}

// Interface cho tham số getVaults
export interface IGetVaultsParams {
  address: string;
  order: string;
  protocol: string;
  tvl: VaultTVL;
  apr: VaultAPR;
  tags: VaultTags[];
}

// Interface cho tham số swap
export interface SwapParams {
  fromToken: string;
  toToken: string;
  inputAmount: number;
  slippage: number;
}

export interface FlowXSwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage?: number;
  network?: string;
}

// Interface cho tham số withdraw
export interface IWithdrawParams {
  type: string;
  amount: number;
  symbol: string;
  poolId?: string;
}

// Interface cho tham số lending
export interface ILendingParams {
  type: "LENDING";
  amount: number;
  symbol: string;
}

export interface StakingParams extends IBaseTransactionParams {
  type: "STAKING";
  amount: number;
  symbol: string
}

export interface IUnstakingParams extends IBaseTransactionParams {
  type: "UNSTAKING";
  amount: number;
  symbol: string;
  positionId?: string;
}

export interface ICreateTokenForm {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals?: number | undefined;
  imageUrl?: string | undefined;
  description: string;
  fixedSupply: NonNullable<boolean | undefined>;
}

/**
 * Interface định nghĩa kết quả phân tích trending tokens
 */
export interface TrendingTokensResult {
  network: string;
  timestamp: string;
  tokens: TokenInfo[];
}

/**
 * Interface cho tham số của analyzeTrendingTokens
 */



export interface TokenInfo {
  name: string;
  symbol: string;
  mentionPercentage?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}
export interface BetTopic {
  title: string;
  description: string;
}