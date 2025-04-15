import { SuiClient } from '@mysten/sui.js/client';
import dotenv from 'dotenv';

dotenv.config();

// Check if SUI_NETWORK is defined
if (!process.env.SUI_NETWORK) {
  throw new Error("SUI_NETWORK environment variable is not defined");
}



// Determine network URL based on environment variable
const getNetworkUrl = () => {
  switch (process.env.SUI_NETWORK) {
    case 'mainnet':
      return 'https://fullnode.mainnet.sui.io:443';
    case 'testnet':
      return 'https://fullnode.testnet.sui.io:443';
    case 'devnet':
      return 'https://fullnode.devnet.sui.io:443';
    default:
      return 'https://fullnode.testnet.sui.io:443';
  }
};

// Create Sui client
export const suiClient = new SuiClient({
  url: getNetworkUrl(),
});